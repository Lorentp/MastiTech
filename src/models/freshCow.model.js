const mongoose = require("mongoose");

const medicationSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    medications: [
      {
        name: { type: String, required: true },
        applyEveryTurns: { type: Number, required: true },
        applyUntilTurn: { type: Number, required: true },
      },
    ],
    milkDiscardTurns: { type: Number, required: true },
  },
  { _id: false }
);

const freshCowSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, uppercase: true },

    calvingDate: { type: Date, required: true }, // fecha parición

    eventSnapshot: {
      title: { type: String, required: true },
      duration: { type: Number, required: true },
    },
    eventStartDate: { type: Date, required: true },
    eventStartTurn: { type: String, enum: ["morning", "afternoon"], required: true },
    eventEndDate: { type: Date, required: true },
    eventFinishedAt: { type: Date, default: null },

    flujeoSnapshot: {
      title: { type: String },
      duration: { type: Number }, // legacy (no se usa)
    },
    flujeoStartDate: { type: Date, default: null },
    flujeoStartTurn: { type: String, enum: ["morning", "afternoon"], default: null },
    flujeoEndDate: { type: Date, default: null },
    flujeoFinishedAt: { type: Date, default: null },

    medicationTreatment: {
      treatmentSnapshot: { type: medicationSnapshotSchema, default: null },
      startDate: { type: Date, default: null },
      startTurn: { type: String, enum: ["morning", "afternoon"], default: null },
      endDate: { type: Date, default: null },
      endDateDiscardMilk: { type: Date, default: null },
      milkDiscardCompletedAt: { type: Date, default: null },
    },

    ketosisLevel: { type: String, default: null },
  },
  { timestamps: true }
);

freshCowSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("freshCows", freshCowSchema);
