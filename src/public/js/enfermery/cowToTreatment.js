document.getElementById('treatmentId').addEventListener('change', async (e) => {
    const treatmentId = e.target.value;
    if (treatmentId) {
        const response = await fetch(`/treatment/${treatmentId}`);
        const treatment = await response.json();
        document.getElementById('duration').value = treatment.duration;
        const startDate = document.getElementById('startDate').value;
        const startTurn = document.getElementById('startTurn').value;
        if (startDate && startTurn) {
            const start = new Date(startDate);
            const startHour = startTurn === 'morning' ? 0 : 12;
            start.setHours(startHour, 0, 0, 0);
            const endDate = new Date(start.getTime() + (treatment.duration * 12 * 60 * 60 * 1000));
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
            const endDateDiscardMilk = new Date(start.getTime() + (treatment.milkDiscardTurns * 12 * 60 * 60 * 1000));
            document.getElementById('endDateDiscardMilk').value = endDateDiscardMilk.toISOString().split('T')[0];
        }
    }
});

// Update endDate when startDate or startTurn changes
document.getElementById('startDate').addEventListener('change', updateEndDate);
document.getElementById('startTurn').addEventListener('change', updateEndDate);

function updateEndDate() {
    const treatmentId = document.getElementById('treatmentId').value;
    const startDate = document.getElementById('startDate').value;
    const startTurn = document.getElementById('startTurn').value;
    if (treatmentId && startDate && startTurn) {
        fetch(`/treatment/${treatmentId}`)
            .then(response => response.json())
            .then(treatment => {
                document.getElementById('duration').value = treatment.duration;
                const start = new Date(startDate);
                const startHour = startTurn === 'morning' ? 0 : 12;
                start.setHours(startHour, 0, 0, 0);
                const endDate = new Date(start.getTime() + (treatment.duration * 12 * 60 * 60 * 1000));
                document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
                const endDateDiscardMilk = new Date(start.getTime() + (treatment.milkDiscardTurns * 12 * 60 * 60 * 1000));
                document.getElementById('endDateDiscardMilk').value = endDateDiscardMilk.toISOString().split('T')[0];
            });
    }
}