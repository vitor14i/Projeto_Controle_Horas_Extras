// sidebar-loader.js - Carrega o sidebar dinamicamente em todas as páginas

/**
 * Carrega o conteúdo do sidebar.html e injeta no elemento com id="sidebar-container"
 */
export async function loadSidebar() {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  try {
    const response = await fetch('sidebar.html');
    if (!response.ok) throw new Error('Falha ao carregar sidebar');
    const html = await response.text();
    container.innerHTML = html;
    
    // Filtra o menu baseado no role do usuário
    filterMenuByRole();
    
    // Marca o link ativo baseado na página atual
    highlightActivePage();
    
    // Adiciona handler para o link de Relatórios
    attachRelatoriosHandler();
  } catch (error) {
    console.error('Erro ao carregar sidebar:', error);
    // Fallback: renderiza sidebar inline se o fetch falhar
    container.innerHTML = `
      <aside class="menu-lateral">
        <h3>Horas Extras</h3>
        <nav>
          <a href="Main.html">🏠 Início</a>
          <a href="requisicoes.html">📂 Requisições</a>
          <a href="Solicitacao_horas.html">➕ Nova Solicitação</a>
          <a href="#">📊 Relatórios</a>
          <a href="perfil.html">👤 Perfil</a>
        </nav>
      </aside>
    `;
    filterMenuByRole();
    highlightActivePage();
    attachRelatoriosHandler();
  }
}

/**
 * Filtra as opções do menu baseado no role do usuário logado
 */
function filterMenuByRole() {
  try {
    const userDataStr = localStorage.getItem('fe:auth:user');
    if (!userDataStr) return;
    
    const userData = JSON.parse(userDataStr);
    const role = userData.role;
    
    const links = document.querySelectorAll('.menu-lateral nav a');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      // Se for Gestor, remove "Nova Solicitação"
      if (role === 'Gestor' && href === 'Solicitacao_horas.html') {
        link.remove();
      }
      
      // Se for Encarregado, remove "Requisições"
      if (role === 'Encarregado' && href === 'requisicoes.html') {
        link.remove();
      }
    });
  } catch (e) {
    console.error('Erro ao filtrar menu por role:', e);
  }
}

/**
 * Destaca o link ativo no sidebar baseado na URL atual
 */
function highlightActivePage() {
  const currentPage = window.location.pathname.split('/').pop() || 'Main.html';
  const links = document.querySelectorAll('.menu-lateral nav a');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'Main.html')) {
      link.classList.add('active');
      link.style.fontWeight = 'bold';
      link.style.color = '#0d6efd';
    }
  });
}

/**
 * Adiciona handler para o link de Relatórios
 */
function attachRelatoriosHandler() {
  const links = document.querySelectorAll('.menu-lateral nav a');
  
  links.forEach(link => {
    const text = link.textContent.trim();
    if (text.includes('Relatórios')) {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Importa showModal dinamicamente se necessário
        const { showModal } = await import('./botoes.js');
        
        await showModal({
          title: 'Recurso em desenvolvimento',
          bodyHtml: '<p>Banco de dados ainda não integrado. Função de Relatórios será liberada em uma futura versão.</p>',
          type: 'info',
          buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }]
        });
      });
    }
  });
}

// Auto-executa ao carregar o DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
  loadSidebar();
}
