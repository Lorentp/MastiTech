const TreatmentsModel = require("../models/treatment.model")

class TreatmentsManager {
    
    //Create Treatment

     async addTreatment({ title, duration, medications, milkDiscardTurns, owner }) {
        try {
            // Validate inputs
            if (!Array.isArray(medications) || medications.length === 0) {
                throw new Error("At least one medication is required");
            }
            for (const med of medications) {
                if (med.applyUntilTurn > duration) {
                    throw new Error(`applyUntilTurn for ${med.name} cannot exceed duration`);
                }
                if (med.applyEveryTurns < 1) {
                    throw new Error(`applyEveryTurns for ${med.name} must be at least 1`);
                }
            }

            const newTreatment = new TreatmentsModel({
                title,
                duration,
                medications,
                milkDiscardTurns,
                owner
            });

            await newTreatment.save();
            return newTreatment;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    //Get treatments

    async getTreatments(userId){
        try {
            const treatments = await TreatmentsModel.find({owner:userId})
            return treatments
        } catch (error) {
            console.log(error)
        }
    }

    //Get treatments by id

    async getTreatmentsById(userId){
        try {
            const treatments = await TreatmentsModel.findById(userId)
            return treatments
        } catch (error) {
            console.log(error)
        }
    }

    //Update treatments

    async updateTreatment(id, updatedTreatmentData){
        try {
            const updatedTreatment = await TreatmentsModel.findByIdAndUpdate(id,
                {
                 title:updatedTreatmentData.title,
                 duration:updatedTreatmentData.duration,
                 medication:updatedTreatmentData.medication,
                },
                {new: true}
            )
            return updatedTreatment

        } catch (error) {
            console.log(error)
        }
    }

    //Delete Treatment

    async deleteTreatment(id){
        try {
            const deletedTreatment = await TreatmentsModel.findByIdAndDelete(id)
            return deletedTreatment
        } catch (error) {
            console.log(error)
        }
    }

    // Generate medication schedule for a treatment
    static generateMedicationSchedule({ duration, medications }) {
        try {
            if (!Array.isArray(medications)) {
                console.log("Error: medications is not an array:", medications); // Debug
                throw new Error("Medications must be an array");
            }
            const schedule = Array(duration).fill().map(() => []);
            for (const med of medications) {
                if (med.applyUntilTurn >= 1) {
                    schedule[0].push(med.name);
                }
                for (let turn = med.applyEveryTurns + 1; turn <= med.applyUntilTurn && turn <= duration; turn += med.applyEveryTurns) {
                    schedule[turn - 1].push(med.name);
                }
            }
            return schedule;
        } catch (error) {
            console.log("Error generating medication schedule:", error);
            throw error;
        }
    }
}

module.exports = TreatmentsManager