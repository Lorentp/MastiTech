const express = require("express")
const router = express.Router()
const DailyMilkingManager = require("../managers/dailyMilking-manager")
const dailyMilkingManager = new DailyMilkingManager()


router.post("/add", async (req, res) => {
    try {
        const owner = req.session.user._id
        const {date, count} = req.body
        if( !date || !count || isNaN(count)){
            return res.status(400).json({ success: false, message: "Fecha y cantidad requerida"})
        }

        const result = await dailyMilkingManager.addDailyCount({owner, date, count})
        res.status(200).json({ success:true, data:result})

    } catch (error) {
        res.status(400).json({ success:false, message: error.message})
    }
})

router.get("/has-today", async (req,res) => {
    try {
        const owner = req.session.user._id
        const has = await dailyMilkingManager.hasTodayEntry(owner)
        res.status(200).json({has})
    } catch (error) {
        res.status(500).json({ success:false, message: "Error verificando registros"})
    }
})

module.exports = router;