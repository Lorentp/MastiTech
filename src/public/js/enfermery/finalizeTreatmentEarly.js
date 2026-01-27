document.addEventListener("click", async (e) => {
  const button = e.target.closest(".finalize-treatment-early");
  if (!button) return;

  const cowId = button.dataset.id;
  if (!cowId) return;

  const confirm = await Swal.fire({
    title: "Finalizar tratamiento antes",
    text: "Esto cerrará el tratamiento activo y recalculará el fin del descarte desde ahora. ¿Continuar?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, finalizar",
    cancelButtonText: "Cancelar",
  });
  if (!confirm.isConfirmed) return;

  button.disabled = true;
  try {
    const res = await fetch(`/cow/finalize-treatment-early/${cowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.message || "No se pudo finalizar el tratamiento");
    }

    Swal.fire("Listo", "Tratamiento finalizado antes", "success").then(() => {
      window.location.reload();
    });
  } catch (error) {
    Swal.fire("Error", error.message || "No se pudo finalizar", "error");
  } finally {
    button.disabled = false;
  }
});

