const mongoose = require("mongoose");
const moment = require("moment-timezone");


const treatmentEntrySchema = new mongoose.Schema({

    treatmentSnapshot: {
        title: { type: String, required: true },
        duration: { type: Number, required: true },
        medications: [{
            name: { type: String, required: true },
            applyEveryTurns: { type: Number, required: true },
            applyUntilTurn: { type: Number, required: true }
        }],
        milkDiscardTurns: { type: Number, required: true }
    },


    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTurn: { type: String, enum: ["morning", "afternoon"], required: true },
    severity: { type: String, enum: ["1", "2", "3"], required: true },
    udders: [{ type: String, enum: ["DI", "DD", "TI", "TD"] }],

    treatedTurns: [{ type: Number }],     
    finished: { type: Boolean, default: false }, 
    endDateDiscardMilk: { type: Date },        
    milkDiscardCompletedAt: { type: Date },
    isReMastitis: { type: Boolean, default: false },
    reMastitisPreviousTreatmentTitle: { type: String },
    reMastitisPreviousEndDate: { type: Date }
}, { timestamps: true });


const cowSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },


    treatmentsHistory: {
        type: [treatmentEntrySchema],
        default: [] 
    },


    lastTreatmentsSummary: {
        type: [{
            treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Treatment" },
            title: String,
            endDate: Date
        }],
        default: []
    },


    events: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

cowSchema.index({ owner: 1, name: 1 }, { unique: true }); 

module.exports = mongoose.model("Cow", cowSchema);
