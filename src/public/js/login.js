(() => {
    const checkbox = document.getElementById('showPass');
    const input = document.getElementById('passInput');
    if (!checkbox || !input) return;

    checkbox.addEventListener('change', () => {
        input.type = checkbox.checked ? 'text' : 'password';
    });
})();
