let medicationCount = 1;
document.getElementById('add-medication').addEventListener('click', () => {
     const container = document.getElementById('medications-container');
    const newEntry = document.createElement('div');
    newEntry.className = 'medication-entry';
    newEntry.innerHTML = `
        <label>Medicación ${medicationCount + 1}:</label>
        <input type="text" name="medications[${medicationCount}][name]" required>
        <label>Aplicar cada (turnos):</label>
        <select name="medications[${medicationCount}][applyEveryTurns]" required>
            <option value="">Seleccione...</option>
            <option value="1">1 (cada 12 horas)</option>
            <option value="2">2 (cada 24 horas)</option>
            <option value="3">3 (cada 36 horas)</option>
            <option value="4">4 (cada 48 horas)</option>
        </select>
        <label>Aplicar hasta el turno:</label>
        <select name="medications[${medicationCount}][applyUntilTurn]" required>
            <option value="">Seleccione...</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
        </select>
        <button type="button" class="remove-medication">Eliminar</button>
    `;
    container.appendChild(newEntry);
    medicationCount++;
});

document.getElementById('medications-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-medication') && medicationCount > 1) {
        e.target.parentElement.remove();
        medicationCount--;
        const entries = document.querySelectorAll('.medication-entry');
        entries.forEach((entry, index) => {
            entry.querySelector('label').textContent = `Medicación ${index + 1}:`;
            entry.querySelector('input').name = `medications[${index}][name]`;
            entry.querySelectorAll('select')[0].name = `medications[${index}][applyEveryTurns]`;
            entry.querySelectorAll('select')[1].name = `medications[${index}][applyUntilTurn]`;
        });
    }
});

document.getElementById('add-treatment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = { medications: [] };
    formData.forEach((value, key) => {
        if (key.startsWith('medications')) {
            const match = key.match(/medications\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const index = match[1];
                const field = match[2];
                if (!data.medications[index]) data.medications[index] = {};
                data.medications[index][field] = value;
            }
        } else {
            data[key] = value;
        }
    });

    // Validate applyUntilTurn <= duration
    const duration = parseInt(data.duration, 10);
    for (const med of data.medications) {
        if (parseInt(med.applyUntilTurn, 10) > duration) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `El turno final de ${med.name} no puede exceder la duración del tratamiento`,
                confirmButtonText: 'OK'
            });
            return;
        }
    }

    try {
        const response = await fetch('/treatment/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Tratamiento creado con éxito',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.reload();
            });
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
            text: 'Error, intentelo nuevamente',
            confirmButtonText: 'OK'
        });
        console.log(error);
        }
    });

// Update applyUntilTurn options based on duration
document.getElementById('duration').addEventListener('change', () => {
    const duration = parseInt(document.getElementById('duration').value, 10);
    const applyUntilSelects = document.querySelectorAll('select[name$="[applyUntilTurn]"]');
    applyUntilSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccione...</option>';
        for (let i = 1; i <= duration; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i;
            if (i === parseInt(currentValue, 10)) option.selected = true;
            select.appendChild(option);
        }
    });
});