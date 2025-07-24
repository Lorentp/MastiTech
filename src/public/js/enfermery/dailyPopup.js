

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/daily/has-today")
        const data = await response.json()
        if(!data.has) {
            showDailyPopup()
        }
    } catch (error) {
        console.log("Error verificando registro diario:", error);
    }
})

function showDailyPopup() {
    const moment = window.moment || moment; // Asegura compatibilidad
    const today = moment().tz("America/Argentina/Buenos_Aires").format('YYYY-MM-DD');
    Swal.fire({
        title: 'Registro Diario de Animales en Ordeñe',
        html: `
            <label>Fecha:</label>
            <input type="date" id="swal-daily-date" value="${today}" required>
            <label>Cantidad de animales en ordeñe:</label>
            <input type="number" id="swal-daily-count" min="0" required>
        `,
        focusConfirm: false,
        confirmButtonText: 'Guardar',
        preConfirm: () => {
            const date = document.getElementById('swal-daily-date').value;
            const count = document.getElementById('swal-daily-count').value;
            if (!date || !count) {
                Swal.showValidationMessage('Complete ambos campos');
                return false;
            }
            return { date, count };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/daily/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.value)
                });
                const data = await response.json();
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Éxito',
                        text: 'Registro guardado correctamente',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message,
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar, intente nuevamente',
                    confirmButtonText: 'OK'
                });
                console.log(error);
            }
        }
    });
}