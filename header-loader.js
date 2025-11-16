// header-loader.js

/**
 * Carrega o header dinamicamente e configura o botão Sair
 */
async function loadHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    try {
        const response = await fetch('header.html');
        if (!response.ok) throw new Error('Falha ao carregar header');
        
        const html = await response.text();
        container.innerHTML = html;

        // Configura o botão Voltar
        const btnVoltar = document.getElementById('btnVoltar');
        if (btnVoltar) {
            btnVoltar.addEventListener('click', () => {
                window.history.back();
            });
        }

        // Configura o botão de Notificações
        const btnNotificacoes = document.getElementById('btnNotificacoes');
        if (btnNotificacoes) {
            updateNotificationBadge();
            loadNotificationsDropdown();
            
            // Atualiza o dropdown quando abrir
            btnNotificacoes.addEventListener('shown.bs.dropdown', () => {
                loadNotificationsDropdown();
            });
        }

        // Configura o botão Sair
        const btnSair = document.getElementById('btnSair');
        if (btnSair) {
            btnSair.addEventListener('click', () => {
                if (confirm('Deseja sair do sistema?')) {
                    localStorage.removeItem('fe:auth:user');
                    window.location.href = 'index.html';
                }
            });
        }

        // Atualiza o título da página baseado no título do documento
        updatePageTitle();
    } catch (error) {
        console.error('Erro ao carregar header:', error);
        // Fallback: header inline
        container.innerHTML = `
            <header class="d-flex align-items-center justify-content-between p-3 border-bottom">
                <div class="d-flex align-items-center gap-2">
                    <a href="Main.html" class="brand" aria-label="Fortes Engenharia">
                        <img src="2Q.png" alt="Fortes Engenharia" class="header-logo" />
                    </a>
                    <button class="btn btn-outline-secondary btn-sm" type="button" onclick="window.history.back()">Voltar</button>
                </div>
                <h1 class="h4 m-0" id="pageTitle">Portal</h1>
                <div class="header-right d-flex align-items-center gap-2">
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary btn-sm position-relative" type="button" id="btnNotificacoes" data-bs-toggle="dropdown" aria-expanded="false" title="Notificações">
                            <i class="bi bi-bell"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none" id="badgeNotificacoes">0</span>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end shadow" id="notificationsDropdown" style="min-width: 350px; max-height: 400px; overflow-y: auto;">
                            <div class="px-3 py-2 text-center text-muted" id="emptyNotifications">
                                <i class="bi bi-bell-slash"></i>
                                <p class="mb-0 small mt-2">Nenhuma notificação</p>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm" type="button" onclick="if(confirm('Deseja sair do sistema?')){localStorage.removeItem('fe:auth:user');window.location.href='index.html';}">Sair</button>
                </div>
            </header>
            <div class="modal fade" id="messageModal" tabindex="-1" aria-labelledby="messageModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header border-0">
                    <h5 class="modal-title" id="messageModalLabel"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body" id="messageModalBody"></div>
                  <div class="modal-footer" id="messageModalFooter"></div>
                </div>
              </div>
            </div>
        `;
        updatePageTitle();
        const btnNotificacoes = document.getElementById('btnNotificacoes');
        if (btnNotificacoes) {
            updateNotificationBadge();
            loadNotificationsDropdown();
        }
    }
}

/**
 * Atualiza o título no header baseado no título do documento
 */
function updatePageTitle() {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && document.title) {
        pageTitle.textContent = document.title;
    }
}

/**
 * Obtém as notificações do localStorage
 */
function getNotifications() {
    try {
        const notificationsStr = localStorage.getItem('fe:notifications');
        return notificationsStr ? JSON.parse(notificationsStr) : [];
    } catch (e) {
        console.error('Erro ao carregar notificações:', e);
        return [];
    }
}

/**
 * Atualiza o badge de notificações
 */
