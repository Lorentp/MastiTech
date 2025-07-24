document.getElementById('add-cow-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        udders: formData.getAll('udders'), // Use getAll to ensure array
        treatmentId: formData.get('treatmentId'),
        severity: formData.get('severity'),
        startDate: formData.get('startDate'),
        startTurn: formData.get('startTurn'),
        endDate: formData.get('endDate'),
    };
    if (data.udders.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Debe seleccionar al menos una ubre',
            confirmButtonText: 'OK'
        });
        return;
    }
    console.log("Form data being sent:", data); // Add this log
    try {
        const response = await fetch('/cow/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: result.message,
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.reload();
            });
        } else if (result.reMastitisWarning) {
            const { value: confirm } = await Swal.fire({
                icon: 'warning',
                title: 'ATENCION RE-MASTITIS',
                text: result.reMastitisWarning.message,
                showCancelButton: true,
                confirmButtonText: 'Continuar de todos modos',
                cancelButtonText: 'Cancelar y cambiar tratamiento'
            });
            if (confirm) {
                // Re-submit with confirmReMastitis: true
                data.confirmReMastitis = true;
                const confirmResponse = await fetch('/cow/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const confirmResult = await confirmResponse.json();
                if (confirmResult.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Éxito',
                        text: confirmResult.message,
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: confirmResult.message,
                        confirmButtonText: 'OK'
                    });
                }
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message,
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error, intentelo nuevamente' + error,
            confirmButtonText: 'OK'
        });
    }
});