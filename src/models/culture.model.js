const mongoose = require("mongoose");

const cultureResultSchema = new mongoose.Schema(
  {
    result: {
      type: String,
      enum: ["pendiente", "negativo", "sin desarrollo", "positivo", "contaminada"],
      required: true,
      default: "pendiente",
    },
    udders: [{ type: String, enum: ["DI", "DD", "TI", "TD"] }],
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    // Flag genérico: si el evento fue con tratamiento o no
    withTreatment: { type: Boolean, default: false },
    // Legacy (antes solo existía para "contaminada")
    contaminatedWithTreatment: { type: Boolean, default: null }
  }
);

const cultureSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, uppercase: true },
    udders: [{ type: String, enum: ["DI", "DD", "TI", "TD"] }],
    startDate: { type: Date, required: true },
    events: { type: [cultureResultSchema], default: [] },
    eventsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pendiente", "negativo", "sin desarrollo", "positivo", "contaminada"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

cultureSchema.pre("save", function (next) {
  if (Array.isArray(this.events)) {
    // Migración suave: si viene legacy contaminatedWithTreatment y falta withTreatment, lo copiamos.
    this.events.forEach((e) => {
      if (typeof e?.withTreatment !== "boolean" && typeof e?.contaminatedWithTreatment === "boolean") {
        e.withTreatment = e.contaminatedWithTreatment;
      }
    });

    // Ordenamos por fecha para que el ultimo sea el mas reciente
    this.events.sort((a, b) => new Date(a.recordedAt || 0) - new Date(b.recordedAt || 0));
    this.eventsCount = this.events.length;
    if (this.eventsCount > 0) {
      const last = this.events[this.eventsCount - 1];
      if (last?.result) {
        this.status = last.result;
      }
    }
  } else {
    this.eventsCount = 0;
  }
  next();
});

const CultureModel = mongoose.model("cultures", cultureSchema);

module.exports = CultureModel;
