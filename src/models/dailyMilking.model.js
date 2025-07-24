const mongoose = require("mongoose")
const moment = require("moment-timezone")


const dailyMilkingSchema = new mongoose.Schema({
    owner: {type:mongoose.Schema.Types.ObjectId, ref:"owner", required:true},
    date:{type:Date, required:true},
    count:{type: Number, required:true}    
})

dailyMilkingSchema.index({owner:1, date:1}, {unique:true})

const DailyMilkingModel = mongoose.model("dailyMilkings", dailyMilkingSchema);

module.exports = DailyMilkingModel;