function updateNotificationBadge() {
    const badge = document.getElementById('badgeNotificacoes');
    if (!badge) return;
    
    const notifications = getNotifications().filter(n => !n.read);
    const count = notifications.length;
    
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

/**
 * Carrega as notificações no dropdown (últimas 3)
 */
function loadNotificationsDropdown() {
    const dropdown = document.getElementById('notificationsDropdown');
    const emptyMessage = document.getElementById('emptyNotifications');
    
    if (!dropdown) return;
    
    const notifications = getNotifications();
    const recentNotifications = notifications.slice(0, 3); // Apenas as últimas 3
    
    if (recentNotifications.length === 0) {
        // Mostra mensagem vazia
        if (emptyMessage) emptyMessage.classList.remove('d-none');
        dropdown.querySelectorAll('.notification-item, .dropdown-divider, .dropdown-item').forEach(el => el.remove());
        return;
    }
    
    // Esconde mensagem vazia
    if (emptyMessage) emptyMessage.classList.add('d-none');
    
    // Limpa notificações antigas
    dropdown.querySelectorAll('.notification-item, .dropdown-divider, .dropdown-item').forEach(el => el.remove());
    
    // Adiciona header
    const header = document.createElement('h6');
    header.className = 'dropdown-header d-flex justify-content-between align-items-center';
    header.innerHTML = `
        <span>Notificações Recentes</span>
        <small class="text-muted">${notifications.length > 3 ? `+${notifications.length - 3} mais` : ''}</small>
    `;
    dropdown.appendChild(header);
    
    // Adiciona cada notificação
    recentNotifications.forEach((notification, index) => {
        const item = document.createElement('div');
        item.className = 'notification-item px-3 py-2 border-bottom';
        item.style.cursor = 'pointer';
        item.style.transition = 'background-color 0.2s';
        
        const icon = notification.type === 'success' ? 'check-circle-fill text-success' : 
                     notification.type === 'warning' ? 'exclamation-triangle-fill text-warning' : 
                     notification.type === 'error' ? 'x-circle-fill text-danger' : 
                     'info-circle-fill text-info';
        
        const readClass = notification.read ? 'opacity-75' : '';
        
        item.innerHTML = `
            <div class="d-flex gap-2 ${readClass}">
                <div><i class="bi bi-${icon}"></i></div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <strong class="d-block small">${notification.title || 'Notificação'}</strong>
                        ${!notification.read ? '<span class="badge bg-primary badge-sm">Nova</span>' : ''}
                    </div>
                    <p class="mb-1 small text-muted">${notification.message}</p>
                    <small class="text-muted">${notification.date || 'Hoje'}</small>
                </div>
            </div>
        `;
        
        // Evento de clique para marcar como lida
        item.addEventListener('click', () => {
            if (!notification.read) {
                markAsRead(index);
                updateNotificationBadge();
                loadNotificationsDropdown();
            }
        });
        
        // Hover effect
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f8f9fa';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = '';
        });
        
        dropdown.appendChild(item);
    });
    
    // Adiciona divisor e link "Ver todas"
    if (notifications.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'dropdown-divider';
        dropdown.appendChild(divider);
        
        const viewAll = document.createElement('a');
        viewAll.className = 'dropdown-item text-center small text-primary';
        viewAll.href = '#';
        viewAll.innerHTML = '<i class="bi bi-eye"></i> Ver todas as notificações';
        viewAll.addEventListener('click', (e) => {
            e.preventDefault();
            showAllNotifications();
        });
        dropdown.appendChild(viewAll);
        
        // Adiciona link "Marcar todas como lidas" se houver não lidas
        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            const markAllRead = document.createElement('a');
            markAllRead.className = 'dropdown-item text-center small';
            markAllRead.href = '#';
            markAllRead.innerHTML = '<i class="bi bi-check-all"></i> Marcar todas como lidas';
            markAllRead.addEventListener('click', (e) => {
                e.preventDefault();
                markAllAsRead();
                updateNotificationBadge();
                loadNotificationsDropdown();
            });
            dropdown.appendChild(markAllRead);
        }
    }
}

