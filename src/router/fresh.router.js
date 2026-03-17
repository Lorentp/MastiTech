const express = require("express");
const router = express.Router();
const FreshManager = require("../managers/fresh-manager");
const freshManager = new FreshManager();

router.post("/event/add", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { title, duration } = req.body;
    const event = await freshManager.addEventTemplate({ owner, title, duration });
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/event/:id/delete", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    await freshManager.deleteEventTemplate({ owner, id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/flujeo/add", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { title } = req.body;
    const flujeo = await freshManager.addFlujeoType({ owner, title });
    res.status(200).json({ success: true, data: flujeo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Alias nuevos: "endometritis"
router.post("/endometritis/add", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { title } = req.body;
    const flujeo = await freshManager.addFlujeoType({ owner, title });
    res.status(200).json({ success: true, data: flujeo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/flujeo/:id/delete", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    await freshManager.deleteFlujeoType({ owner, id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/cow/add", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { name, observation, calvingDate, eventStartTurn, eventId } = req.body;
    const cow = await freshManager.addFreshCow({
      owner,
      name,
      observation,
      calvingDate,
      eventStartTurn,
      eventId,
    });
    res.status(200).json({ success: true, data: cow });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/cow/:id/update", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    const { name, observation, calvingDate, eventStartTurn, eventId } = req.body;
    const cow = await freshManager.updateFreshCow({
      owner,
      cowId: id,
      name,
      observation,
      calvingDate,
      eventStartTurn,
      eventId,
    });
    res.status(200).json({ success: true, data: cow });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/cow/:id/finalize-event", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    const {
      flujeoTypeId,
      flujeoStartDate,
      flujeoStartTurn,
      startMedication,
      treatmentId,
      treatmentStartDate,
      treatmentStartTurn,
      ketosisLevel,
    } = req.body;

    const cow = await freshManager.finalizeEventToFlujeo({
      owner,
      cowId: id,
      flujeoTypeId,
      flujeoStartDate,
      flujeoStartTurn,
      startMedication: startMedication === true || startMedication === "true",
      treatmentId,
      treatmentStartDate,
      treatmentStartTurn,
      ketosisLevel,
    });
    res.status(200).json({ success: true, data: cow });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/cow/:id/finalize-flujeo", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    const { ketosisLevel } = req.body;
    const cow = await freshManager.finalizeFlujeo({ owner, cowId: id, ketosisLevel });
    res.status(200).json({ success: true, data: cow });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/cow/:id/delete", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    await freshManager.deleteFreshCow({ owner, cowId: id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/cow/:id/clear-flujeo", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    const cow = await freshManager.clearFlujeo({ owner, cowId: id });
    res.status(200).json({ success: true, data: cow });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/endometritis/:id/delete", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const { id } = req.params;
    await freshManager.deleteFlujeoType({ owner, id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
