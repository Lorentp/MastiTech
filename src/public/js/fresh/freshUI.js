(() => {
  const addCowButton = document.getElementById("addFreshCowButton");
  const addEventButton = document.getElementById("addFreshEventButton");
  const addFlujeoButton = document.getElementById("addFlujeoTypeButton");

  const addCowForm = document.getElementById("addFreshCowForm");
  const addEventForm = document.getElementById("addFreshEventForm");
  const addFlujeoForm = document.getElementById("addFlujeoTypeForm");

  const toggle = (el) => {
    if (!el) return;
    el.classList.toggle("hidden");
  };

  addCowButton?.addEventListener("click", () => toggle(addCowForm));
  addEventButton?.addEventListener("click", () => toggle(addEventForm));
  addFlujeoButton?.addEventListener("click", () => toggle(addFlujeoForm));
})();

