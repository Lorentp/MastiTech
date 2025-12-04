const CowModel = require("../models/cow.model")
const mongoose = require("mongoose")
const TreatmentModel = require("../models/treatment.model")
const TreatmentsManager = require("../managers/treatments-manager")
const treatmentsManager = new TreatmentsManager();
const moment = require("moment-timezone")

class CowManager {

    // Obtener el tratamiento actual de una vaca (último no finalizado)
    getCurrentTreatmentEntry(cow) {
        const history = Array.isArray(cow.treatmentsHistory) ? cow.treatmentsHistory : [];
        const active = history.filter(t => !t.finished).sort((a, b) => b.startDate - a.startDate)[0];
        return active || null;
    }

    // Calcular turno actual
    calculateCurrentTurn(startDate, startTurn) {
        const now = moment().tz("America/Argentina/Buenos_Aires");
        const start = moment(startDate).tz("America/Argentina/Buenos_Aires");
        const startHour = startTurn === 'morning' ? 0 : 12;
        start.set({ hour: startHour, minute: 0, second: 0 });
        const hoursDiff = now.diff(start, 'hours');
        return Math.max(1, Math.floor(hoursDiff / 12) + 1);
    }

    // Agregar vaca a tratamiento (NUEVA LÓGICA)
    async addCowToTreatment({
        name,
        udders,
        severity,
        startDate,
        startTurn,
        treatmentId,
        owner,
        confirmReMastitis = false
    }) {
        try {
        // 1. Buscamos el tratamiento original (para sacar los datos)
        const treatment = await TreatmentModel.findOne({
            _id: treatmentId,
            owner
        });

        if (!treatment) {
            throw new Error("Tratamiento no encontrado o no pertenece al usuario");
        }

        // 2. Parseamos fechas y calculamos todo
        const start = moment(startDate).tz("America/Argentina/Buenos_Aires");
        const startHour = startTurn === "morning" ? 0 : 12;
        start.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });

        const startDateWithTurn = start.toDate();
        const endDate = moment(start).add(treatment.duration * 12, "hours").toDate();
        const endDateDiscardMilk = moment(start).add(treatment.milkDiscardTurns * 12, "hours").toDate();

        // 3. Buscamos si la vaca ya existe
        let cow = await CowModel.findOne({ owner, name: name.trim().toUpperCase() });

        // 4. RE-MASTITIS: chequeamos si ya tuvo un tratamiento en los últimos 14 días
        let reMastitisWarning = null;
        let isReMastitis = false;
        let reMastitisMeta = null;
        if (cow) {
            // Buscamos el ultimo tratamiento finalizado para usar la fecha real de fin de medicacion
            const recentEntry = (cow.treatmentsHistory || [])
                .filter(t => t.endDate)
                .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];

