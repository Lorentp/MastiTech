document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("culture-result-save")) {
    const id = e.target.dataset.id;
    const select = document.querySelector(`.culture-result-select[data-id="${id}"]`);
    const result = select?.value;
    if (!result) return;

    try {
      const res = await fetch(`/culture/${id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
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

  if (e.target.classList.contains("culture-event-delete")) {
    const button = e.target.closest(".culture-event-delete");
    const cultureId = button?.dataset?.id;
    const eventId = button?.dataset?.eventId;
    const result = button?.dataset?.result;
    const dateLabel = button?.dataset?.dateLabel;
    const uddersLabel = button?.dataset?.uddersLabel;

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
});
