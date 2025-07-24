const express = require("express")
const router = express.Router()

const TreatmentsManager = require("../managers/treatments-manager")
const treatmentManager = new TreatmentsManager()


router.post ("/add", async (req,res) => {
    try {
        const owner = req.session.user._id;
        const { title, duration, medications, milkDiscardTurns } = req.body;
        const newTreatment = {
            title,
            duration,
            medications,
            milkDiscardTurns,
            owner
        };

        const treatment = await treatmentManager.addTreatment(newTreatment);

        res.status(200).json({
            success: true,
            message: "Tratamiento creado con exito",
            data: treatment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error, intentelo nuevamente"
        });
        console.log(error);
    }
})

router.post("/update/:cid", async (req,res) =>{
    try {
        const treatmentId = req.params.cid
        const formData = req.body
        
        await treatmentManager.updateTreatment(treatmentId, formData)

        res.status(200).json({
            success:true,
            message: "Tratamiento actualizado con exito"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message:"Error, intentelo nuevamnete"
        })
        console.log(error)
    }
})

router.post("/delete/:cid", async (req,res) =>{
    try {
        const treatmentId = req.params.cid
        await treatmentManager.deleteTreatment(treatmentId)

        res.status(200).json({
            success: true,
            message: "Tratamiento eliminado con exito"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error, intentelo nuevamente"
        })
    }
})

router.get("/:id", async (req, res) => {
    try {
        const treatmentId = req.params.id;
        const treatment = await treatmentManager.getTreatmentsById(treatmentId);
        res.status(200).json(treatment);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving treatment"
        });
        console.log(error);
    }
});

router.get("/:id/schedule", async (req, res) => {
    try {
        const treatmentId = req.params.id;
        const treatment = await treatmentManager.getTreatmentsById(treatmentId);
        const schedule = TreatmentsManager.generateMedicationSchedule(treatment);
        res.status(200).json({
            success: true,
            schedule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving treatment schedule"
        });
        console.log(error);
    }
});


module.exports = router