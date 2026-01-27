const mongoose = require("mongoose");

const flujeoTypeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    duration: { type: Number, default: null }, // legacy (ya no se usa)
  },
  { timestamps: true }
);

flujeoTypeSchema.index({ owner: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("flujeoTypes", flujeoTypeSchema);
