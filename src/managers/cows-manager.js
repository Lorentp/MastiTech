const CowModel = require("../models/cow.model")
const mongoose = require("mongoose")
const TreatmentsModel = require("../models/treatment.model")
const TreatmentsManager = require("../managers/treatments-manager")
const moment = require("moment-timezone")

class CowManager {

    //Get animals
    async getCows(userId) {
        try {
            const cows = await CowModel.find({ owner: userId });
            return cows.map(cow => ({
                ...cow.toObject(),
                currentTurn: this.calculateCurrentTurn(cow.startDate, cow.startTurn)
            }));
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    //Get cows in treatment
    async getCowsInTreatment(userId) {
        try {
            const startOfToday = moment().tz("America/Argentina/Buenos_Aires").startOf("day").toDate();
            const endOfToday = moment().tz("America/Argentina/Buenos_Aires").endOf("day").toDate();
            const cows = await CowModel.find({
                owner: new mongoose.Types.ObjectId(userId),
                endDate: { $gte: startOfToday },
                startDate: { $lte: endOfToday },
                finished: false
            });
            const untreatedCows = [];
            const treatedCows = [];
            cows.forEach(cow => {
                const cowObj = cow.toObject();
                const currentTurn = this.calculateCurrentTurn(cowObj.startDate, cowObj.startTurn);
                let medicationSchedule = [];
                if (cowObj.treatment && cowObj.treatment.length > 0) {
                    try {
                        medicationSchedule = TreatmentsManager.generateMedicationSchedule(cowObj.treatment[0]);
                    } catch (error) {
                        console.log(`Error generating medication schedule for cow ${cowObj.name}:`, error);
                    }
                }
                // Clear treatedTurns older than currentTurn
                cowObj.treatedTurns = (cowObj.treatedTurns || []).filter(turn => turn === currentTurn);
                const cowData = {
                    ...cowObj,
                    currentTurn,
                    medicationSchedule
                };
                if (cowObj.treatedTurns && cowObj.treatedTurns.includes(currentTurn)) {
                    treatedCows.push(cowData);
                } else {
                    untreatedCows.push(cowData);
                }
            });

            return { untreatedCows, treatedCows };
        } catch (error) {
            console.log("Error fetching cows in treatment:", error);
            throw error;
        }
    }

    async getCowsInMilkDiscard(userId) {
        try {
            const now = moment().tz("America/Argentina/Buenos_Aires");
            const cows = await CowModel.find({
                owner: new mongoose.Types.ObjectId(userId),
                startDate: { $exists: true },
                endDate: { $exists: true },
                treatment: { $exists: true },
                finished: false // Already fixed as per previous response
            });
            const milkDiscardCows = cows.map(cow => {
                const cowObj = cow.toObject();
                const currentTurn = this.calculateCurrentTurn(cowObj.startDate, cowObj.startTurn);
                const endTurn = this.calculateEndTurn(cowObj.startDate, cowObj.endDate, cowObj.startTurn);
                const milkDiscardTurns = cowObj.treatment && cowObj.treatment.length > 0 ? cowObj.treatment[0].milkDiscardTurns || 0 : 0;
                const totalTurns = milkDiscardTurns; // Fix: Use milkDiscardTurns directly
                const remainingDiscardTurns = Math.max(0, totalTurns - currentTurn + 1);
                return {
                    ...cowObj,
                    currentTurn,
                    endTurn,
                    remainingDiscardTurns
                };
            }).filter(cow => {
                const shouldInclude = cow.currentTurn > cow.endTurn && cow.remainingDiscardTurns > 0;
                return shouldInclude;
            });
            return milkDiscardCows;
        } catch (error) {
            console.log("Error fetching cows in milk discard:", error);
            throw error;
        }
    }
    async markCowAsTreated(cowId, turn, userId) {
        try {
            const cow = await CowModel.findOne({
                _id: new mongoose.Types.ObjectId(cowId),
                owner: new mongoose.Types.ObjectId(userId),
                finished: false
            });
            if (!cow) {
                throw new Error("Cow not found or not in treatment");
            }
            const currentTurn = this.calculateCurrentTurn(cow.startDate, cow.startTurn);
            if (turn !== currentTurn) {
                throw new Error(`Cannot mark turn ${turn} as treated; current turn is ${currentTurn}`);
            }
            if (!cow.treatedTurns) {
                cow.treatedTurns = [];
            }
            if (!cow.treatedTurns.includes(turn)) {
                cow.treatedTurns.push(turn);
                await cow.save();
            }
            return {
                ...cow.toObject(),
                currentTurn,
                medicationSchedule: cow.treatment && cow.treatment.length > 0
                    ? TreatmentsManager.generateMedicationSchedule(cow.treatment[0])
                    : []
            };
        } catch (error) {
            console.log(`Error marking cow ${cowId} as treated for turn ${turn}:`, error);
            throw error;
        }
    }


    //Get cow to finish

    async getFinishedMilkDiscardCows (userId){
        try {
            const now = moment().tz("America/Argentina/Buenos_Aires").toDate()
            const cows = await CowModel.find({
                owner: new mongoose.Types.ObjectId(userId),
                finished : false
            })

            const finishedCows = cows.filter(cow => {
                const endDiscard = moment(cow.endDateDiscardMilk).tz("America/Argentina/Buenos_Aires");
                if (endDiscard.isBefore(now)) {
                    return true; 
                }
                if (endDiscard.isSame(now, 'day')) {
                    const endTurnHour = cow.startTurn === 'morning' ? 0 : 12; 
                    const endHour = endDiscard.hour();
                    const currentHour = now.hour();
                    return currentHour >= endHour + 12; 
                }
            return false;
            }); 

            return finishedCows.map(cow => ({
                ...cow.toObject(),
                currentTurn: this.calculateCurrentTurn(cow.startDate, cow.startTurn)
            }))
        } catch (error) {
            console.log("Error fetching finished milk discard cows:", error)
            throw error
        }
    }

    async finalizeMilkDiscard(cowId, userId) {
        try {
            const cow = await CowModel.findOne({
                _id: new mongoose.Types.ObjectId(cowId),
                owner:  new mongoose.Types.ObjectId(userId),
                finished: false
            })
            if(!cow){
                throw new Error("cow not found or already finished")
            }

            const now = moment().tz("America/Argentina/Buenos_Aires").toDate()
            cow.finished = true
            cow.milkDiscardCompletionDate = now
            await cow.save()

            return {
                ...cow.toObject(),
                currentTurn: this.calculateCurrentTurn(cow.startDate, cow.startTurn)
            }
        } catch (error) {
            console.log(`Error finalizing milk discard for cow ${cowId}:`, error)
            throw error
        }
    }


    //Animal to treatment
    async addCowToTreatment({
        name,
        treatmentId,
        udders,
        severity,
        startDate,
        startTurn,
        owner,
        endDate,
        lastDayTreated,
        confirmReMastitis = false
    }) {
        try {
            const treatment = await TreatmentsModel.findOne({
                _id: new mongoose.Types.ObjectId(treatmentId),
                owner: new mongoose.Types.ObjectId(owner)
            });
           

            const cowExist = await CowModel.findOne({ owner: new mongoose.Types.ObjectId(owner), name });
            const fourteenDaysAgo = moment().subtract(14, "days").toDate();
            let reMastitisWarning = null;

            const start = moment(startDate).tz("America/Argentina/Buenos_Aires");
            const startHour = startTurn === 'morning' ? 0 : 12;
            start.set({ hour: startHour, minute: 0, second: 0 });
            const endDateDiscardMilk = moment(start).add(treatment.milkDiscardTurns * 12, "hours").toDate();
            const daysInHospital = moment(endDateDiscardMilk).diff(start, "days") 

            if (!udders || !Array.isArray(udders) || udders.length === 0) {
                console.warn(`No valid udders provided for cow ${name}, defaulting to []`);
                udders = [];
            }

            if (cowExist) {
                const previousTreatment = cowExist.lastTreatedTreatments.find(t => t.endDate >= fourteenDaysAgo && t.treatmentId.toString() === treatmentId);
                if (previousTreatment) {
                    reMastitisWarning = {
                        message: `ATENCION RE-MASTITIS: Esta vaca fue tratada recientemente con ${previousTreatment.title}. El tratamiento elegido es ${treatment.title}. Se recomienda usar un tratamiento diferente.`,
                        previousTreatment: previousTreatment.title,
                        currentTreatment: treatment.title
                    };
                }
            }

            if (reMastitisWarning && !confirmReMastitis) {
                return {
                    cow: null,
                    reMastitisWarning
                };
            }

            let cowToReturn = null;

            if (cowExist) {
                cowExist.treatment = [{
                    title: treatment.title,
                    duration: treatment.duration,
                    medications: treatment.medications,
                    milkDiscardTurns: treatment.milkDiscardTurns,
                    startDate: startDate
                }];
                cowExist.udders = udders;
                cowExist.events = (cowExist.events) + 1; // Increment events
                cowExist.startDate = startDate;
                cowExist.startTurn = startTurn;
                cowExist.endDate = endDate;
                cowExist.severity = severity;
                cowExist.endDateDiscardMilk = endDateDiscardMilk;
                cowExist.daysInHospital = daysInHospital;
                cowExist.treatedTurns = []; // Initialize treatedTurns
                cowExist.lastDayTreated = lastDayTreated;
                cowExist.resetTreatment = false;
                cowExist.lastTreatedTreatments.push({
                    treatmentId: new mongoose.Types.ObjectId(treatmentId),
                    title: treatment.title,
                    endDate
                });

                await cowExist.save();
                cowToReturn = {
                    ...cowExist.toObject(),
                    currentTurn: this.calculateCurrentTurn(cowExist.startDate, cowExist.startTurn),
                    medicationSchedule: TreatmentsManager.generateMedicationSchedule(cowExist.treatment[0])
                };
            } else {
                const newCow = new CowModel({
                    name,
                    treatment: [{
                        title: treatment.title,
                        duration: treatment.duration,
                        medications: treatment.medications,
                        milkDiscardTurns: treatment.milkDiscardTurns,
                        startDate: startDate
                    }],
                    udders,
                    events: 1,
                    startDate,
                    severity,
                    startTurn,
                    endDate,
                    daysInHospital,
                    endDateDiscardMilk,
                    owner: new mongoose.Types.ObjectId(owner),
                    treatedTurns: [],
                    lastDayTreated,
                    lastTreatedTreatments: [{ treatmentId: new mongoose.Types.ObjectId(treatmentId), title: treatment.title, endDate }]
                });

                await newCow.save();
                cowToReturn = {
                    ...newCow.toObject(),
                    currentTurn: this.calculateCurrentTurn(newCow.startDate, newCow.startTurn),
                    medicationSchedule: TreatmentsManager.generateMedicationSchedule(newCow.treatment[0])
                };
            }

            return {
                cow: cowToReturn,
                reMastitisWarning
            };
        } catch (error) {
            console.log("Error in addCowToTreatment:", error);
            throw error;
        }
    }

    // Calculate turn
    calculateCurrentTurn(startDate, startTurn) {
        const now = moment().tz("America/Argentina/Buenos_Aires");
        const start = moment(startDate).tz("America/Argentina/Buenos_Aires");
        const startHour = startTurn === 'morning' ? 0 : 12;
        start.set({ hour: startHour, minute: 0, second: 0 });
        const hoursDiff = now.diff(start, 'hours');
        const turnsDiff = Math.floor(hoursDiff / 12);
        return Math.max(1, turnsDiff);
    }

    calculateEndTurn(startDate, endDate, startTurn) {
        const start = moment(startDate).tz("America/Argentina/Buenos_Aires");
        const end = moment(endDate).tz("America/Argentina/Buenos_Aires");
        const startHour = startTurn === 'morning' ? 0 : 12;
        start.set({ hour: startHour, minute: 0, second: 0 });
        end.set({ hour: startHour, minute: 0, second: 0 });
        const hoursDiff = end.diff(start, 'hours');
        const turnsDiff = Math.floor(hoursDiff / 12);
        return Math.max(1, turnsDiff + 1);
    }

    //Update animal

    async updateCow(id, updatedCowData) {
        try {
            const updatedCow = await CowModel.findByIdAndUpdate(
                id,
                updatedCowData,
                { new: true }
            );
            return {
                ...updatedCow.toObject(),
                currentTurn: this.calculateCurrentTurn(updatedCow.startDate, updatedCow.startTurn)
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
   

    //Delete Animal

    async deleteCow(id){
        try {
            const deletedcow = await CowModel.findByIdAndDelete(id)

            return deletedcow
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = CowManager