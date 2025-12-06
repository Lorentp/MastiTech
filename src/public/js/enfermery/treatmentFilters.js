(() => {
    const searchInput = document.getElementById('treatment-search');
    const eventsSelect = document.getElementById('treatment-events-filter');
    const treatmentSelect = document.getElementById('treatment-name-filter');
    if (!searchInput || !eventsSelect || !treatmentSelect) return;

    const cards = Array.from(document.querySelectorAll('.treatment-card'));

    // Populate treatment select with unique treatment names found on cards
    const treatments = new Set();
    cards.forEach(card => {
        const treatmentName = card.dataset.treatment;
        if (treatmentName) treatments.add(treatmentName);
    });
    treatments.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        treatmentSelect.appendChild(opt);
    });

    const matchesEvents = (eventsValue, cardEvents) => {
        if (eventsValue === 'any') return true;
        if (eventsValue === '10plus') return cardEvents >= 10;
        const desired = parseInt(eventsValue, 10);
        return Number.isFinite(desired) && cardEvents === desired;
    };

    const matchesTreatment = (treatmentValue, cardTreatment) => {
        if (treatmentValue === 'any') return true;
        return (cardTreatment || '') === treatmentValue;
    };

    const filter = () => {
        const term = searchInput.value.trim().toLowerCase();
        const eventsValue = eventsSelect.value;
        const treatmentValue = treatmentSelect.value;

        cards.forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            const cardEvents = parseInt(card.dataset.events || '0', 10);
            const cardTreatment = card.dataset.treatment || '';
            const nameMatch = !term || name.includes(term);
            const eventsMatch = matchesEvents(eventsValue, cardEvents);
            const treatmentMatch = matchesTreatment(treatmentValue, cardTreatment);
            card.style.display = nameMatch && eventsMatch && treatmentMatch ? '' : 'none';
        });
    };

    searchInput.addEventListener('input', filter);
    eventsSelect.addEventListener('change', filter);
    treatmentSelect.addEventListener('change', filter);
    filter();
})();
