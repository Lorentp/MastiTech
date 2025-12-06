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

        // ← CORREGIDO: req.body, NO body
        const { 
            name, 
            severity, 
            udders, 
            startDate, 
            startTurn, 
            treatmentId, 
            confirmReMastitis = false,
            skipEvent = false
        } = req.body;

        // Validación básica
        if (!name || !treatmentId || !startDate || !startTurn) {
            return res.status(400).json({
                success: false,
                message: "Faltan datos obligatorios"
            });
        }

        const result = await cowManager.addCowToTreatment({
            name,
            udders: Array.isArray(udders) ? udders : [udders],
            severity,
            startDate,
            startTurn,
            treatmentId,
            owner,
            confirmReMastitis,
            skipEvent
        });

        if (result.reMastitisWarning && !confirmReMastitis) {
            return res.status(200).json({
                success: false,
                reMastitisWarning: result.reMastitisWarning
            });
        }

        res.status(200).json({
            success: true,
            message: "Animal agregado a tratamiento con éxito",
            cow: result.cow,
            currentTurn: result.cow.currentTurn
        });

    } catch (error) {
        console.error("Error al agregar vaca a tratamiento:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error interno del servidor"
        });
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
        const owner = req.session.user._id;
        const result = await cowManager.deleteCow(req.params.cid, owner);

        if(result.success){
            res.status(200).json(result)
        } else {
            res.status(400).json(result)
        }
    } catch (error) {
        console.log(error)
    }
})

router.post("/mark-treated/:_id", async (req, res) => {
    try {
        const { _id } = req.params;
        const { turn } = req.body;
        const userId = req.session.user._id;

        const result = await cowManager.markCowAsTreated(_id, parseInt(turn), userId);

        res.json({
            success: true,
            cow: result.cow,
            currentTurn: result.cow.currentTurn,
            medicationSchedule: result.cow.medicationSchedule
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post("/finalize-milk-discard/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user._id;

        const result = await cowManager.finalizeMilkDiscard(id, userId);

        res.json({
            success: true,
            cow: result.cow,
            message: "Descarte de leche finalizado"
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router