/**
 * Mostra o modal com todas as notificações
 */
function showAllNotifications() {
    const notifications = getNotifications();
    
    if (notifications.length === 0) {
        alert('Você não tem notificações no momento.');
        return;
    }
    
    // Fecha o dropdown
    const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('btnNotificacoes'));
    if (dropdown) dropdown.hide();
    
    // Cria o modal de notificações
    let modalHTML = `
        <div class="modal fade" id="notificationsModal" tabindex="-1" aria-labelledby="notificationsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="notificationsModalLabel">
                            <i class="bi bi-bell"></i> Notificações
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
    `;
    
    notifications.forEach((notification, index) => {
        const readClass = notification.read ? 'opacity-75' : 'fw-bold';
        const icon = notification.type === 'success' ? 'check-circle-fill text-success' : 
                     notification.type === 'warning' ? 'exclamation-triangle-fill text-warning' : 
                     notification.type === 'error' ? 'x-circle-fill text-danger' : 
                     'info-circle-fill text-info';
        
        modalHTML += `
            <a href="#" class="list-group-item list-group-item-action ${readClass}" data-index="${index}">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="d-flex gap-2 align-items-start">
                        <i class="bi bi-${icon} mt-1"></i>
                        <div>
                            <h6 class="mb-1">${notification.title || 'Notificação'}</h6>
                            <p class="mb-1 small">${notification.message}</p>
                            <small class="text-muted">${notification.date || 'Hoje'}</small>
                        </div>
                    </div>
                    ${!notification.read ? '<span class="badge bg-primary">Nova</span>' : ''}
                </div>
            </a>
        `;
    });
    
    modalHTML += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-sm btn-outline-secondary" id="btnMarkAllRead">Marcar todas como lidas</button>
                        <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove modal antigo se existir
    const oldModal = document.getElementById('notificationsModal');
    if (oldModal) oldModal.remove();
    
    // Adiciona o novo modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configura eventos
    const modal = document.getElementById('notificationsModal');
    const bsModal = new bootstrap.Modal(modal);
    
    // Marca notificação como lida ao clicar
    modal.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(item.getAttribute('data-index'));
            markAsRead(index);
            item.classList.remove('fw-bold');
            item.classList.add('opacity-75');
            const badge = item.querySelector('.badge');
            if (badge) badge.remove();
            updateNotificationBadge();
        });
    });
    
    // Marcar todas como lidas
    const btnMarkAllRead = modal.querySelector('#btnMarkAllRead');
    if (btnMarkAllRead) {
        btnMarkAllRead.addEventListener('click', () => {
            markAllAsRead();
            modal.querySelectorAll('.list-group-item').forEach(item => {
                item.classList.remove('fw-bold');
                item.classList.add('opacity-75');
                const badge = item.querySelector('.badge');
                if (badge) badge.remove();
            });
            updateNotificationBadge();
        });
    }
    
    // Remove modal ao fechar
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
    
    bsModal.show();
}

/**
 * Marca uma notificação como lida
 */
function markAsRead(index) {
    try {
        const notifications = getNotifications();
        if (notifications[index]) {
            notifications[index].read = true;
            localStorage.setItem('fe:notifications', JSON.stringify(notifications));
        }
    } catch (e) {
        console.error('Erro ao marcar notificação como lida:', e);
    }
}

/**
 * Marca todas as notificações como lidas
 */
function markAllAsRead() {
    try {
        const notifications = getNotifications();
        notifications.forEach(n => n.read = true);
        localStorage.setItem('fe:notifications', JSON.stringify(notifications));
    } catch (e) {
        console.error('Erro ao marcar todas como lidas:', e);
    }
}

// Carrega o header quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadHeader);
