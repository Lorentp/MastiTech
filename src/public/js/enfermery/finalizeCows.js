function finalizeCow(cowId) {
    Swal.fire({
        title: '¿Liberar esta vaca?',
        text: "Una vez liberada, volverá al ordeñe normal",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, liberar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/cow/finalize-milk-discard/${cowId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(async r => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo liberar el animal');
                }
                return data;
            })
            .then(() => {
                Swal.fire('¡Liberada!', 'La vaca ya puede ordeñarse normalmente', 'success')
                    .then(() => location.reload());
            })
            .catch((err) => {
                Swal.fire('Error', err.message || 'No se pudo conectar al servidor', 'error');
            });
        }
    });
}
