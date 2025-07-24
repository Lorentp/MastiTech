document.addEventListener("DOMContentLoaded", function () {
    const nameDeleteTreatment = document.getElementById("nameDeleteTreatment");
    const idInputDeleteTreatment = document.getElementById("idInputDeleteTreatment");
    const deleteTreatmentForm = document.getElementById("deleteTreatmentForm");

    if (!nameDeleteTreatment || !idInputDeleteTreatment || !deleteTreatmentForm) {
        console.error("Elementos del formulario no encontrados");
        return;
    }

    function updateDeleteFormTreatmentInfo() {
        const _id = nameDeleteTreatment.value;  // Usa el value del select (debe ser el _id en el template)
        idInputDeleteTreatment.value = _id;
    }

    nameDeleteTreatment.addEventListener("change", updateDeleteFormTreatmentInfo);

    deleteTreatmentForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const cid = idInputDeleteTreatment.value;
        if (!cid) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Seleccione un tratamiento válido para eliminar.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Confirmación antes de eliminar
        const confirmResult = await Swal.fire({
            title: '¿Eliminar tratamiento?',
            text: `¿Estás seguro de eliminar el tratamiento seleccionado? Esto afectará los registros de mastitis en tus rodeos.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmResult.isConfirmed) {
            return;  // Usuario canceló
        }

        // Enviar la solicitud de eliminación
        try {
            const response = await fetch(`/treatment/delete/${cid}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Tratamiento eliminado correctamente. Los datos de mastitis se han actualizado.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.location.href = "/home";  // Redirigir después de confirmar
                });
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudo eliminar el tratamiento: ${error.message}. Verifica los registros de mastitis.`,
                confirmButtonText: 'OK'
            });
        }
    });
});