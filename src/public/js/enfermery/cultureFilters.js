(() => {
    const searchInput = document.getElementById('culture-search');
    const eventsSelect = document.getElementById('culture-events-filter');
    if (!searchInput || !eventsSelect) return;

    const cards = Array.from(document.querySelectorAll('.finished-milk-discard-card'));

    const matchesEvents = (eventsValue, cardEvents) => {
        if (eventsValue === 'any') return true;
        if (eventsValue === '10plus') return cardEvents >= 10;
        const desired = parseInt(eventsValue, 10);
        return Number.isFinite(desired) && cardEvents === desired;
    };

    const filter = () => {
        const term = searchInput.value.trim().toLowerCase();
        const eventsValue = eventsSelect.value;

        cards.forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            const cardEvents = parseInt(card.dataset.events || '0', 10);
            const nameMatch = !term || name.includes(term);
            const eventsMatch = matchesEvents(eventsValue, cardEvents);
            card.style.display = nameMatch && eventsMatch ? '' : 'none';
        });
    };

    searchInput.addEventListener('input', filter);
    eventsSelect.addEventListener('change', filter);
    filter();
})();
