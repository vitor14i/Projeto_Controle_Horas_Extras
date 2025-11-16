import { showModal } from './botoes.js';

// Carrega email atual do localStorage (se existir)
try {
  const auth = JSON.parse(localStorage.getItem('fe:auth:user') || '{}');
  if (auth.email) {
    document.getElementById('currentEmail').value = auth.email;
  }
} catch (_) {}

const form = document.getElementById('profileForm');
const alertBox = document.getElementById('formAlert');

function showAlert(message, type = 'danger') {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type} mt-3`;
  alertBox.classList.remove('d-none');
  setTimeout(() => alertBox.classList.add('d-none'), 5000);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.classList.add('d-none');

  const newEmail = document.getElementById('newEmail').value.trim();
  const confirmEmail = document.getElementById('confirmEmail').value.trim();
  const currentPassword = document.getElementById('currentPassword').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  // Validações básicas
  if (newEmail && newEmail !== confirmEmail) {
    showAlert('Os e-mails informados não coincidem.');
    return;
  }

  if (newPassword && newPassword !== confirmPassword) {
    showAlert('As senhas informadas não coincidem.');
    return;
  }

  if (newPassword && newPassword.length < 6) {
    showAlert('A nova senha deve ter no mínimo 6 caracteres.');
    return;
  }

  if ((newEmail || newPassword) && !currentPassword) {
    showAlert('Informe sua senha atual para confirmar as alterações.');
    return;
  }

  // Simula salvamento
  await showModal({
    title: 'Alterações Salvas',
    bodyHtml: '<p>Suas informações de perfil foram atualizadas com sucesso.</p>',
    type: 'success',
    buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }]
  });

  // Atualiza localStorage se o email foi alterado
  if (newEmail) {
    try {
      const auth = JSON.parse(localStorage.getItem('fe:auth:user') || '{}');
      auth.email = newEmail;
      localStorage.setItem('fe:auth:user', JSON.stringify(auth));
      document.getElementById('currentEmail').value = newEmail;
    } catch (_) {}
  }

  // Limpa campos de alteração
  form.reset();
  try {
    const auth = JSON.parse(localStorage.getItem('fe:auth:user') || '{}');
    if (auth.email) {
      document.getElementById('currentEmail').value = auth.email;
    }
  } catch (_) {}
});

const btnCancel = document.getElementById('btnCancel');
if (btnCancel) {
  btnCancel.addEventListener('click', () => {
    form.reset();
    alertBox.classList.add('d-none');
    try {
      const auth = JSON.parse(localStorage.getItem('fe:auth:user') || '{}');
      if (auth.email) {
        document.getElementById('currentEmail').value = auth.email;
      }
    } catch (_) {}
  });
}
