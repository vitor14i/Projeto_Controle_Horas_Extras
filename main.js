// main.js - Script para a página Main.html

// Exibe o role do usuário logado
document.addEventListener('DOMContentLoaded', () => {
  const userDataStr = localStorage.getItem('fe:auth:user');
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      const roleElement = document.getElementById('userRole');
      if (roleElement && userData.role) {
        roleElement.textContent = `Você está logado como: ${userData.role}`;
      }
    } catch (e) {
      console.error('Erro ao carregar dados do usuário:', e);
    }
  }
});
