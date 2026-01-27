(() => {
  const searchInput = document.getElementById("fresh-search");
  const dateInput = document.getElementById("fresh-calving-filter");
  if (!searchInput || !dateInput) return;

  const cards = Array.from(document.querySelectorAll(".fresh-card"));

  const filter = () => {
    const term = searchInput.value.trim().toLowerCase();
    const date = dateInput.value;

    cards.forEach((card) => {
      const name = (card.dataset.name || "").toLowerCase();
      const calving = card.dataset.calving || "";
      const matchName = !term || name.includes(term);
      const matchDate = !date || calving === date;
      card.style.display = matchName && matchDate ? "" : "none";
    });
  };

  searchInput.addEventListener("input", filter);
  dateInput.addEventListener("change", filter);
  filter();
})();

