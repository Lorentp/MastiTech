document
  .getElementById("add-culture-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = { udders: [] };

    for (const [key, value] of formData.entries()) {
      if (key === "udders") {
        payload.udders.push(value);
      } else if (key === "contaminatedWithTreatment") {
        payload[key] = true; // checkbox -> boolean
      } else {
        payload[key] = value;
      }
    }

    if (payload.result !== "contaminada") {
      delete payload.contaminatedWithTreatment;
    } else {
      payload.contaminatedWithTreatment = payload.contaminatedWithTreatment === true;
    }

    try {
      const res = await fetch("/culture/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Listo", json.message || "Cultivo guardado", "success").then(
          () => {
            window.location.href = "/home";
          }
        );
      } else {
        Swal.fire(
          "Error",
          json.message || "No se pudo guardar el cultivo",
          "error"
        );
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el cultivo", "error");
    }
  });

// Toggle del check de tratamiento solo para "contaminada"
(() => {
  const select = document.getElementById("culture-result");
  const extra = document.getElementById("contaminated-extra");
  if (!select || !extra) return;

  const checkbox = document.getElementById("contaminated-treatment");

  const toggle = () => {
    if (select.value === "contaminada") {
      extra.classList.remove("hidden");
    } else {
      extra.classList.add("hidden");
      if (checkbox) checkbox.checked = false;
    }
  };

  select.addEventListener("change", toggle);
  toggle();
})();
