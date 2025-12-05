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
});
