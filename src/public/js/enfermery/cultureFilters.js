(() => {
    const searchInput = document.getElementById('culture-search');
    const eventsSelect = document.getElementById('culture-events-filter');
    const dateInput = document.getElementById('culture-date-filter');
    if (!searchInput || !eventsSelect || !dateInput) return;

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
        const dateValue = dateInput.value; // YYYY-MM-DD

        cards.forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            const cardEvents = parseInt(card.dataset.events || '0', 10);
            const cardDates = (card.dataset.eventDates || '').split('|').filter(Boolean);
            const nameMatch = !term || name.includes(term);
            const eventsMatch = matchesEvents(eventsValue, cardEvents);
            const dateMatch = !dateValue || cardDates.includes(dateValue);
            card.style.display = nameMatch && eventsMatch && dateMatch ? '' : 'none';
        });
    };

    searchInput.addEventListener('input', filter);
    eventsSelect.addEventListener('change', filter);
    dateInput.addEventListener('change', filter);
    filter();
})();
