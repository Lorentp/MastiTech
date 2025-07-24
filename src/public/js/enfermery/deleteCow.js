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
            if (!cid) {
                console.error("No cow ID provided");
                return;
            }

            fetch(`/cow/delete/${cid}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(response => {
                    window.location.href = "/home";
                })
                .catch(error => {
                    console.error("Error:", error);
                    alert("Error al eliminar el animal: " + error.message);
                });
        });
    });
