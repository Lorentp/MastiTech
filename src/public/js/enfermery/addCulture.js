document
  .getElementById("add-culture-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = { udders: [] };

    for (const [key, value] of formData.entries()) {
      if (key === "udders") {
        payload.udders.push(value);
      } else {
        payload[key] = value;
      }
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
