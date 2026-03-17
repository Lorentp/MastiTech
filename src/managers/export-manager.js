const moment = require("moment-timezone");
const XlsxPopulate = require("xlsx-populate");
const CowModel = require("../models/cow.model");
const CultureModel = require("../models/culture.model");
const FreshCowModel = require("../models/freshCow.model");

class ExportManager {
  getDateRange({ period, referenceDate, days }) {
    const base = referenceDate
      ? moment.tz(referenceDate, "America/Argentina/Buenos_Aires")
      : moment().tz("America/Argentina/Buenos_Aires");

    if (!base.isValid()) {
      throw new Error("Fecha de referencia inválida");
    }

    let start;
    let end;

    switch (period) {
      case "week":
        start = base.clone().startOf("isoWeek");
        end = base.clone().endOf("isoWeek");
        break;
      case "month":
        start = base.clone().startOf("month");
        end = base.clone().endOf("month");
        break;
      case "year":
        start = base.clone().startOf("year");
        end = base.clone().endOf("year");
        break;
      case "days": {
        const numericDays = parseInt(days, 10);
        if (!Number.isFinite(numericDays) || numericDays < 1) {
          throw new Error("Cantidad de días inválida");
        }
        end = base.clone().endOf("day");
        start = base.clone().startOf("day").subtract(numericDays - 1, "days");
        break;
      }
      default:
        throw new Error("Período inválido");
    }

    return {
      start: start.toDate(),
      end: end.toDate(),
      label: `${start.format("DD/MM/YYYY")} - ${end.format("DD/MM/YYYY")}`,
    };
  }

  isMastitisEntry(entry) {
    if (entry?.countedAsEvent === true) return true;
    if (entry?.countedAsEvent === false) return false;
    return Array.isArray(entry?.udders) && entry.udders.length > 0;
  }

  async getMastitisRows(owner, start, end) {
    const cows = await CowModel.find({ owner }).lean();
    const rows = [];

    for (const cow of cows) {
      for (const entry of cow.treatmentsHistory || []) {
        const date = entry?.startDate ? new Date(entry.startDate) : null;
        if (!date || date < start || date > end) continue;
        if (!this.isMastitisEntry(entry)) continue;

        rows.push({
          animal: cow.name,
          tratamiento: entry?.treatmentSnapshot?.title || "",
          inicioFecha: this.formatDate(entry.startDate),
          inicioTurno: this.formatTurn(entry.startTurn),
          finTratamiento: this.formatDate(entry.endDate),
          finDescarte: this.formatDate(entry.endDateDiscardMilk),
          severidad: entry.severity || "",
          ubres: this.joinList(entry.udders),
          remastitis: entry.isReMastitis ? "Si" : "No",
          tratamientoFinalizado: entry.finished ? "Si" : "No",
          lecheLiberada: entry.milkDiscardCompletedAt ? "Si" : "No",
          medicamentos: this.formatMedications(entry?.treatmentSnapshot?.medications),
        });
      }
    }

    return rows.sort((a, b) => a.animal.localeCompare(b.animal, "es", { numeric: true, sensitivity: "base" }));
  }

  async getOtherTreatmentRows(owner, start, end) {
    const cows = await CowModel.find({ owner }).lean();
    const rows = [];

    for (const cow of cows) {
      for (const entry of cow.treatmentsHistory || []) {
        const date = entry?.startDate ? new Date(entry.startDate) : null;
        if (!date || date < start || date > end) continue;
        if (this.isMastitisEntry(entry)) continue;

        rows.push({
          animal: cow.name,
          tratamiento: entry?.treatmentSnapshot?.title || "",
          inicioFecha: this.formatDate(entry.startDate),
          inicioTurno: this.formatTurn(entry.startTurn),
          finTratamiento: this.formatDate(entry.endDate),
          finDescarte: this.formatDate(entry.endDateDiscardMilk),
          estado: entry.finished ? "Finalizado" : "Activo",
          medicamentos: this.formatMedications(entry?.treatmentSnapshot?.medications),
        });
      }
    }

    return rows.sort((a, b) => a.animal.localeCompare(b.animal, "es", { numeric: true, sensitivity: "base" }));
  }

  async getCultureRows(owner, start, end) {
    const cultures = await CultureModel.find({ owner }).lean();
    const rows = [];

    for (const culture of cultures) {
      for (const event of culture.events || []) {
        const date = event?.recordedAt ? new Date(event.recordedAt) : null;
        if (!date || date < start || date > end) continue;

        const withTreatment =
          typeof event.withTreatment === "boolean"
            ? event.withTreatment
            : typeof event.contaminatedWithTreatment === "boolean"
              ? event.contaminatedWithTreatment
              : false;

        rows.push({
          animal: culture.name,
          fecha: this.formatDate(event.recordedAt),
          resultado: event.result || "",
          ubres: this.joinList(event.udders),
          conTratamiento: withTreatment ? "Si" : "No",
          estadoActualCultivo: culture.status || "",
          totalEventos: culture.eventsCount || 0,
        });
      }
    }

    return rows.sort((a, b) => a.animal.localeCompare(b.animal, "es", { numeric: true, sensitivity: "base" }));
  }

