const express = require("express")
const router = express.Router()

const CowManager = require("../managers/cows-manager")
const TreatmentsManager = require("../managers/treatments-manager")
const cowManager = new CowManager()
const treatmentManager = new TreatmentsManager()


router.get("/registrar", async (req, res) => {
    try {
        res.render("register")
    } catch (error) {
        console.log(error)
    }
})

router.get("/", async(req, res) => {
    try {
        const errors = req.session.errors || {}
        delete req.session.errors
        res.render ("login", {errors})
    } catch (error) {
        console.log(error)
    }
})


router.get("/home", async (req, res) => {
    try {
        if (!req.session.login) {
            res.redirect("/");
            return;
        }

        const userId = req.session.user._id;
        const treatments = await treatmentManager.getTreatments(userId);
        const cows = await cowManager.getCows(userId);
        res.render("enfermery", { treatments, cows });
    } catch (error) {
        console.log(error);
    }
});
router.get("/en-tratamiento", async (req, res) => {
    try {
        if (!req.session.login) {
            res.redirect("/");
            return;
        }
        const userId = req.session.user._id;

        const { untreatedCows, treatedCows } = await cowManager.getCowsInTreatment(userId);
        const treatments = await treatmentManager.getTreatments(userId);
        res.render("enfermery-treating", { untreatedCows, treatedCows, treatments});
    } catch (error) {
        console.log("Error fetching cows in treatment:", error);
        res.status(500).send("Error, intentelo nuevamente");
    }
});


router.get("/descarte-leche", async (req, res) => {
    try {
        if (!req.session.login) {
            res.redirect("/");
            return;
        }
        const userId = req.session.user._id;
        const milkDiscardCows = await cowManager.getCowsInMilkDiscard(userId);
        res.render("enfermery-discarding-milk", { milkDiscardCows});
    } catch (error) {
        console.log("Error fetching cows in treatment:", error);
        res.status(500).send("Error, intentelo nuevamente");
    }
});

router.get("/liberar-leche", async (req,res) => {
    try {
        if (!req.session.login){
            res.redirect("/")
            return
        }
        const userId = req.session.user._id
        const finishedMilkDiscardCows = await cowManager.getFinishedMilkDiscardCows(userId)
        res.render("enfermery-finished-milk-discard", { finishedMilkDiscardCows })
    } catch (error) {
        console.log("Error ffetching finished milk discard cows:", error)
        res.status(500).send("Error, intentelo nuevamente")
    }
})
module.exports = router