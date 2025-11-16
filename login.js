// login.js
function initLoginPage({
    formSelector = '#loginForm',
    usernameSelector = '#username',
    passwordSelector = '#password',
    rememberSelector = '#rememberMe',
    alertSelector = '#formAlert',
    yearSelector = '#year',
    redirectTo = 'Main.html',
    users = [
        { email: 'encarregado@fortes.com', password: '1234', role: 'Encarregado' },
        { email: 'gestor@fortes.com', password: '5678', role: 'Gestor' }
    ]
} = {}) {
    // Atualiza ano no rodapé, se existir
    try {
        const yearEl = document.querySelector(yearSelector);
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (_) {}

    const form = document.querySelector(formSelector);
    if (!form) return;

    const usernameInput = document.querySelector(usernameSelector);
    const passwordInput = document.querySelector(passwordSelector);
    const rememberInput = document.querySelector(rememberSelector);
    const alertBox = document.querySelector(alertSelector);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (alertBox) alertBox.classList.add('d-none');
        form.classList.add('was-validated');

        const username = (usernameInput?.value || '').trim();
        const password = (passwordInput?.value || '').trim();

        if (!username || !password) {
            if (alertBox) { alertBox.textContent = 'Preencha usuário/e-mail e senha para continuar.'; alertBox.classList.remove('d-none'); }
            return;
        }

        // Autenticação simples, email case-insensitive
        const emailNorm = username.toLowerCase();
        const user = users.find(u => (u.email || '').toLowerCase() === emailNorm);
        if (!user || user.password !== password) {
            if (alertBox) { alertBox.textContent = 'Usuário ou senha incorretos.'; alertBox.classList.remove('d-none'); }
            if (!user && usernameInput) usernameInput.focus();
            else if (passwordInput) { passwordInput.focus(); passwordInput.select(); }
            return;
        }

        // Sucesso: persiste dado mínimo e redireciona
        try {
            localStorage.setItem('fe:auth:user', JSON.stringify({ email: user.email, role: user.role, remember: !!(rememberInput && rememberInput.checked) }));
        } catch (_) {}

        window.location.href = redirectTo;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initLoginPage({ redirectTo: 'Main.html' });
});