  async getFreshRows(owner, start, end) {
    const freshCows = await FreshCowModel.find({ owner }).lean();
    const rows = [];

    for (const cow of freshCows) {
      const date = cow?.calvingDate ? new Date(cow.calvingDate) : null;
      if (!date || date < start || date > end) continue;

      rows.push({
        animal: cow.name,
        fechaParicion: this.formatDate(cow.calvingDate),
        evento: cow?.eventSnapshot?.title || "",
        inicioEvento: this.formatDate(cow.eventStartDate),
        turnoEvento: this.formatTurn(cow.eventStartTurn),
        finEvento: this.formatDate(cow.eventEndDate),
        endometritis: cow?.flujeoSnapshot?.title || "",
        inicioEndometritis: this.formatDate(cow.flujeoStartDate),
        turnoEndometritis: this.formatTurn(cow.flujeoStartTurn),
        tratamientoMedicacion: cow?.medicationTreatment?.treatmentSnapshot?.title || "",
        finTratamientoMedicacion: this.formatDate(cow?.medicationTreatment?.endDate),
        finDescarte: this.formatDate(cow?.medicationTreatment?.endDateDiscardMilk),
        cetosis: cow.ketosisLevel || "",
        finalizado: cow.flujeoFinishedAt ? "Si" : "No",
      });
    }

    return rows.sort((a, b) => a.animal.localeCompare(b.animal, "es", { numeric: true, sensitivity: "base" }));
  }

  async buildWorkbook({ owner, period, referenceDate, days }) {
    const { start, end, label } = this.getDateRange({ period, referenceDate, days });
    const [mastitisRows, otherRows, cultureRows, freshRows] = await Promise.all([
      this.getMastitisRows(owner, start, end),
      this.getOtherTreatmentRows(owner, start, end),
      this.getCultureRows(owner, start, end),
      this.getFreshRows(owner, start, end),
    ]);

    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheets = [
      { name: "Mastitis", rows: mastitisRows },
      { name: "Tratamientos varios", rows: otherRows },
      { name: "Cultivos", rows: cultureRows },
      { name: "Recien paridas", rows: freshRows },
    ];

    workbook.sheet(0).name(sheets[0].name);
    for (let i = 1; i < sheets.length; i++) {
      workbook.addSheet(sheets[i].name);
    }

    sheets.forEach((sheetConfig, index) => {
      const sheet = workbook.sheet(index);
      this.fillSheet(sheet, sheetConfig.name, label, sheetConfig.rows);
    });

    return {
      buffer: await workbook.outputAsync(),
      rangeLabel: label,
    };
  }

  fillSheet(sheet, title, rangeLabel, rows) {
    sheet.cell("A1").value(title).style({ bold: true, fontSize: 14 });
    sheet.cell("A2").value(`Rango: ${rangeLabel}`).style({ italic: true });

    const headers = rows.length > 0 ? Object.keys(rows[0]) : ["sinDatos"];
    headers.forEach((header, index) => {
      const cell = sheet.cell(4, index + 1);
      cell.value(this.prettyHeader(header));
      cell.style({
        bold: true,
        fill: "D9EAD3",
        border: true,
      });
    });

    if (rows.length === 0) {
      sheet.cell("A5").value("Sin datos para el período seleccionado.");
      sheet.column("A").width(40);
      return;
    }

    rows.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        sheet.cell(rowIndex + 5, colIndex + 1).value(row[header]);
      });
    });

    headers.forEach((_, index) => {
      sheet.column(index + 1).width(22);
    });
  }

  prettyHeader(value) {
    return value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }

  joinList(list) {
    return Array.isArray(list) ? list.join(", ") : "";
  }

  formatDate(value) {
    if (!value) return "";
    return moment(value).tz("America/Argentina/Buenos_Aires").format("DD/MM/YYYY");
  }

  formatTurn(turn) {
    if (turn === "morning") return "Manana";
    if (turn === "afternoon") return "Tarde";
    return turn || "";
  }

  formatMedications(medications) {
    if (!Array.isArray(medications) || medications.length === 0) return "";
    return medications
      .map((m) => `${m.name} (cada ${m.applyEveryTurns} t hasta ${m.applyUntilTurn})`)
      .join(" | ");
  }
}

module.exports = ExportManager;