            if (recentEntry?.endDate) {
                const daysSinceEnd = moment(startDateWithTurn).diff(moment(recentEntry.endDate), "days", true);
                if (daysSinceEnd < 14) {
                    isReMastitis = true;
                    reMastitisMeta = {
                        previousTreatment: recentEntry.treatmentSnapshot?.title || "Tratamiento previo",
                        previousTreatmentEndDate: recentEntry.endDate,
                        daysSinceEnd: Math.max(0, Math.floor(daysSinceEnd))
                    };
                    if (!confirmReMastitis) {
                        reMastitisWarning = {
                            message: `RE-MASTITIS: este animal terminó "${reMastitisMeta.previousTreatment}" el ${moment(recentEntry.endDate).format("DD/MM/YYYY")} y se está reiniciando a los ${Math.max(0, Math.floor(daysSinceEnd))} días. Confirmar para continuar.`,
                            ...reMastitisMeta
                        };
                        return { cow: null, reMastitisWarning };
                    }
                }
            }
        }

        // 5. CREAR O ACTUALIZAR VACA
        if (!cow) {
            cow = new CowModel({
                owner,
                name: name.trim().toUpperCase(),
                events: 1,
                treatmentsHistory: [],
                lastTreatmentsSummary: []
            });
        } else {
            cow.events += 1;
            const nowClosing = new Date();
            // Cerrar cualquier tratamiento/descarte previo para evitar duplicados
            cow.treatmentsHistory.forEach(entry => {
                if (!entry.finished) entry.finished = true;
                if (!entry.milkDiscardCompletedAt) entry.milkDiscardCompletedAt = nowClosing;
            });
        }

        // 6. SNAPSHOT INMUTABLE DEL TRATAMIENTO (¡ESTO ARREGLA TODOS LOS ERRORES DE VALIDACIÓN!)
        const treatmentSnapshot = {
            title: treatment.title,
            duration: treatment.duration,
            medications: treatment.medications.map(m => ({
                name: m.name,
                applyEveryTurns: m.applyEveryTurns,
                applyUntilTurn: m.applyUntilTurn
            })),
            milkDiscardTurns: treatment.milkDiscardTurns
        };

        // 7. NUEVA ENTRADA EN EL HISTORIAL
        const newTreatmentEntry = {
            treatmentSnapshot,
            startDate: startDateWithTurn,
            endDate,
            startTurn,
            severity,
            udders: Array.isArray(udders) ? udders : [udders].filter(Boolean),
            treatedTurns: [],
            finished: false,
            endDateDiscardMilk,
            milkDiscardCompletedAt: null,
            isReMastitis,
            reMastitisPreviousTreatmentTitle: reMastitisMeta?.previousTreatment || null,
            reMastitisPreviousEndDate: reMastitisMeta?.previousTreatmentEndDate || null
        };

        // 8. PUSH SEGURO (gracias al default: [] en el modelo)
        cow.treatmentsHistory.push(newTreatmentEntry);

        // 9. Actualizamos resumen rápido para re-mastitis
        cow.lastTreatmentsSummary = cow.lastTreatmentsSummary.filter(t =>
            t.endDate >= moment().subtract(30, "days").toDate()
        );
        cow.lastTreatmentsSummary.push({
            treatmentId: treatment._id,
            title: treatment.title,
            endDate
        });

        await cow.save();

        // 10. Devolvemos la vaca con datos útiles para el frontend
        const activeEntry = cow.treatmentsHistory[cow.treatmentsHistory.length - 1];

        return {
            success: true,
            cow: {
                ...cow.toObject(),
                currentTreatmentSnapshot: activeEntry.treatmentSnapshot,
                currentTreatmentEntry: activeEntry,
                currentTurn: this.calculateCurrentTurn(activeEntry.startDate, activeEntry.startTurn),
                medicationSchedule: TreatmentsManager.generateMedicationSchedule(activeEntry.treatmentSnapshot)
            },
            reMastitisWarning: null
        };

        } catch (error) {
            console.error("Error en addCowToTreatment:", error);
            throw error;
        }
    }

    generateSchedule(treatment) {
        return TreatmentsManager.generateMedicationSchedule(treatment);
    }

    // Marcar turno como tratado
    async markCowAsTreated(cowId, turn, userId) {
        const cow = await CowModel.findOne({ _id: cowId, owner: userId });
        if (!cow) throw new Error("Vaca no encontrada o sin tratamiento activo");

        const currentEntry = this.getCurrentTreatmentEntry(cow);
        if (!currentEntry) throw new Error("No hay tratamiento activo");

        const currentTurn = this.calculateCurrentTurn(currentEntry.startDate, currentEntry.startTurn);
        // Usamos el turno actual calculado para evitar errores por desfasaje entre cliente/servidor
        const turnToApply = currentTurn;

        if (!currentEntry.treatedTurns.includes(turnToApply)) {
            currentEntry.treatedTurns.push(turnToApply);
            await cow.save();
        }

        const updatedEntry = this.getCurrentTreatmentEntry(cow);

        return {
            success: true,
            cow: {
                ...cow.toObject(),
                currentTurn,
                medicationSchedule: TreatmentsManager.generateMedicationSchedule(updatedEntry.treatmentSnapshot)
            }
        };
    }

    // Finalizar descarte de leche
    async finalizeMilkDiscard(cowId, userId) {
        const cow = await CowModel.findOne({ _id: cowId, owner: userId });
        if (!cow) throw new Error("Vaca no encontrada");

        // Buscamos el último tratamiento con descarte pendiente (independiente de finished)
        const now = moment().tz("America/Argentina/Buenos_Aires").toDate();
        const lastEntry = cow.treatmentsHistory
            .filter(t => 
                !t.milkDiscardCompletedAt &&
                t.endDateDiscardMilk &&
                new Date(t.endDateDiscardMilk) <= now
            )
            .sort((a, b) => new Date(b.endDateDiscardMilk || b.endDate) - new Date(a.endDateDiscardMilk || a.endDate))[0];

        if (!lastEntry) throw new Error("No hay descarte pendiente");

        lastEntry.milkDiscardCompletedAt = new Date();
        await cow.save();

        return cow;
    }
    async getFinishedMilkDiscardCows(userId) {
    const now = moment().tz("America/Argentina/Buenos_Aires");

    const cows = await CowModel.find({
        owner: userId,
        "treatmentsHistory.endDateDiscardMilk": { $lt: now.toDate() },
        "treatmentsHistory.milkDiscardCompletedAt": null
    });

    const result = [];

    for (const cow of cows) {
        const entry = cow.treatmentsHistory
            .filter(t => 
                t.endDateDiscardMilk < now.toDate() && 
                !t.milkDiscardCompletedAt
            )
            .sort((a, b) => b.endDate - a.endDate)[0];

        if (entry) {
            result.push({
                ...cow.toObject(),
                lastTreatmentEntry: entry,
                lastTreatmentSnapshot: entry.treatmentSnapshot
            });
        }
    }

    return result;
    }

    // Obtener vacas en tratamiento activo
    async getCowsInTreatment(userId) {
    try {
        const now = moment().tz("America/Argentina/Buenos_Aires");

        const cows = await CowModel.find({
            owner: userId,
            "treatmentsHistory.finished": false
        });

        const untreatedCows = [];
        const treatedCows = [];

        for (const cow of cows) {
            // Marcar tratamientos como finalizados cuando su endDate ya pasó
            let updated = false;
            cow.treatmentsHistory.forEach(entry => {
                if (!entry.finished && entry.endDate && moment(entry.endDate).isBefore(now)) {
                    entry.finished = true;
                    updated = true;
                }
            });
            if (updated) {
                await cow.save();
            }

            const activeEntry = cow.treatmentsHistory
                .filter(t => !t.finished)
                .sort((a, b) => b.startDate - a.startDate)[0]; 

            if (!activeEntry) continue;
            const currentTurn = this.calculateCurrentTurn(activeEntry.startDate, activeEntry.startTurn);

            const medicationSchedule = TreatmentsManager.generateMedicationSchedule(activeEntry.treatmentSnapshot);
            const medsForTurn = medicationSchedule[currentTurn - 1] || [];
            const isAutoTreated = medsForTurn.length === 0;

            const reMastitisInfo = activeEntry.isReMastitis ? {
                previousTreatment: activeEntry.reMastitisPreviousTreatmentTitle,
                previousEndDate: activeEntry.reMastitisPreviousEndDate || activeEntry.endDate,
                daysSinceEnd: (activeEntry.reMastitisPreviousEndDate || activeEntry.endDate)
                    ? Math.max(0, moment(activeEntry.startDate).diff(moment(activeEntry.reMastitisPreviousEndDate || activeEntry.endDate), "days"))
                    : null
            } : null;

            const isTreatedThisTurn = isAutoTreated || activeEntry.treatedTurns.includes(currentTurn);

            const cowData = {
                ...cow.toObject(),
                currentTreatmentSnapshot: activeEntry.treatmentSnapshot,
                currentTreatmentEntry: activeEntry,
                currentTurn,
                medicationSchedule,
                medsForTurn,
                startDate: activeEntry.startDate,
                endDate: activeEntry.endDate,
                startTurn: activeEntry.startTurn,
                udders: activeEntry.udders,
                isReMastitis: Boolean(activeEntry.isReMastitis),
                reMastitisInfo,
                autoTreated: isAutoTreated
            };

            if (isTreatedThisTurn) {
                treatedCows.push(cowData);
            } else {
                untreatedCows.push(cowData);
            }
        }

        return { untreatedCows, treatedCows };
    } catch (error) {
        console.error("Error en getCowsInTreatment:", error);
        throw error;
    }
}
    async getCowsInMilkDiscard(userId) {
    try {
        const now = moment().tz("America/Argentina/Buenos_Aires");


        const cows = await CowModel.find({
            owner: userId,
            "treatmentsHistory": {
                $elemMatch: {
                    finished: true,
                    milkDiscardCompletedAt: null,                    
                    endDateDiscardMilk: { $gte: now.toDate() }   
                }
            }
        }).sort({ "treatmentsHistory.endDate": -1 });

        const result = [];

        for (const cow of cows) {
            const lastEntry = cow.treatmentsHistory
                .filter(t => t.finished && !t.milkDiscardCompletedAt && t.endDateDiscardMilk >= now.toDate())
                .sort((a, b) => b.endDate - a.endDate)[0];

            if (!lastEntry) continue;

            const snapshot = lastEntry.treatmentSnapshot;

            const start = moment(lastEntry.startDate).tz("America/Argentina/Buenos_Aires");
            const startHour = lastEntry.startTurn === "morning" ? 0 : 12;
            start.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });

            const totalDiscardHours = snapshot.milkDiscardTurns * 12;
            const discardEnd = moment(start).add(totalDiscardHours, "hours");

            const hoursSinceStart = now.diff(start, "hours");
            const currentTurnNumber = Math.floor(hoursSinceStart / 12) + 1;
            const remainingDiscardTurns = Math.max(0, snapshot.milkDiscardTurns - currentTurnNumber + 1);

            result.push({
                ...cow.toObject(),
                lastTreatmentEntry: lastEntry,
                lastTreatmentSnapshot: snapshot,
                endDateDiscardMilk: lastEntry.endDateDiscardMilk || discardEnd.toDate(),
                remainingDiscardTurns,
                currentTurn: currentTurnNumber
            });
        }

        return result;
    } catch (error) {
        console.error("Error en getCowsInMilkDiscard:", error);
        throw error;
    }
    }
    async getCows(userId) {
    try {
        const cows = await CowModel.find({ owner: userId }).sort({ name: 1 });

        const result = [];

        for (const cow of cows) {
            const history = Array.isArray(cow.treatmentsHistory) ? cow.treatmentsHistory : [];

            let currentTreatmentSnapshot = null;
            let currentTreatmentEntry = null;

            const activeEntry = history.find(t => !t.finished);
            if (activeEntry) {
                currentTreatmentSnapshot = activeEntry.treatmentSnapshot || null;
                currentTreatmentEntry = activeEntry;
            }

            result.push({
                ...cow.toObject(),
                currentTreatmentSnapshot,
                currentTreatmentEntry,
                inMilkDiscard: history.some(t => 
                    t.finished && 
                    !t.milkDiscardCompletedAt && 
                    t.endDateDiscardMilk && 
                    new Date(t.endDateDiscardMilk) > new Date()
                ),
                isReleased: history.length === 0 || history.every(t => t.milkDiscardCompletedAt)
            });
        }

        return result;
    } catch (error) {
        console.error("Error crítico en getCows:", error);
        throw error;
    }
} 

    // Eliminar un animal por id y dueño
    async deleteCow(cowId, owner) {
        try {
            const deleted = await CowModel.findOneAndDelete({ _id: cowId, owner });
            if (!deleted) {
                return { success: false, message: "Animal no encontrado o no pertenece al usuario" };
            }
            return { success: true, message: "Animal eliminado con éxito" };
        } catch (error) {
            console.error("Error al eliminar animal:", error);
            return { success: false, message: "Error al eliminar el animal" };
        }
    }

}

module.exports = CowManager
