(() => {
  const form = document.getElementById("export-form");
  const periodSelect = document.getElementById("export-period");
  const daysRow = document.getElementById("export-days-row");

  if (!form || !periodSelect || !daysRow) return;

  const toggleDays = () => {
    daysRow.classList.toggle("hidden", periodSelect.value !== "days");
  };

  periodSelect.addEventListener("change", toggleDays);
  toggleDays();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const params = new URLSearchParams();

    params.set("period", formData.get("period"));
    params.set("referenceDate", formData.get("referenceDate"));

    if (formData.get("period") === "days") {
      params.set("days", formData.get("days") || "7");
    }

    window.location.href = `/exports/download?${params.toString()}`;
  });
})();

