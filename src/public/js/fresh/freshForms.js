const todayISO = () => new Date().toISOString().split("T")[0];

(() => {
  // Defaults
  document.querySelectorAll('input[name="flujeoStartDate"]').forEach((i) => {
    if (!i.value) i.value = todayISO();
  });
  document.querySelectorAll('input[type="date"][name="treatmentStartDate"]').forEach((i) => {
    if (!i.value) i.value = todayISO();
  });
  document.querySelectorAll('input[name="flujeoStartTurn"]').forEach((i) => {
    if (!i.value) i.value = "morning";
  });
})();

document.getElementById("fresh-cow-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/fresh/cow/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      Swal.fire("Listo", "Animal cargado", "success").then(() => window.location.reload());
    } else {
      Swal.fire("Error", json.message || "No se pudo cargar", "error");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo cargar", "error");
  }
});

document.getElementById("fresh-event-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/fresh/event/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      Swal.fire("Listo", "Evento guardado", "success").then(() => window.location.reload());
    } else {
      Swal.fire("Error", json.message || "No se pudo guardar", "error");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo guardar", "error");
  }
});

document.getElementById("flujeo-type-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/fresh/endometritis/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      Swal.fire("Listo", "Tipo de flujeo guardado", "success").then(() =>
        window.location.reload()
      );
    } else {
      Swal.fire("Error", json.message || "No se pudo guardar", "error");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo guardar", "error");
  }
});

// Toggle medicación dentro de cada formulario de finalización
document.addEventListener("change", (e) => {
  if (e.target.matches('input[name="startMedication"]')) {
    const form = e.target.closest("form");
    const block = form?.querySelector(".fresh-medication-block");
    if (!block) return;
    block.classList.toggle("hidden", !e.target.checked);
  }
});

document.addEventListener("submit", async (e) => {
  const finalizeEventForm = e.target.closest(".finalize-event-form");
  if (finalizeEventForm) {
    e.preventDefault();
    const formData = new FormData(finalizeEventForm);
    const cowId = formData.get("cowId");
    const payload = Object.fromEntries(formData.entries());
    payload.startMedication = payload.startMedication ? true : false;

    if (!payload.flujeoStartDate) payload.flujeoStartDate = todayISO();
    if (payload.startMedication) {
      if (!payload.treatmentStartDate) payload.treatmentStartDate = todayISO();
      if (!payload.treatmentStartTurn) payload.treatmentStartTurn = "morning";
    }

    try {
      const res = await fetch(`/fresh/cow/${cowId}/finalize-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Listo", "Flujeo guardado", "success").then(() => window.location.reload());
      } else {
        Swal.fire("Error", json.message || "No se pudo guardar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar", "error");
    }
  }

  const finalizeFlujeoForm = e.target.closest(".finalize-flujeo-form");
  if (finalizeFlujeoForm) {
    e.preventDefault();
    const formData = new FormData(finalizeFlujeoForm);
    const cowId = formData.get("cowId");
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/fresh/cow/${cowId}/finalize-flujeo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Listo", "Flujeo finalizado", "success").then(() => window.location.reload());
      } else {
        Swal.fire("Error", json.message || "No se pudo finalizar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo finalizar", "error");
    }
  }

  const deleteFreshCowForm = e.target.closest(".delete-fresh-cow-form");
  if (deleteFreshCowForm) {
    e.preventDefault();
    const formData = new FormData(deleteFreshCowForm);
    const cowId = formData.get("cowId");
    try {
      const res = await fetch(`/fresh/cow/${cowId}/delete`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Listo", "Animal eliminado", "success").then(() => window.location.reload());
      } else {
        Swal.fire("Error", json.message || "No se pudo eliminar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  }

  const clearFlujeoForm = e.target.closest(".delete-flujeo-form");
  if (clearFlujeoForm) {
    e.preventDefault();
    const formData = new FormData(clearFlujeoForm);
    const cowId = formData.get("cowId");
    try {
      const res = await fetch(`/fresh/cow/${cowId}/clear-flujeo`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Listo", "Endometritis eliminada", "success").then(() => window.location.reload());
      } else {
        Swal.fire("Error", json.message || "No se pudo eliminar", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  }
});
