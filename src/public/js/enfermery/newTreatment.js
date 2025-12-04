let medicationCount = 1;

document.getElementById('add-medication')?.addEventListener('click', () => {
    medicationCount++;
    const container = document.getElementById('medications-container');
    const div = document.createElement('div');
    div.className = 'medication-entry';
    div.innerHTML = `
        <label>Medicación ${medicationCount}:</label>
        <input type="text" name="medications[${medicationCount-1}][name]" required>
        <label>Aplicar cada (turnos):</label>
        <select name="medications[${medicationCount-1}][applyEveryTurns]" required>
            <option value="">...</option>
            <option value="1">1 (cada 12 hs)</option>
            <option value="2">2 (cada 24 hs)</option>
            <option value="3">3 (cada 36 hs)</option>
            <option value="4">4 (cada 48 hs)</option>
        </select>
        <label>Hasta turno:</label>
        <select name="medications[${medicationCount-1}][applyUntilTurn]" required></select>
        <button type="button" class="remove-medication">Eliminar</button>
    `;
    container.appendChild(div);
    updateUntilTurnOptions(); // ← actualiza opciones
});

document.getElementById('medications-container')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-medication') && medicationCount > 1) {
        e.target.parentElement.remove();
        medicationCount--;
        renumberMedications();
        updateUntilTurnOptions();
    }
});

function renumberMedications() {
    document.querySelectorAll('.medication-entry').forEach((entry, i) => {
        entry.querySelector('label').textContent = `Medicación ${i + 1}:`;
        entry.querySelector('input').name = `medications[${i}][name]`;
        entry.querySelectorAll('select')[0].name = `medications[${i}][applyEveryTurns]`;
        entry.querySelectorAll('select')[1].name = `medications[${i}][applyUntilTurn]`;
    });
}

function updateUntilTurnOptions() {
    const duration = parseInt(document.getElementById('duration').value) || 10;
    document.querySelectorAll('select[name$="[applyUntilTurn]"]').forEach(select => {
        const current = select.value;
        select.innerHTML = '<option value="">Seleccione...</option>';
        for (let i = 1; i <= duration; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = i;
            if (i == current) opt.selected = true;
            select.appendChild(opt);
        }
    });
}

document.getElementById('duration')?.addEventListener('change', updateUntilTurnOptions);

document.getElementById('add-treatment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = { medications: [] };

    for (const [key, value] of formData.entries()) {
        if (key.startsWith('medications')) {
            const matches = key.match(/medications\[(\d+)\]\[(.+)\]/);
            if (matches) {
                const idx = matches[1];
                const field = matches[2];
                if (!data.medications[idx]) data.medications[idx] = {};
                data.medications[idx][field] = value;
            }
        } else {
            data[key] = value;
        }
    }
    data.medications = data.medications.filter(m => m && m.name);

    // Validación final
    const duration = parseInt(data.duration);
    for (const med of data.medications) {
        if (parseInt(med.applyUntilTurn) > duration) {
            return Swal.fire('Error', `La medicación "${med.name}" no puede aplicarse hasta un turno mayor a la duración del tratamiento`, 'error');
        }
    }

    try {
        const res = await fetch('/treatment/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
            Swal.fire('¡Listo!', 'Tratamiento creado correctamente', 'success')
                .then(() => location.reload());
        } else {
            Swal.fire('Error', json.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'No se pudo guardar el tratamiento', 'error');
    }
});