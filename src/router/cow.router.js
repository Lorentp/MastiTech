const express = require("express")
const mongoose = require("mongoose")
const router = express.Router()
const CowManager = require("../managers/cows-manager")
const cowManager = new CowManager()
const TreatmentsManager = require("../managers/treatments-manager")
const treatmentsManager = new TreatmentsManager()
const moment = require("moment-timezone")



router.post("/add", async (req, res) => {
    try {       
        const owner = req.session.user._id;
        const { name, severity , udders, startDate, endDate, startTurn, treatmentId, confirmReMastitis} = req.body;

        if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
            throw new Error("Invalid treatmentId format");
        }


        const treatment = await treatmentsManager.getTreatmentsById(treatmentId);
        if (!treatment) throw new Error("Treatment not found");

        const newStartDate = moment(startDate).tz("America/Argentina/Buenos_Aires").add(0, "hours").toDate();
        const newEndDate = moment(endDate).tz("America/Argentina/Buenos_Aires").add(0, "hours").toDate();
        const yesterday = moment(startDate).tz("America/Argentina/Buenos_Aires").subtract(1, "day").toDate();


        const newCow = {
            name,
            severity,
            startDate: newStartDate,
            endDate: newEndDate,
            owner,
            startTurn,
            lastDayTreated: yesterday,
            treatmentId,
            udders: udders ? (Array.isArray(udders) ? udders : [udders]) : [],
            confirmReMastitis: !!confirmReMastitis // Ensure boolean
        };
        const result = await cowManager.addCowToTreatment(newCow);

        if (result.cow) {
            res.status(200).json({
                success: true,
                message: "Animal agregado a tratamiento con exito",
                reMastitisWarning: result.reMastitisWarning,
                currentTurn: cowManager.calculateCurrentTurn(newCow.startDate, newCow.startTurn)
            });
        } else {
            res.status(200).json({
                success: false,
                reMastitisWarning: result.reMastitisWarning
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error, intentelo nuevamente"
        });
        console.log(error);
    }
});



router.post("/update:cid", async (req, res) => {
    try {
        const {cid} = req.params
        const newCowData = req.body

        const result = await cowManager.updateCow(cid, newCowData)

        if(result.success) {
            res.status(200).json(result)
        } else if (result.message.includes("ya existe")){
            res.status(409).json(result)
        } else {
            res.status(500).json(result)
        }
    } catch (error) {
        console.log(error)
    }
})

router.post("/delete/:cid", async (req, res) => {
    try {
        const result = await cowManager.deleteCow(req.params.cid)

        if(result.success){
            res.status(200).json(result)
        } else {
            res.status(400).json(result)
        }
    } catch (error) {
        console.log(error)
    }
})

router.post("/mark-treated/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { turn } = req.body;
        const userId = req.session.user._id;
        const cow = await cowManager.markCowAsTreated(id, parseInt(turn), userId);
        res.json({ success: true, cow });
    } catch (error) {
        console.log(`Error marking cow ${id} as treated:`, error);
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post("/finalize-milk-discard/:id", async (req,res) => {
    try {
        const {id} = req.params
        const userId = req.session.user._id
        const cow = await cowManager.finalizeMilkDiscard(id, userId)
        res.json({success: true, cow})
    } catch (error) {   
        console.log(`Error finalizing milk discard for cow ${id}:`, error);
        res.status(400).json({success: false, message: error.message})
    }
})

module.exports = router