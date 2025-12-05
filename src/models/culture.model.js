const mongoose = require("mongoose");

const cultureResultSchema = new mongoose.Schema(
  {
    result: {
      type: String,
      enum: ["pendiente", "negativo", "sin desarrollo", "positivo"],
      required: true,
      default: "pendiente",
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
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
      enum: ["pendiente", "negativo", "sin desarrollo", "positivo"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

cultureSchema.pre("save", function (next) {
  this.eventsCount = Array.isArray(this.events) ? this.events.length : 0;
  if (this.eventsCount > 0) {
    const last = this.events[this.eventsCount - 1];
    if (last?.result) {
      this.status = last.result;
    }
  }
  next();
});

const CultureModel = mongoose.model("cultures", cultureSchema);

module.exports = CultureModel;
