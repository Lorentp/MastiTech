document.addEventListener("click", async (e) => {
  const button = e.target.closest(".cow-treatment-delete");
  if (!button) return;
  e.stopPropagation();

  const cowId = button.dataset.cowId;
  const entryId = button.dataset.entryId;
  const title = button.dataset.title;
  const startLabel = button.dataset.startLabel;
  const endLabel = button.dataset.endLabel;
  const uddersCount = parseInt(button.dataset.uddersCount || "0", 10);
  const isMastitis = Number.isFinite(uddersCount) && uddersCount > 0;

  if (!cowId || !entryId) {
    return Swal.fire("Error", "No se pudo identificar el tratamiento", "error");
  }

  const confirm = await Swal.fire({
    title: "Eliminar tratamiento",
    html: `
      <div style="text-align:left">
        <p>Se va a eliminar este tratamiento del historial:</p>
        <p><strong>Tratamiento:</strong> ${title || "N/D"}</p>
        <p><strong>Inicio:</strong> ${startLabel || "N/D"}</p>
        <p><strong>Fin:</strong> ${endLabel || "N/D"}</p>
        <p><strong>Tipo:</strong> ${isMastitis ? "Mastitis (descuenta 1 evento)" : "Otro (no descuenta evento)"}</p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!confirm.isConfirmed) return;

  button.disabled = true;
  try {
    const res = await fetch(`/cow/${cowId}/treatment/${entryId}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.message || "No se pudo eliminar el tratamiento");
    }

    Swal.fire("Eliminado", "Tratamiento eliminado", "success").then(() => {
      window.location.reload();
    });
  } catch (error) {
    Swal.fire("Error", error.message || "No se pudo eliminar", "error");
  } finally {
    button.disabled = false;
  }
});

