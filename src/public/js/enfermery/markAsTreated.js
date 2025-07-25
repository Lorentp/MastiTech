document.addEventListener("DOMContentLoaded", () => {
    const forms = document.querySelectorAll(".mark-treated-form");
    forms.forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const button = form.querySelector("button[type=submit]");
            const cowId = button.dataset.id;
            button.disabled = true;

            const formData = new FormData(form);
            const data = {
                turn: formData.get("turn"),
            };

            try {
                const response = await fetch(`/cow/mark-treated/${cowId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (response.ok) {
                    Swal.fire({
                        title: "Éxito",
                        text: "Vaca marcada como tratada con éxito",
                        icon: "success",
                        confirmButtonText: "OK"
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        title: "Error",
                        text: result.message || "No se pudo marcar la vaca como tratada",
                        icon: "error",
                        confirmButtonText: "OK"
                    });
                }
            } catch (error) {
                console.log("Error submitting mark treated form:", error);
                Swal.fire({
                    title: "Error",
                    text: error,
                    icon: "error",
                    confirmButtonText: "OK"
                });
            } finally {
                button.disabled = false;
            }
        });
    });
});