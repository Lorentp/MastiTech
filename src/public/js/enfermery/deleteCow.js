document.addEventListener("DOMContentLoaded", function () {
        const nameDeleteCow = document.getElementById("nameDeleteCow");
        const idInputDeleteCow = document.getElementById("idInputDeleteCow");
        const deleteCowForm = document.getElementById("deleteCowForm");

        // Check if elements exist
        if (!nameDeleteCow || !idInputDeleteCow || !deleteCowForm) {
            console.error("One or more DOM elements not found: nameDeleteCow, idInputDeleteCow, deleteCowForm");
            return;
        }

        function updateDeleteFormInfo() {
            const selectedOption = nameDeleteCow[nameDeleteCow.selectedIndex];
            const _id = selectedOption.getAttribute("_id");
            idInputDeleteCow.value = _id;
        }

        nameDeleteCow.addEventListener("change", updateDeleteFormInfo);

        deleteCowForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const cid = idInputDeleteCow.value;
            const cowName = nameDeleteCow.value;
            if (!cid) {
                console.error("No cow ID provided");
                return;
            }

            const confirmDeletion = () => {
                return Swal.fire({
                    icon: "warning",
                    title: "Confirmar eliminación",
                    text: `¿Eliminar al animal "${cowName}"?`,
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                });
            };

            const hasSwal = typeof Swal !== "undefined";
            (hasSwal ? confirmDeletion() : Promise.resolve({ isConfirmed: true }))
                .then(result => {
                    if (!result.isConfirmed) return;

                    return fetch(`/cow/delete/${cid}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });
                })
                .then(response => response ? response.json() : null)
                .then(result => {
                    if (!result) return;
                    if (result.success) {
                        Swal.fire("Eliminado", `Animal "${cowName}" eliminado con éxito`, "success")
                            .then(() => window.location.href = "/home");
                    } else {
                        Swal.fire("Error", result.message || "No se pudo eliminar el animal", "error");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    Swal.fire("Error", "Error al eliminar el animal: " + error.message, "error");
                });
        });
    });
