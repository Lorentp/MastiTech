const moment = require("moment-timezone");
const FreshCowModel = require("../models/freshCow.model");
const FreshEventModel = require("../models/freshEvent.model");
const FlujeoTypeModel = require("../models/flujeoType.model");
const TreatmentModel = require("../models/treatment.model");
const CowManager = require("./cows-manager");
const cowManager = new CowManager();

class FreshManager {
  calculateCurrentTurn(startDate, startTurn) {
    const now = moment().tz("America/Argentina/Buenos_Aires");
    const start = moment(startDate).tz("America/Argentina/Buenos_Aires");
    const startHour = startTurn === "morning" ? 0 : 12;
    start.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
    const hoursDiff = now.diff(start, "hours");
    return Math.max(1, Math.floor(hoursDiff / 12) + 1);
  }

  async addEventTemplate({ owner, title, duration }) {
    if (!owner || !title || !duration) throw new Error("Datos obligatorios faltantes");
    const d = parseInt(duration, 10);
    if (!Number.isFinite(d) || d < 1) throw new Error("Duración inválida");
    return FreshEventModel.create({ owner, title: title.trim(), duration: d });
  }

  async deleteEventTemplate({ owner, id }) {
    const deleted = await FreshEventModel.findOneAndDelete({ _id: id, owner });
    if (!deleted) throw new Error("Evento no encontrado");
    return deleted;
  }

  async getEventTemplates(owner) {
    return FreshEventModel.find({ owner }).sort({ title: 1 });
  }

  async addFlujeoType({ owner, title }) {
    if (!owner || !title) throw new Error("Datos obligatorios faltantes");
    return FlujeoTypeModel.create({ owner, title: title.trim() });
  }

  async deleteFlujeoType({ owner, id }) {
    const deleted = await FlujeoTypeModel.findOneAndDelete({ _id: id, owner });
    if (!deleted) throw new Error("Tipo de flujeo no encontrado");
    return deleted;
  }

  async getFlujeoTypes(owner) {
    return FlujeoTypeModel.find({ owner }).sort({ title: 1 });
  }

  async addFreshCow({ owner, name, observation, calvingDate, eventStartTurn, eventId }) {
    if (!owner || !name || !calvingDate || !eventStartTurn || !eventId) {
      throw new Error("Datos obligatorios faltantes");
    }

    const event = await FreshEventModel.findOne({ _id: eventId, owner });
    if (!event) throw new Error("Evento no encontrado");

    const calving = moment(calvingDate).tz("America/Argentina/Buenos_Aires").startOf("day").toDate();

    // La fecha de parición es el mismo día de arranque del evento
    const start = moment(calvingDate).tz("America/Argentina/Buenos_Aires").startOf("day");
    const startHour = eventStartTurn === "morning" ? 0 : 12;
    start.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
    const startDateWithTurn = start.toDate();

    const eventEndDate = moment(start).add(event.duration * 12, "hours").toDate();

    const freshCow = new FreshCowModel({
      owner,
      name: name.trim().toUpperCase(),
      observation: (observation ?? "").toString().trim() || null,
      calvingDate: calving,
      eventSnapshot: { title: event.title, duration: event.duration },
      eventStartDate: startDateWithTurn,
      eventStartTurn,
      eventEndDate,
    });

    await freshCow.save();
    return freshCow;
  }

  async getFreshCows(owner) {
    return FreshCowModel.find({ owner }).sort({ name: 1 });
  }

  async updateFreshCow({ owner, cowId, name, observation, calvingDate, eventStartTurn, eventId }) {
    const cow = await FreshCowModel.findOne({ _id: cowId, owner });
    if (!cow) throw new Error("Animal no encontrado");

    if (!name || !calvingDate || !eventStartTurn || !eventId) {
      throw new Error("Datos obligatorios faltantes");
    }

    const event = await FreshEventModel.findOne({ _id: eventId, owner });
    if (!event) throw new Error("Evento no encontrado");

    const calving = moment(calvingDate).tz("America/Argentina/Buenos_Aires").startOf("day").toDate();
    const start = moment(calvingDate).tz("America/Argentina/Buenos_Aires").startOf("day");
    const startHour = eventStartTurn === "morning" ? 0 : 12;
    start.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
    const startDateWithTurn = start.toDate();
    const eventEndDate = moment(start).add(event.duration * 12, "hours").toDate();

    cow.name = name.trim().toUpperCase();
    cow.calvingDate = calving;
    cow.observation = (observation ?? "").toString().trim() || null;
    cow.eventSnapshot = { title: event.title, duration: event.duration };
    cow.eventStartDate = startDateWithTurn;
    cow.eventStartTurn = eventStartTurn;
    cow.eventEndDate = eventEndDate;

    await cow.save();
    return cow;
  }

