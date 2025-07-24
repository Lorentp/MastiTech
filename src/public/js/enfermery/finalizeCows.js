function finalizeCow(cowId) {
    fetch(`/cow/finalize-milk-discard/${cowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const completionDate = new Date(data.cow.milkDiscardCompletionDate).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            Swal.fire({
                icon: 'success',
                title: '¡Se liberó el animal con éxito!',
                text: `Fecha de liberación: ${completionDate}`,
                confirmButtonText: 'OK'
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message,
                confirmButtonText: 'OK'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al procesar la solicitud.',
            confirmButtonText: 'OK'
        });
    });
}