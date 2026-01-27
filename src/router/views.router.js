const express = require("express")
const router = express.Router()

const CowManager = require("../managers/cows-manager")
const TreatmentsManager = require("../managers/treatments-manager")
const CultureManager = require("../managers/culture-manager")
const FreshManager = require("../managers/fresh-manager")
const cowManager = new CowManager()
const treatmentManager = new TreatmentsManager()
const cultureManager = new CultureManager()
const freshManager = new FreshManager()
const moment = require("moment-timezone")


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
        const { untreatedCows, treatedCows } = await cowManager.getCowsInTreatment(userId);
        res.render("enfermery", { treatments, cows, untreatedCows, treatedCows });
    } catch (error) {
        console.log(error);
    }
});
router.get("/cultivos", async (req, res) => {
    try {
        if (!req.session.login) {
            res.redirect("/");
            return;
        }
        const userId = req.session.user._id;
        const culturesDb = await cultureManager.getCultures(userId);
        const culturesSorted = [...culturesDb].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", "es", { numeric: true, sensitivity: "base" })
        );
        const cultures = culturesSorted.map(c => {
            const obj = c.toObject();
            const events = Array.isArray(obj.events) ? [...obj.events].sort((a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0)) : [];
            const eventDates = Array.from(new Set(events
                .filter(e => e && e.recordedAt)
                .map(e => moment(e.recordedAt).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD"))
            ));
            const positives = events.filter(e => e.result === "positivo");
            const negatives = events.filter(e => e.result === "negativo");
            const noGrowth = events.filter(e => e.result === "sin desarrollo");
            const latestEvent = events[0] || null;

            return {
                ...obj,
                eventDates,
                eventStats: {
                    positives: { count: positives.length, dates: positives.map(e => e.recordedAt) },
                    negatives: { count: negatives.length, dates: negatives.map(e => e.recordedAt) },
                    noGrowth: { count: noGrowth.length, dates: noGrowth.map(e => e.recordedAt) },
                },
                eventsDetailed: events.map(e => ({
                    result: e.result,
                    recordedAt: e.recordedAt,
                    recordedAtISO: e.recordedAt ? new Date(e.recordedAt).toISOString() : "",
                    eventId: e._id ? String(e._id) : "",
                    isContaminated: e.result === "contaminada",
                    contaminatedWithTreatment: typeof e.contaminatedWithTreatment === "boolean" ? e.contaminatedWithTreatment : null,
                    udders: Array.isArray(e.udders) ? e.udders : []
                })),
                latestEvent: latestEvent
                  ? {
                      ...latestEvent,
                      recordedAtISO: latestEvent.recordedAt
                        ? new Date(latestEvent.recordedAt).toISOString()
                        : "",
                      eventId: latestEvent._id ? String(latestEvent._id) : "",
                      isContaminated: latestEvent.result === "contaminada",
                      contaminatedWithTreatment: typeof latestEvent.contaminatedWithTreatment === "boolean"
                        ? latestEvent.contaminatedWithTreatment
                        : null,
                    }
                  : null
            };
        });

        const pending = cultures.filter(c => c.status === "pendiente");
        const finished = cultures.filter(c => c.status !== "pendiente");
        res.render("cultures", { pending, finished });
    } catch (error) {
        console.log("Error fetching cultures:", error);
        res.status(500).send("Error, intentelo nuevamente");
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

router.get("/animales", async (req, res) => {
    try {
        if (!req.session.login) {
            res.redirect("/");
            return;
        }
        const userId = req.session.user._id;
        const cows = await cowManager.getCows(userId);
        res.render("all-cows", { cows });
    } catch (error) {
        console.log("Error fetching cows:", error);
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

        for (const cow of milkDiscardCows) {
            const activeEntry = cow.treatmentsHistory.find(t => 
                t.treatmentSnapshot && !t.finished
            );
            cow.currentTreatmentSnapshot = activeEntry?.treatmentSnapshot || null;
            
            // Calculamos turnos restantes
            if (cow.currentTreatmentSnapshot) {
                const start = moment(cow.startDate).tz("America/Argentina/Buenos_Aires");
                const startHour = cow.startTurn === 'morning' ? 0 : 12;
                start.set({ hour: startHour, minute: 0, second: 0 });
                const hoursSinceStart = moment().diff(start, 'hours');
                const currentTurn = Math.floor(hoursSinceStart / 12) + 1;
                const totalDiscardTurns = cow.currentTreatmentSnapshot.milkDiscardTurns;
                cow.remainingDiscardTurns = Math.max(0, totalDiscardTurns - currentTurn + 1);
            }
        }

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

router.get("/recien-paridas", async (req, res) => {
    try {
        if (!req.session.login) {
            res.redirect("/");
            return;
        }

        const userId = req.session.user._id;
        const events = await freshManager.getEventTemplates(userId);
        const flujeoTypes = await freshManager.getFlujeoTypes(userId);
        const treatments = await treatmentManager.getTreatments(userId);
        const freshCowsDb = await freshManager.getFreshCows(userId);

        const freshCows = freshCowsDb.map(c => {
            const obj = c.toObject();
            const eventCurrentTurn = freshManager.calculateCurrentTurn(obj.eventStartDate, obj.eventStartTurn);
            const eventFinished = obj.eventFinishedAt || eventCurrentTurn > (obj.eventSnapshot?.duration || 0);

            const flujeoCurrentTurn = obj.flujeoStartDate && obj.flujeoStartTurn
                ? freshManager.calculateCurrentTurn(obj.flujeoStartDate, obj.flujeoStartTurn)
                : null;
            const flujeoFinished = obj.flujeoFinishedAt;

            // Estado: si ya se cargó endometritis (flujeoStartDate) o se finalizó, pasa a "finalizado"
            const status = (obj.flujeoStartDate || flujeoFinished) ? "finalizado" : "evento";

            return {
                ...obj,
                status,
                eventCurrentTurn,
                eventFinished: Boolean(eventFinished),
                flujeoCurrentTurn,
                flujeoFinished: Boolean(flujeoFinished),
                calvingDateISO: obj.calvingDate ? new Date(obj.calvingDate).toISOString().split("T")[0] : "",
            };
        }).sort((a, b) => (a.name || "").localeCompare(b.name || "", "es", { numeric: true, sensitivity: "base" }));

        const toFinalize = freshCows.filter(c => c.status === "evento" && c.eventFinished && !c.flujeoStartDate);
        const inEvent = freshCows.filter(c => c.status === "evento" && !(c.eventFinished && !c.flujeoStartDate));
        const finished = freshCows.filter(c => c.status === "finalizado");

        res.render("fresh", { events, flujeoTypes, treatments, inEvent, toFinalize, finished });
    } catch (error) {
        console.log("Error recien-paridas:", error);
        res.status(500).send("Error, intentelo nuevamente");
    }
});

router.get("/recien-paridas/animales", async (req, res) => {
    try {
        if (!req.session.login) {
            res.redirect("/");
            return;
        }
        const userId = req.session.user._id;
        const freshCowsDb = await freshManager.getFreshCows(userId);
        const freshCows = freshCowsDb
            .map(c => {
                const obj = c.toObject();
                return {
                    ...obj,
                    calvingDateISO: obj.calvingDate ? new Date(obj.calvingDate).toISOString().split("T")[0] : ""
                };
            })
            .sort((a, b) => (a.name || "").localeCompare(b.name || "", "es", { numeric: true, sensitivity: "base" }));
        res.render("fresh-search", { freshCows });
    } catch (error) {
        console.log("Error recien-paridas animales:", error);
        res.status(500).send("Error, intentelo nuevamente");
    }
});
module.exports = router