  async finalizeEventToFlujeo({
    owner,
    cowId,
    flujeoTypeId,
    flujeoStartDate,
    flujeoStartTurn,
    startMedication = false,
    treatmentId,
    treatmentStartDate,
    treatmentStartTurn,
    ketosisLevel = null,
  }) {
    const cow = await FreshCowModel.findOne({ _id: cowId, owner });
    if (!cow) throw new Error("Animal no encontrado");

    const flujeoType = await FlujeoTypeModel.findOne({ _id: flujeoTypeId, owner });
    if (!flujeoType) throw new Error("Tipo de flujeo no encontrado");

    const start = moment(flujeoStartDate).tz("America/Argentina/Buenos_Aires").startOf("day");
    const startHour = flujeoStartTurn === "morning" ? 0 : 12;
    start.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });

    cow.eventFinishedAt = moment().tz("America/Argentina/Buenos_Aires").toDate();
    cow.flujeoSnapshot = { title: flujeoType.title, duration: null };
    cow.flujeoStartDate = start.toDate();
    cow.flujeoStartTurn = flujeoStartTurn;
    cow.flujeoEndDate = null;
    cow.ketosisLevel = (ketosisLevel ?? "").toString().trim() || null;

    if (startMedication) {
      if (!treatmentId || !treatmentStartDate || !treatmentStartTurn) {
        throw new Error("Faltan datos para iniciar tratamiento");
      }
      const t = await TreatmentModel.findOne({ _id: treatmentId, owner });
      if (!t) throw new Error("Tratamiento no encontrado");

      const tStart = moment(treatmentStartDate).tz("America/Argentina/Buenos_Aires").startOf("day");
      const tHour = treatmentStartTurn === "morning" ? 0 : 12;
      tStart.set({ hour: tHour, minute: 0, second: 0, millisecond: 0 });

      const treatmentSnapshot = {
        title: t.title,
        duration: t.duration,
        medications: t.medications.map((m) => ({
          name: m.name,
          applyEveryTurns: m.applyEveryTurns,
          applyUntilTurn: m.applyUntilTurn,
        })),
        milkDiscardTurns: t.milkDiscardTurns,
      };

      cow.medicationTreatment = {
        treatmentSnapshot,
        startDate: tStart.toDate(),
        startTurn: treatmentStartTurn,
        endDate: tStart.clone().add(t.duration * 12, "hours").toDate(),
        endDateDiscardMilk: tStart.clone().add(t.milkDiscardTurns * 12, "hours").toDate(),
        milkDiscardCompletedAt: null,
      };

      // Registrar también el tratamiento en la colección de vacas general (para que aparezca en Enfermería)
      try {
        await cowManager.addCowToTreatment({
          name: cow.name,
          severity: "1",
          udders: [],
          startDate: tStart.toDate(),
          startTurn: treatmentStartTurn,
          treatmentId,
          owner,
          confirmReMastitis: true,
          skipEvent: true,
        });
      } catch (err) {
        console.error("Error al registrar tratamiento en vaca general:", err);
      }
    } else {
      cow.medicationTreatment = {
        treatmentSnapshot: null,
        startDate: null,
        startTurn: null,
        endDate: null,
        endDateDiscardMilk: null,
        milkDiscardCompletedAt: null,
      };
    }

    await cow.save();
    return cow;
  }

  async finalizeFlujeo({ owner, cowId, ketosisLevel }) {
    const cow = await FreshCowModel.findOne({ _id: cowId, owner });
    if (!cow) throw new Error("Animal no encontrado");

    cow.flujeoFinishedAt = moment().tz("America/Argentina/Buenos_Aires").toDate();
    cow.ketosisLevel = (ketosisLevel ?? "").toString().trim() || null;

    await cow.save();
    return cow;
  }

  async deleteFreshCow({ owner, cowId }) {
    const deleted = await FreshCowModel.findOneAndDelete({ _id: cowId, owner });
    if (!deleted) throw new Error("Animal no encontrado");
    return deleted;
  }

  async clearFlujeo({ owner, cowId }) {
    const cow = await FreshCowModel.findOne({ _id: cowId, owner });
    if (!cow) throw new Error("Animal no encontrado");

    cow.flujeoSnapshot = { title: null, duration: null };
    cow.flujeoStartDate = null;
    cow.flujeoStartTurn = null;
    cow.flujeoEndDate = null;
    cow.flujeoFinishedAt = null;
    cow.ketosisLevel = null;
    cow.medicationTreatment = {
      treatmentSnapshot: null,
      startDate: null,
      startTurn: null,
      endDate: null,
      endDateDiscardMilk: null,
      milkDiscardCompletedAt: null,
    };

    await cow.save();
    return cow;
  }
}

module.exports = FreshManager;
