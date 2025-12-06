(() => {
    const searchInput = document.getElementById('all-cows-search');
    const eventsSelect = document.getElementById('all-cows-events');
    const treatmentSelect = document.getElementById('all-cows-treatment');
    if (!searchInput || !eventsSelect || !treatmentSelect) return;

    const cards = Array.from(document.querySelectorAll('.treatment-card'));

    // Build treatment options from cards
    const treatments = new Set();
    cards.forEach(card => {
        const t = card.dataset.treatment || 'sin-tratamiento';
        treatments.add(t);
    });
    Array.from(treatments).sort().forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name === 'sin-tratamiento' ? 'Sin tratamiento' : name;
        treatmentSelect.appendChild(opt);
    });

    const matchesEvents = (filterValue, cardEvents) => {
        if (filterValue === 'any') return true;
        if (filterValue === '10plus') return cardEvents >= 10;
        const desired = parseInt(filterValue, 10);
        return Number.isFinite(desired) && cardEvents === desired;
    };

    const matchesTreatment = (filterValue, cardTreatment) => {
        if (filterValue === 'any') return true;
        return (cardTreatment || 'sin-tratamiento') === filterValue;
    };

    const filter = () => {
        const term = searchInput.value.trim().toLowerCase();
        const eventsValue = eventsSelect.value;
        const treatmentValue = treatmentSelect.value;

        cards.forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            const cardEvents = parseInt(card.dataset.events || '0', 10);
            const cardTreatment = card.dataset.treatment || 'sin-tratamiento';

            const nameMatch = !term || name.includes(term);
            const eventsMatch = matchesEvents(eventsValue, cardEvents);
            const treatmentMatch = matchesTreatment(treatmentValue, cardTreatment);

            card.style.display = nameMatch && eventsMatch && treatmentMatch ? '' : 'none';
        });
    };

    // Toggle ficha details
    cards.forEach(card => {
        const btn = card.querySelector('.toggle-details');
        const details = card.querySelector('.cow-details');
        if (!btn || !details) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = details.classList.contains('hidden');
            details.classList.toggle('hidden', !isHidden);
            btn.textContent = isHidden ? 'Ocultar ficha' : 'Ver ficha';
        });
        // Also allow click on card body to toggle
        card.addEventListener('click', (e) => {
            if (e.target.closest('.toggle-details')) return;
            const isHidden = details.classList.contains('hidden');
            details.classList.toggle('hidden', !isHidden);
            if (btn) btn.textContent = isHidden ? 'Ocultar ficha' : 'Ver ficha';
        });
    });

    searchInput.addEventListener('input', filter);
    eventsSelect.addEventListener('change', filter);
    treatmentSelect.addEventListener('change', filter);
    filter();
})();
