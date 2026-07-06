const loginForm = document.getElementById('loginForm');

loginForm?.addEventListener('submit', event => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const result = KhaironAuth.authenticate(username, password);

    if (!result.ok) {
        showLoginMessage(result.message, 'danger');
        return;
    }

    const destination = KhaironAuth.getFirstAllowedPage(result.user);
    if (!destination) {
        KhaironAuth.logout(false);
        showLoginMessage('El usuario no tiene modulos asignados', 'warning');
        return;
    }

    window.location.href = `modules/${destination}`;
});

function showLoginMessage(message, type) {
    const box = document.getElementById('loginMessage');
    if (!box) return;
    box.className = `login-message ${type}`;
    box.textContent = message;
    box.hidden = false;
}
