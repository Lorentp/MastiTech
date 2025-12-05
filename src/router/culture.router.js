const express = require("express");
const router = express.Router();
const CultureManager = require("../managers/culture-manager");
const cultureManager = new CultureManager();

router.post("/add", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const owner = req.session.user._id;
    const { name, udders, startDate, result } = req.body;

    const { culture, created } = await cultureManager.addCulture({
      owner,
      name,
      udders,
      startDate,
      result,
    });

    res.status(200).json({
      success: true,
      message: created
        ? "Cultivo creado con exito"
        : "Se agrego un nuevo evento de cultivo al animal",
      data: culture,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error al crear el cultivo",
    });
  }
});

router.post("/:id/result", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const { id } = req.params;
    const { result } = req.body;
    const owner = req.session.user._id;

    const culture = await cultureManager.addResult(id, owner, result);
    res.status(200).json({ success: true, data: culture });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error al actualizar resultado",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const owner = req.session.user._id;
    const cultures = await cultureManager.getCultures(owner);
    res.status(200).json({ success: true, data: cultures });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener cultivos",
    });
  }
});

router.post("/:id/delete", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const { id } = req.params;
    const owner = req.session.user._id;
    await cultureManager.deleteCulture(id, owner);
    res.status(200).json({ success: true, message: "Cultivo eliminado" });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error al eliminar cultivo",
    });
  }
});

module.exports = router;
