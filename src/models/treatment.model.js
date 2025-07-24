const mongoose = require("mongoose");

const treatmentsSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "owner", required: true },
    title: { type: String, required: true },
    duration: { type: Number, required: true }, // Duration in 12-hour turns
    medications: [{
        name: { type: String, required: true },
        applyEveryTurns: { type: Number, required: true }, // Apply every X turns
        applyUntilTurn: { type: Number, required: true } // Apply until this turn
    }],
    milkDiscardTurns: { type: Number, required: true } // Milk discard period in turns
});

const TreatmentsModel = mongoose.model("treatments", treatmentsSchema);

module.exports = TreatmentsModel;