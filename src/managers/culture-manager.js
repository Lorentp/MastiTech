const CultureModel = require("../models/culture.model");
const moment = require("moment-timezone");

class CultureManager {
  async addCulture({ owner, name, udders, startDate, result }) {
    if (!owner || !name || !startDate) {
      throw new Error("Datos obligatorios faltantes");
    }

    const normalizedName = name.trim().toUpperCase();
    const normalizedUdders = Array.isArray(udders)
      ? udders.filter(Boolean)
      : [udders].filter(Boolean);

    const start = moment(startDate)
      .tz("America/Argentina/Buenos_Aires")
      .startOf("day")
      .toDate();

    const normalizedResult =
      typeof result === "string"
        ? result.toLowerCase()
        : "pendiente";
    const validResults = ["pendiente", "negativo", "sin desarrollo", "positivo"];
    const safeResult = validResults.includes(normalizedResult)
      ? normalizedResult
      : "pendiente";

    // Si ya existe el cultivo de ese animal, solo agregamos un nuevo evento
    const existing = await CultureModel.findOne({ owner, name: normalizedName });
    if (existing) {
      if (normalizedUdders.length) {
        const merged = new Set([...(existing.udders || []), ...normalizedUdders]);
        existing.udders = Array.from(merged);
      }
      existing.events.push({ result: safeResult, recordedAt: start, udders: normalizedUdders });
      if (existing.startDate && start < existing.startDate) {
        existing.startDate = start;
      }
      await existing.save();
      return { culture: existing, created: false };
    }

    const culture = new CultureModel({
      owner,
      name: normalizedName,
      udders: normalizedUdders,
      startDate: start,
      events: [{ result: safeResult, recordedAt: start, udders: normalizedUdders }],
    });

    await culture.save();
    return { culture, created: true };
  }

  async addResult(cultureId, owner, result) {
    const valid = ["pendiente", "negativo", "sin desarrollo", "positivo"];
    if (!valid.includes(result)) {
      throw new Error("Resultado invalido");
    }

    const culture = await CultureModel.findOne({ _id: cultureId, owner });
    if (!culture) {
      throw new Error("Cultivo no encontrado");
    }

    const now = new Date();
    const events = Array.isArray(culture.events) ? culture.events : [];
    const lastIdx = events.length - 1;
    const lastUdders = lastIdx >= 0 && Array.isArray(events[lastIdx].udders) ? events[lastIdx].udders : culture.udders;

    if (lastIdx >= 0 && events[lastIdx].result === "pendiente") {
      // Reemplazamos el evento pendiente por el nuevo resultado
      events[lastIdx].result = result;
      events[lastIdx].recordedAt = now;
      events[lastIdx].udders = lastUdders;
    } else {
      // Agregamos un nuevo evento
      events.push({ result, udders: lastUdders, recordedAt: now });
    }

    culture.events = events;
    await culture.save();
    return culture;
  }

  async deleteCulture(cultureId, owner) {
    const deleted = await CultureModel.findOneAndDelete({ _id: cultureId, owner });
    if (!deleted) {
      throw new Error("Cultivo no encontrado");
    }
    return deleted;
  }

  async getCultures(owner) {
    return CultureModel.find({ owner }).sort({ createdAt: -1 });
  }

  async getPendingCultures(owner) {
    return CultureModel.find({ owner, status: "pendiente" }).sort({
      createdAt: -1,
    });
  }
}

module.exports = CultureManager;
