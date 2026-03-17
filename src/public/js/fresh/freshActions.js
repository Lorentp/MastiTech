(() => {
  const homeSearch = document.getElementById("fresh-home-search");
  if (homeSearch) {
    const cards = Array.from(document.querySelectorAll(".fresh-home-card"));
    const filter = () => {
      const term = homeSearch.value.trim().toLowerCase();
      cards.forEach((card) => {
        const name = (card.dataset.name || "").toLowerCase();
        card.style.display = !term || name.includes(term) ? "" : "none";
      });
    };
    homeSearch.addEventListener("input", filter);
    filter();
  }
})();

document.addEventListener("click", async (e) => {
  const deleteButton = e.target.closest(".fresh-delete-button");
  if (deleteButton) {
    const cowId = deleteButton.dataset.cowId;
    const name = deleteButton.dataset.name || "este animal";

    const confirm = await Swal.fire({
      title: "Eliminar animal",
      text: `Se va a eliminar ${name} de Recien paridas. ¿Continuar?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/fresh/cow/${cowId}/delete`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "No se pudo eliminar");
      Swal.fire("Listo", "Animal eliminado", "success").then(() => window.location.reload());
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo eliminar", "error");
    }
    return;
  }

  const editButton = e.target.closest(".fresh-edit-button");
  if (!editButton) return;

  const cowId = editButton.dataset.cowId;
  const currentName = editButton.dataset.name || "";
  const currentObservation = editButton.dataset.observation || "";
  const currentCalvingDate = editButton.dataset.calvingDate || "";
  const currentTurn = editButton.dataset.eventStartTurn || "morning";
  const currentEventTitle = editButton.dataset.eventTitle || "";
  const options = Array.isArray(window.freshEventOptions) ? window.freshEventOptions : [];

  const eventOptionsHtml = options
    .map((opt) => {
      const selected = opt.title === currentEventTitle ? "selected" : "";
      return `<option value="${opt._id}" ${selected}>${opt.title} (${opt.duration} turnos)</option>`;
    })
    .join("");

  const { isConfirmed, value } = await Swal.fire({
    title: "Editar animal",
    html: `
      <div class="fresh-swal-form">
        <div class="fresh-swal-field">
          <label for="swal-fresh-name">Caravana</label>
          <input id="swal-fresh-name" class="swal2-input" value="${currentName}">
        </div>
        <div class="fresh-swal-field">
          <label for="swal-fresh-observation">Observacion</label>
          <input id="swal-fresh-observation" class="swal2-input" value="${currentObservation}">
        </div>
        <div class="fresh-swal-field">
          <label for="swal-fresh-date">Fecha de paricion</label>
          <input id="swal-fresh-date" type="date" class="swal2-input" value="${currentCalvingDate}">
        </div>
        <div class="fresh-swal-field">
          <label for="swal-fresh-turn">Turno de arranque</label>
          <select id="swal-fresh-turn" class="swal2-input">
            <option value="morning" ${currentTurn === "morning" ? "selected" : ""}>Manana</option>
            <option value="afternoon" ${currentTurn === "afternoon" ? "selected" : ""}>Tarde</option>
          </select>
        </div>
        <div class="fresh-swal-field">
          <label for="swal-fresh-event">Evento</label>
          <select id="swal-fresh-event" class="swal2-input">
            <option value="">Seleccione</option>
            ${eventOptionsHtml}
          </select>
        </div>
      </div>
    `,
    width: "min(92vw, 34rem)",
    customClass: {
      popup: "fresh-swal-popup",
      htmlContainer: "fresh-swal-html",
    },
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const payload = {
        name: document.getElementById("swal-fresh-name")?.value?.trim(),
        observation: document.getElementById("swal-fresh-observation")?.value?.trim() || "",
        calvingDate: document.getElementById("swal-fresh-date")?.value,
        eventStartTurn: document.getElementById("swal-fresh-turn")?.value,
        eventId: document.getElementById("swal-fresh-event")?.value,
      };

      if (!payload.name || !payload.calvingDate || !payload.eventStartTurn || !payload.eventId) {
        Swal.showValidationMessage("Completa todos los campos");
        return false;
      }
      return payload;
    },
  });

  if (!isConfirmed) return;

  try {
    const res = await fetch(`/fresh/cow/${cowId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || "No se pudo actualizar");
    Swal.fire("Listo", "Animal actualizado", "success").then(() => window.location.reload());
  } catch (error) {
    Swal.fire("Error", error.message || "No se pudo actualizar", "error");
  }
});
