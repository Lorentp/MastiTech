const mongoose = require("mongoose");

const freshEventSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    duration: { type: Number, required: true }, // turnos de 12h
  },
  { timestamps: true }
);

freshEventSchema.index({ owner: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("freshEvents", freshEventSchema);

