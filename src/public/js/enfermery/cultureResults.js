document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("culture-result-save")) {
    const id = e.target.dataset.id;
    const select = document.querySelector(`.culture-result-select[data-id="${id}"]`);
    const result = select?.value;
    const check = document.querySelector(`.with-treatment-check[data-id="${id}"]`);
    const withTreatment = check ? check.checked : false;
    if (!result) return;

    try {
      const res = await fetch(`/culture/${id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, withTreatment }),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Listo", "Resultado actualizado", "success").then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire("Error", json.message || "No se pudo actualizar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar", "error");
    }
  }

  if (e.target.classList.contains("culture-delete")) {
    const id = e.target.dataset.id;
    const confirm = await Swal.fire({
      title: "Eliminar cultivo",
      text: "Esta acción eliminará todos los eventos del cultivo. ¿Continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/culture/${id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Eliminado", "Cultivo eliminado", "success").then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire("Error", json.message || "No se pudo eliminar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  }

  const eventDeleteButton = e.target.closest(".culture-event-delete");
  if (eventDeleteButton) {
    const cultureId = eventDeleteButton.dataset?.id;
    const eventId = eventDeleteButton.dataset?.eventId;
    const result = eventDeleteButton.dataset?.result;
    const dateLabel = eventDeleteButton.dataset?.dateLabel;
    const uddersLabel = eventDeleteButton.dataset?.uddersLabel;
    const withTreatment = eventDeleteButton.dataset?.withTreatment === "true";

    if (!cultureId || !eventId) {
      return Swal.fire("Error", "No se pudo identificar el evento", "error");
    }

    const confirm = await Swal.fire({
      title: "Eliminar evento",
      html: `
        <div style="text-align:left">
          <p>Se va a eliminar este evento:</p>
          <p><strong>Resultado:</strong> ${result || "N/D"}</p>
          <p><strong>Fecha:</strong> ${dateLabel || "N/D"}</p>
          ${uddersLabel ? `<p><strong>Ubres:</strong> ${uddersLabel}</p>` : ""}
          <p><strong>Tratamiento:</strong> ${withTreatment ? "Con tratamiento" : "Sin tratamiento"}</p>
          <p style="margin-top:10px"><strong>Esto no elimina el animal</strong>, solo este evento del cultivo.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/culture/${cultureId}/event/${eventId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Eliminado", "Evento eliminado", "success").then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire("Error", json.message || "No se pudo eliminar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  }

  const eventEditButton = e.target.closest(".culture-event-edit");
  if (eventEditButton) {
    const cultureId = eventEditButton.dataset?.id;
    const eventId = eventEditButton.dataset?.eventId;
    const result = eventEditButton.dataset?.result;
    const dateLabel = eventEditButton.dataset?.dateLabel;
    const recordedAt = eventEditButton.dataset?.recordedAt;
    const uddersLabel = eventEditButton.dataset?.uddersLabel;
    const udders = (eventEditButton.dataset?.udders || "").split(",").filter(Boolean);
    const currentWithTreatment = eventEditButton.dataset?.withTreatment === "true";

    if (!cultureId || !eventId) {
      return Swal.fire("Error", "No se pudo identificar el evento", "error");
    }

    const { isConfirmed, value } = await Swal.fire({
      title: "Editar evento",
      html: `
        <div style="text-align:left">
          <div class="fresh-swal-form">
            <div class="fresh-swal-field">
              <label for="swal-culture-result">Resultado</label>
              <select id="swal-culture-result" class="swal2-input">
                <option value="pendiente" ${result === "pendiente" ? "selected" : ""}>Pendiente</option>
                <option value="negativo" ${result === "negativo" ? "selected" : ""}>Negativo</option>
                <option value="sin desarrollo" ${result === "sin desarrollo" ? "selected" : ""}>Sin desarrollo</option>
                <option value="positivo" ${result === "positivo" ? "selected" : ""}>Positivo</option>
                <option value="contaminada" ${result === "contaminada" ? "selected" : ""}>Contaminada</option>
              </select>
            </div>
            <div class="fresh-swal-field">
              <label for="swal-culture-date">Fecha</label>
              <input id="swal-culture-date" type="date" class="swal2-input" value="${recordedAt ? recordedAt.split("T")[0] : ""}">
            </div>
            <div class="fresh-swal-field">
              <label>Ubres</label>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                ${["DI", "DD", "TI", "TD"].map((u) => `
                  <label style="display:flex; gap:6px; align-items:center;">
                    <input type="checkbox" class="swal-culture-udder" value="${u}" ${udders.includes(u) ? "checked" : ""}>
                    ${u}
                  </label>
                `).join("")}
              </div>
              ${uddersLabel ? `<div style="margin-top:6px; font-size:.9rem;">Actual: ${uddersLabel}</div>` : ""}
            </div>
            <div class="fresh-swal-field">
              <label style="display:flex; gap:10px; align-items:center;">
                <input id="swal-with-treatment" type="checkbox" ${currentWithTreatment ? "checked" : ""} />
                Con tratamiento
              </label>
            </div>
          </div>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const chk = document.getElementById("swal-with-treatment");
        const selectedUdders = Array.from(document.querySelectorAll(".swal-culture-udder:checked")).map((el) => el.value);
        const payload = {
          result: document.getElementById("swal-culture-result")?.value,
          recordedAt: document.getElementById("swal-culture-date")?.value,
          udders: selectedUdders,
          withTreatment: !!chk?.checked,
        };
        if (!payload.result || !payload.recordedAt) {
          Swal.showValidationMessage("Completa resultado y fecha");
          return false;
        }
        return payload;
      },
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/culture/${cultureId}/event/${eventId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "No se pudo actualizar el evento");
      }
      Swal.fire("Listo", "Evento actualizado", "success").then(() => window.location.reload());
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo actualizar", "error");
    }
  }
});

// (antes: checkbox solo para "contaminada") ahora "Con tratamiento" aplica a cualquier resultado
