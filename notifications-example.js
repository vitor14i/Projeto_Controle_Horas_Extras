// notifications-example.js
// Este arquivo pode ser usado para adicionar notificações de exemplo ao sistema

/**
 * Adiciona uma notificação ao localStorage
 * @param {Object} notification - { title, message, type, date, read }
 */
function addNotification(notification) {
    try {
        const notificationsStr = localStorage.getItem('fe:notifications');
        const notifications = notificationsStr ? JSON.parse(notificationsStr) : [];
        
        const newNotification = {
            title: notification.title || 'Notificação',
            message: notification.message || '',
            type: notification.type || 'info', // info, success, warning, error
            date: notification.date || new Date().toLocaleDateString('pt-BR'),
            read: notification.read || false
        };
        
        notifications.unshift(newNotification); // Adiciona no início
        localStorage.setItem('fe:notifications', JSON.stringify(notifications));
        
        console.log('Notificação adicionada:', newNotification);
    } catch (e) {
        console.error('Erro ao adicionar notificação:', e);
    }
}

// Exemplos de uso (execute no console do navegador):

// Adicionar notificação de sucesso
// addNotification({ title: 'Solicitação Aprovada', message: 'Sua solicitação de horas extras #543 foi aprovada pelo gestor.', type: 'success' });

// Adicionar notificação de aviso
// addNotification({ title: 'Prazo próximo', message: 'A data limite para envio de solicitações é em 3 dias.', type: 'warning' });

// Adicionar notificação de erro
// addNotification({ title: 'Solicitação Negada', message: 'Sua solicitação #542 foi negada. Motivo: Falta de justificativa.', type: 'error' });

// Adicionar notificação informativa
// addNotification({ title: 'Nova atualização', message: 'O sistema foi atualizado com novas funcionalidades.', type: 'info' });

// Limpar todas as notificações
// localStorage.removeItem('fe:notifications');
