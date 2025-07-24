const DailyMilkingModel = require("../models/dailyMilking.model");
const moment = require("moment-timezone")
const mongoose = require("mongoose")

class DailyMilkingManager {
    async addDailyCount({owner, date, count}) {
        try {
            const parsedDate = moment(date).tz("America/Argentina/Buenos_Aires").startOf("day").toDate()
            const existing = await DailyMilkingModel.findOne({
                owner: new mongoose.Types.ObjectId(owner),
                date: parsedDate
            })
            if(existing){
                throw new Error("Ya se ha registrado esta fecha")
            }

            const newEntry = new DailyMilkingModel({
                owner: new mongoose.Types.ObjectId(owner),
                date: parsedDate,
                count: parseInt(count, 10)
            })

            await newEntry.save()
            return newEntry
        } catch (error) {
            console.log("Error adding daily count:", error);
            throw error;           
        }
    }

    async hasTodayEntry(owner){
        try {
            const today = moment().tz("America/Argentina/Buenos_Aires").startOf("day").toDate()
            const existing = await DailyMilkingModel.findOne({
                owner: new mongoose.Types.ObjectId(owner),
                date: today
            })

            return !!existing
        } catch (error) {
            console.log("Error checking today entry:", error);
           return false;   
        }
    }
}


module.exports = DailyMilkingManager