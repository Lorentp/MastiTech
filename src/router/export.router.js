const express = require("express");
const router = express.Router();
const ExportManager = require("../managers/export-manager");
const exportManager = new ExportManager();

router.get("/download", async (req, res) => {
  try {
    if (!req.session?.login || !req.session?.user?._id) {
      return res.status(401).send("No autorizado");
    }

    const owner = req.session.user._id;
    const { period = "month", referenceDate, days = 7 } = req.query;

    const { buffer } = await exportManager.buildWorkbook({
      owner,
      period,
      referenceDate,
      days,
    });

    const safeDate = (referenceDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, "");
    const filename = `mastitech-export-${period}-${safeDate}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Error exportando Excel:", error);
    res.status(400).send(error.message || "No se pudo generar el archivo");
  }
});

module.exports = router;

