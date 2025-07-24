const mongoose = require("mongoose");

const cowSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "owner", required: true },
    name: { type: String, required: true },
    treatment: [{
        title: { type: String, required: true },
        duration: { type: Number, required: true },
        medications: [{
            name: { type: String, required: true },
            applyEveryTurns: { type: Number, required: true },
            applyUntilTurn: { type: Number, required: true }
        }],
        milkDiscardTurns: { type: Number, required: true },
        startDate: { type: Date, required: true }
    }],
    severity: {type: String, required:true},
    startTurn: { type: String, enum: ['morning', 'afternoon'], required: true }, 
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    endDateDiscardMilk: {type: Date, required: true},
    udders: {type: Array, required: true},
    events: {type: Number, required: true},
    daysInHospital: {type: Number, required: true},
    finished: { type: Boolean, default: false },
    lastTreatedTreatments: [{
        treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: "treatments" },
        title: { type: String },
        endDate: { type: Date }
    }],
    treatedTurns: [{ type: Number, default: [] }],
    milkDiscardCompletionDate: {type: Date}
})

const CowModel = mongoose.model("cows", cowSchema);

module.exports = CowModel;