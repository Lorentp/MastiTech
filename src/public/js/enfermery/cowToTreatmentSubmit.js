// Reemplazá todo el archivo por este:
document.getElementById('add-cow-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name').trim(),
        udders: formData.getAll('udders'),
        treatmentId: formData.get('treatmentId'),
        severity: formData.get('severity'),
        startDate: formData.get('startDate'),
        startTurn: formData.get('startTurn'),
    };

    if (data.udders.length === 0) {
        return Swal.fire('Error', 'Debe seleccionar al menos una ubre', 'error');
    }

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
                title: '¡Animal tratado!',
                text: `La vaca ${data.name} fue agregada al tratamiento con éxito.`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => location.reload());
        } 
        else if (result.reMastitisWarning) {
            const { message, previousTreatment } = result.reMastitisWarning;
            const confirm = await Swal.fire({
                icon: 'warning',
                title: '¡RE-MASTITIS DETECTADA!',
                html: `
                    <strong>${data.name}</strong><br>
                    Tratamiento previo: <strong>${previousTreatment || 'N/D'}</strong><br>
                    ${message}
                `,
                showCancelButton: true,
                confirmButtonText: 'Confirmar tratamiento',
                cancelButtonText: 'Cancelar'
            });
            if (confirm.isConfirmed) {
                data.confirmReMastitis = true;
                const res2 = await fetch('/cow/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const res2json = await res2.json();
                if (res2json.success) {
                    Swal.fire('Éxito', 'Animal tratado (re-mastitis confirmada)', 'success')
                        .then(() => location.reload());
                }
            }
        } 
        else {
            Swal.fire('Error', result.message || 'No se pudo agregar el animal', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Error de conexión. Intente nuevamente.', 'error');
    }
});
