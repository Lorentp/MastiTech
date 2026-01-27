document.addEventListener("click", async (e) => {
  const button = e.target.closest(".finalize-milk-discard-early");
  if (!button) return;

  const cowId = button.dataset.id;
  if (!cowId) return;

  const confirm = await Swal.fire({
    title: "Liberar antes",
    text: "Esto liberará el animal antes de la fecha de fin de descarte. ¿Continuar?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, liberar",
    cancelButtonText: "Cancelar",
  });
  if (!confirm.isConfirmed) return;

  button.disabled = true;
  try {
    const res = await fetch(`/cow/finalize-milk-discard-early/${cowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.message || "No se pudo liberar el animal");
    }
    Swal.fire("Listo", "Animal liberado", "success").then(() => {
      window.location.reload();
    });
  } catch (error) {
    Swal.fire("Error", error.message || "No se pudo liberar", "error");
  } finally {
    button.disabled = false;
  }
});

