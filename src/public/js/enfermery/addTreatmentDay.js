document.addEventListener("click", async (e) => {
  const button = e.target.closest(".add-treatment-day");
  if (!button) return;

  const cowId = button.dataset.id;
  if (!cowId) return;

  const confirm = await Swal.fire({
    title: "Agregar 1 día de tratamiento",
    html: `
      <div style="text-align:left">
        <p>Esto agregará 24 horas (2 turnos) al tratamiento.</p>
        <p>Los turnos agregados copiarán la medicación del día 1 (turnos 1 y 2).</p>
        <p>También se moverá la fecha de fin de descarte 1 día.</p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, agregar",
    cancelButtonText: "Cancelar",
  });
  if (!confirm.isConfirmed) return;

  button.disabled = true;
  try {
    const res = await fetch(`/cow/add-treatment-day/${cowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.message || "No se pudo agregar el día");
    }

    Swal.fire("Listo", "Se agregó 1 día al tratamiento", "success").then(() => {
      window.location.reload();
    });
  } catch (error) {
    Swal.fire("Error", error.message || "No se pudo agregar el día", "error");
  } finally {
    button.disabled = false;
  }
});

