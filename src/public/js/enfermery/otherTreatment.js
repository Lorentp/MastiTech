function updateOtherEndDate() {
    const treatmentId = document.getElementById('other-treatmentId').value;
    const startDate = document.getElementById('other-startDate').value;
    const startTurn = document.getElementById('other-startTurn').value;
    if (treatmentId && startDate && startTurn) {
        fetch(`/treatment/${treatmentId}`)
            .then(response => response.json())
            .then(treatment => {
                document.getElementById('other-duration').value = treatment.duration;
                const start = new Date(startDate);
                const startHour = startTurn === 'morning' ? 0 : 12;
                start.setHours(startHour, 0, 0, 0);
                const endDate = new Date(start.getTime() + (treatment.duration * 12 * 60 * 60 * 1000));
                document.getElementById('other-endDate').value = endDate.toISOString().split('T')[0];
                const endDateDiscardMilk = new Date(start.getTime() + (treatment.milkDiscardTurns * 12 * 60 * 60 * 1000));
                document.getElementById('other-endDateDiscardMilk').value = endDateDiscardMilk.toISOString().split('T')[0];
            });
    }
}

document.getElementById('other-treatmentId')?.addEventListener('change', updateOtherEndDate);
document.getElementById('other-startDate')?.addEventListener('change', updateOtherEndDate);
document.getElementById('other-startTurn')?.addEventListener('change', updateOtherEndDate);

document.getElementById('add-other-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name').trim(),
        udders: [],
        treatmentId: formData.get('treatmentId'),
        severity: "1",
        startDate: formData.get('startDate'),
        startTurn: formData.get('startTurn'),
        skipEvent: true
    };

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
                title: 'Listo',
                text: `El animal ${data.name} fue agregado al tratamiento.`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => location.reload());
        } else {
            Swal.fire('Error', result.message || 'No se pudo agregar el animal', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Error de conexión. Intente nuevamente.', 'error');
    }
});
