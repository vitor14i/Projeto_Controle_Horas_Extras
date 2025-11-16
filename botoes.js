// botoes.js

/**
 * Classe para gerenciar a criação dinâmica de selects de funcionários,
 * garantindo que não haja duplicatas e coletando os dados do formulário.
 */
class SelectFuncionarios {
    /**
     * Construtor da classe.
     * @param {object} options - Objeto de configuração com seletores CSS.
     */
    constructor({ dataSourceSelector = '#dataSource', containerSelector = '#selectsContainer', addButtonSelector = '#btnAdd', addPlaceholderSelector = '.add-placeholder', selectionsInputSelector = '#selectionsInput', obraSelector = '#obraSelect', hoursSelector = '#hoursInput', dateSelector = '#dateInput', confirm } = {}) {
        this.dataSource = document.querySelector(dataSourceSelector);
        this.container = document.querySelector(containerSelector);
        this.btnAdd = document.querySelector(addButtonSelector);
        this.addPlaceholder = document.querySelector(addPlaceholderSelector);
        this.selectionsInput = document.querySelector(selectionsInputSelector);
        this.obraEl = document.querySelector(obraSelector);
        this.hoursEl = document.querySelector(hoursSelector);
        this.dateEl = document.querySelector(dateSelector);

        if (!this.dataSource || !this.container) throw new Error('dataSource or container not found');

        // Carrega as opções de funcionários do <select> de dados mestre
        this.masterOptions = Array.from(this.dataSource.options).filter(o => o.value !== '').map(o => ({ value: o.value, text: o.text }));
        this.masterCount = this.masterOptions.length;
        this.selectCounter = 0; // Contador para IDs únicos de select

        if (this.btnAdd) this.btnAdd.addEventListener('click', () => this.handleAddClick());
        // Define uma função de confirmação padrão (window.confirm) se nenhuma for passada
        this.confirm = confirm || (msg => Promise.resolve(window.confirm(msg)));

        this.createSelectRow(); // Cria a primeira linha de select
        // updateAddButtonState() é chamado dentro de createSelectRow()
    }

    /** Retorna um array com todos os elementos <select> de funcionário. */
    getAllSelects() { return Array.from(this.container.querySelectorAll('select')); }

    /** Retorna um Set com todos os valores (IDs) de funcionários já selecionados.
     * @param {HTMLElement[]} [selects] - (Otimização) Lista opcional de selects já consultada.
     */
    getSelectedValues(selects) {
        const allSelects = selects || this.getAllSelects();
        return new Set(allSelects.map(s => s.value).filter(Boolean));
    }

    /** Manipulador de clique para o botão "Adicionar funcionário". */
    handleAddClick() {
        // Passa os selects consultados para as funções filhas
        const selects = this.getAllSelects();
        if (!this.canAddMoreSelects(selects)) {
            this.updateAddButtonState(selects); // Atualiza o estado (desabilitado)
            return;
        }
        this.createSelectRow(); // Esta função já atualiza os estados
    }

    /** Verifica se é possível adicionar mais selects (se há funcionários disponíveis).
     * @param {HTMLElement[]} [selects] - (Otimização) Lista opcional de selects já consultada.
     */
    canAddMoreSelects(selects) {
        const allSelects = selects || this.getAllSelects();
        return allSelects.length < this.masterCount;
    }

    /** Retorna a lista de funcionários que ainda não foram selecionados. */
    getAvailableOptions() {
        const selected = this.getSelectedValues(); // Precisa dos valores atuais
        return this.masterOptions.filter(o => !selected.has(o.value));
    }

    /** Atualiza as opções de todos os selects para refletir a seleção atual. */
    refreshAllSelects() {
        const selects = this.getAllSelects(); // Consulta o DOM 1 vez
        const selected = this.getSelectedValues(selects); // Usa a lista consultada

        selects.forEach(sel => {
            const cur = sel.value; // Salva o valor atual do select
            // Reconstrói as opções
            sel.innerHTML = '';
            const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Selecione um funcionário'; sel.appendChild(ph);
            this.masterOptions.forEach(opt => {
                // Adiciona a opção se for a selecionada atualmente OU se não estiver em uso por outro select
                if (opt.value === cur || !selected.has(opt.value)) {
                    const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.text; sel.appendChild(o);
                }
            });
            // Restaura o valor, se ainda for válido
            sel.value = cur && Array.from(sel.options).some(o => o.value === cur) ? cur : '';
        });
        this.updateSelectionsPayload(selects); // Passa a lista consultada
        this.updateAddButtonState(selects); // Passa a lista consultada
    }

    /** Cria uma nova linha de select (com select, label flutuante e botão de deletar). */
    createSelectRow(pre = '') {
        const row = document.createElement('div'); row.className = 'select-row';
        const floatWrap = document.createElement('div'); floatWrap.className = 'form-floating';
        const select = document.createElement('select'); select.className = 'form-select select-control'; select.id = 'select_' + (++this.selectCounter);
        select.required = true;
        const label = document.createElement('label'); label.setAttribute('for', select.id); label.className = 'form-label'; label.textContent = 'Funcionário';
        const del = document.createElement('button'); del.type = 'button'; del.className = 'del-button btn btn-danger'; del.setAttribute('aria-label', 'Excluir select'); del.title = 'Excluir'; del.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i>';

        // Popula o novo select com as opções disponíveis
        const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Selecione um funcionário'; select.appendChild(ph);
        const available = this.getAvailableOptions();
        available.forEach(opt => {
            const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.text; select.appendChild(o);
        });
        if (pre) select.value = pre; // Define valor pré-selecionado, se houver

        select.addEventListener('change', () => this.refreshAllSelects());

        del.addEventListener('click', async () => {
            // Pede confirmação antes de excluir se um funcionário estiver selecionado
            if (select.value) {
                const ok = await this.confirm('Tem certeza que deseja excluir este funcionário?');
                if (!ok) return;
            }
            row.remove();
            this.refreshAllSelects(); // Atualiza os outros selects
        });

        floatWrap.appendChild(select); floatWrap.appendChild(label);
        row.appendChild(floatWrap); row.appendChild(del);
        if (this.addPlaceholder) this.container.insertBefore(row, this.addPlaceholder); else this.container.appendChild(row);

        // Atualiza o estado após adicionar a nova linha
        const selects = this.getAllSelects();
        this.updateSelectionsPayload(selects);
        this.updateAddButtonState(selects);
    }

    /** Atualiza o input hidden com um JSON dos funcionários selecionados.
     * @param {HTMLElement[]} [selects] - (Otimização) Lista opcional de selects já consultada.
     */
    updateSelectionsPayload(selects) {
        const allSelects = selects || this.getAllSelects();
        const data = allSelects.map(s => ({ value: s.value, text: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '' })).filter(x => x.value);
        if (this.selectionsInput) this.selectionsInput.value = JSON.stringify(data);
    }

    /** Habilita/desabilita o botão de adicionar com base nos funcionários disponíveis.
     * @param {HTMLElement[]} [selects] - (Otimização) Lista opcional de selects já consultada.
     */
    updateAddButtonState(selects) {
        if (!this.btnAdd) return;
        const allSelects = selects || this.getAllSelects();
        const canAdd = allSelects.length < this.masterCount;
        this.btnAdd.disabled = !canAdd;
        this.btnAdd.title = !canAdd ? 'Não é possível adicionar mais — todos os funcionários já foram adicionados.' : '';
    }

    /** Retorna um array de objetos {value, text} dos funcionários selecionados.
     * @param {HTMLElement[]} [selects] - (Otimização) Lista opcional de selects já consultada.
     */
    getSelectedEmployees(selects) {
        const allSelects = selects || this.getAllSelects();
        return allSelects.map(s => ({ value: s.value, text: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '' })).filter(x => x.value);
    }

    /** Coleta todos os dados do formulário (obra, horas, data, funcionários). */
    getFormData() {
        const selects = this.getAllSelects(); // Consulta 1 vez
        const employees = this.getSelectedEmployees(selects); // Passa a lista
        const obraEl = this.obraEl;
        const hoursEl = this.hoursEl;
        const dateEl = this.dateEl;

        const obra = obraEl ? { value: obraEl.value, text: obraEl.options[obraEl.selectedIndex] ? obraEl.options[obraEl.selectedIndex].text : '' } : null;
        // Garante que as horas sejam um número >= 0
        const hours = hoursEl ? Math.max(0, parseFloat(hoursEl.value || '0')) : undefined;
        const date = dateEl ? (dateEl.value || null) : undefined;

        return { obra, hours, date, employees };
    }

    /** Valida os campos do formulário e retorna um objeto {valid: boolean, errors: string[]}. */
    isValidForm() {
        const errors = [];
        const form = this.getFormData(); // getFormData() já está otimizado
        if (document.querySelector('#obraSelect') && (!form.obra || !form.obra.value)) errors.push('Selecione a obra.');
        
        // Validação da data
        if (document.querySelector('#dateInput')) {
            if (!form.date) {
                errors.push('Informe a data.');
            } else if (typeof isDateAllowed === 'function' && !isDateAllowed(form.date)) {
                errors.push('A data informada deve ser com pelo menos 03 dias de antecedência.');
            }
        }
        // Validação das horas
        if (document.querySelector('#hoursInput')) {
            if (typeof form.hours === 'undefined' || form.hours <= 0) errors.push('Informe a quantidade de horas (maior que 0).');
        }
        // Validação dos funcionários
        if (!form.employees || form.employees.length === 0) errors.push('Adicione ao menos um funcionário.');
        
        // Validação da justificativa
        const notesEl = document.querySelector('#notes');
        if (notesEl && (!notesEl.value || !notesEl.value.trim())) errors.push('Preencha a justificativa.');
        
        return { valid: errors.length === 0, errors };
    }

    /** Reseta o componente, removendo todos os selects e criando um novo. */
    reset() {
        // remove all .select-row children
        const rows = Array.from(this.container.querySelectorAll('.select-row'));
        rows.forEach(r => r.remove());
        // recria a primeira linha
        this.selectCounter = 0;
        this.createSelectRow(); // Esta função já atualiza os estados
    }
}

export default SelectFuncionarios;

/**
 * Função auxiliar reutilizável para exibir um modal de mensagem (usando #messageModal).
 * @param {object} options - Configurações do modal (title, bodyHtml, type, buttons).
 * @returns {Promise<string|null>} Retorna o ID do botão clicado ou null se for fechado.
 */
export async function showModal({ title = '', bodyHtml = '', type = 'info', buttons = [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] } = {}) {
    const modalEl = document.getElementById('messageModal');
    
    // Fallback para alert nativo se o modal ou Bootstrap não estiverem disponíveis
    if (!modalEl || typeof window.bootstrap === 'undefined' || !bootstrap.Modal) {
        if (buttons.length === 2 && buttons.some(b => b.id === 'yes') && buttons.some(b => b.id === 'no')) {
            const ok = window.confirm((title ? title + '\n\n' : '') + bodyHtml.replace(/<[^>]+>/g, '\n'));
            return ok ? 'yes' : 'no';
        }
        window.alert((title ? title + '\n\n' : '') + bodyHtml.replace(/<[^>]+>/g, '\n'));
        return buttons[0] ? buttons[0].id : null;
    }

    const titleEl = modalEl.querySelector('#messageModalLabel');
    const bodyEl = modalEl.querySelector('#messageModalBody');
    const footerEl = modalEl.querySelector('#messageModalFooter');

    titleEl.innerHTML = '';
    bodyEl.innerHTML = '';
    footerEl.innerHTML = '';

    // Define o ícone com base no tipo de mensagem
    let icon = '';
    if (type === 'warning') icon = '<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>';
    if (type === 'danger') icon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
    if (type === 'success') icon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
    if (type === 'info') icon = '<i class="bi bi-info-circle-fill text-info me-2"></i>';

    titleEl.innerHTML = icon + title;
    bodyEl.innerHTML = bodyHtml;

    // Alinha o rodapé: centralizado se houver 1 botão, à direita se houver mais
    footerEl.className = 'modal-footer ' + (buttons.length === 1 ? 'd-flex justify-content-center' : 'd-flex justify-content-end');

    return await new Promise((resolve) => {
        // Cria os botões dinamicamente
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn ' + (btn.className || 'btn-primary');
            b.textContent = btn.label || btn.id || 'OK';
            if (btn.dismiss) b.setAttribute('data-bs-dismiss', 'modal');
            b.addEventListener('click', () => {
                resolve(btn.id); // Resolve a Promise com o ID do botão clicado
            });
            footerEl.appendChild(b);
        });

        const bsModal = new bootstrap.Modal(modalEl, { keyboard: true });
        // Resolve como 'null' se o modal for fechado (ex: pelo 'X' ou clique fora)
        const onHidden = () => { resolve(null); modalEl.removeEventListener('hidden.bs.modal', onHidden); };
        modalEl.addEventListener('hidden.bs.modal', onHidden);
        bsModal.show();
    });
}

/** Calcula a diferença de dias entre a data fornecida (string 'YYYY-MM-DD') e hoje. */
export function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return Infinity;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // Mês é base 0
    const d = parseInt(parts[2], 10);
    const selected = new Date(y, m, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Hoje, sem horas
    const diffMs = selected - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Retorna dias
}

/** Verifica se a data é permitida (pelo menos 3 dias de antecedência). */
export function isDateAllowed(dateStr) {
    const days = daysUntil(dateStr);
    return days >= 3;
}

/** Exibe um modal de aviso específico para datas inválidas. */
export async function showDateWarning(dateEl) {
    const selector = typeof dateEl === 'string' ? document.querySelector(dateEl) : dateEl;
    try {
        await showModal({
            title: 'Agendamento não permitido',
            bodyHtml: '<p class="mb-0">Solicitações de hora extra devem ser feitas com no mínimo 03 dias de antecedência. Por favor, revise a data escolhida e tente novamente.</p>',
            type: 'warning',
            buttons: [ { id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true } ]
        });
    } finally {
        // Limpa e foca o campo de data após fechar o modal
        try { if (selector) { selector.value = ''; selector.focus(); } } catch (e) {}
    }
}

/** Simula uma requisição POST (fetch) com sucesso ou erro aleatório. */
export function simulatePost(url, payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (Math.random() < 0.92) { // 92% de chance de sucesso
                resolve({ ok: true, status: 201, json: async () => ({ id: Math.floor(Math.random() * 90000) + 1000, message: 'Criado' }) });
            } else { // 8% de chance de erro
                resolve({ ok: false, status: 500, json: async () => ({ error: 'Erro interno do servidor (simulado)' }) });
            }
        }, 900 + Math.random() * 600); // Simula atraso de rede
    });
}

/** Adiciona os manipuladores de clique para os botões de incrementar/decrementar horas. */
export function attachHoursStepper(hoursSelector, incSelector, decSelector) {
    const inc = document.querySelector(incSelector);
    const dec = document.querySelector(decSelector);
    const el = document.querySelector(hoursSelector);
    if (!el) return;
    // Usa stepUp/stepDown nativo, com fallback para inputs que não o suportam
    if (inc) inc.addEventListener('click', () => { try { el.stepUp(); } catch (err) { el.value = (parseFloat(el.value || '0') + parseFloat(el.step || '1')).toString(); } });
    if (dec) dec.addEventListener('click', () => { try { el.stepDown(); } catch (err) { el.value = (Math.max(0, parseFloat(el.value || '0') - parseFloat(el.step || '1'))).toString(); } });
}

/**
 * Função principal de inicialização do formulário de solicitação.
 * Instancia o SelectFuncionarios e anexa todos os manipuladores de evento da página.
 */
export function initSolicitacaoForm({
    dataSourceSelector = '#dataSource',
    containerSelector = '#selectsContainer',
    addButtonSelector = '#btnAdd',
    addPlaceholderSelector = '.add-placeholder',
    selectionsInputSelector = '#selectionsInput',
    obraSelector = '#obraSelect',
    hoursSelector = '#hoursInput',
    dateSelector = '#dateInput',
    notesSelector = '#notes',
    submitFormSelector = '#submitForm',
    btnHoursInc = '#btnHoursInc',
    btnHoursDec = '#btnHoursDec'
} = {}) {
    // Instancia o gerenciador de selects
    const manager = new SelectFuncionarios({
        dataSourceSelector,
        containerSelector,
        addButtonSelector,
        addPlaceholderSelector,
        selectionsInputSelector,
        obraSelector,
        hoursSelector,
        dateSelector,
        // Sobrescreve a confirmação padrão (window.confirm) para usar o showModal
        confirm: (msg) => showModal({ title: 'Confirmação', bodyHtml: `<p>${msg}</p>`, type: 'warning', buttons: [ { id: 'no', label: 'Não', className: 'btn-secondary', dismiss: true }, { id: 'yes', label: 'Sim', className: 'btn-danger', dismiss: true } ] }).then(r => r === 'yes')
    });

    // Cacheia os elementos principais do formulário
    const dateEl = document.querySelector(dateSelector);
    const submitForm = document.querySelector(submitFormSelector);
    const notesEl = document.querySelector(notesSelector);

    // Obtém a instância do modal de confirmação (#confirmationModal)
    const confirmationModalElement = document.getElementById('confirmationModal');
    const confirmationModalInstance = confirmationModalElement ? new bootstrap.Modal(confirmationModalElement) : null;

    // Anexa o stepper de horas
    attachHoursStepper(hoursSelector, btnHoursInc, btnHoursDec);

    // Adiciona validador de data ao sair do campo
    if (dateEl) {
        dateEl.addEventListener('change', (ev) => {
            const val = ev.target.value;
            if (val && !isDateAllowed(val)) showDateWarning(dateEl);
        });
    }

    // Manipulador de submissão do formulário (botão "Confirmar" do modal)
    if (submitForm) {
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão do HTML
            
            // Revalida a data no momento do envio
            const selectedDate = dateEl ? dateEl.value : '';
            if (selectedDate && !isDateAllowed(selectedDate)) { showDateWarning(dateEl); return; }

            // Valida o formulário
            const validation = manager.isValidForm();
            if (!validation.valid) {
                // Se inválido, mostra os erros
                await showModal({ title: 'Corrija os seguintes erros', bodyHtml: '<div>' + validation.errors.map(er => `<div>• ${er}</div>`).join('') + '</div>', type: 'warning', buttons: [{ id: 'ok', label: 'Voltar', className: 'btn-primary', dismiss: true }] });
                return;
            }

            // Coleta os dados
            const data = manager.getFormData();
            data.notes = notesEl ? notesEl.value.trim() : '';

            // Controla o estado do botão de submissão (mostra spinner)
            const btnSubmit = submitForm.querySelector('#btnSubmit');
            const btnSpinner = submitForm.querySelector('#btnSpinner');
            const btnText = submitForm.querySelector('#btnText');
            if (btnSubmit) btnSubmit.disabled = true;
            if (btnSpinner) btnSpinner.classList.remove('d-none');
            if (btnText) btnText.textContent = 'Enviando...';

            try {
                // Simula o envio dos dados
                const response = await simulatePost('/api/solicitacoes', data);

                // Fecha o modal de confirmação ANTES de mostrar o de sucesso/erro
                if (confirmationModalInstance) {
                    confirmationModalInstance.hide();
                }

                if (response && response.ok) {
                    // Sucesso
                    const body = await response.json();
                    await showModal({ title: 'Solicitação enviada', bodyHtml: `<p>Sua solicitação de horas extras foi registrada e encaminhada ao gestor para análise e aprovação. Você receberá uma notificação assim que houver uma atualização. <br>ID: <strong>${body.id}</strong></p>`, type: 'success', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
                    // Reseta o formulário e os selects
                    try { submitForm.reset(); manager.reset && typeof manager.reset === 'function' && manager.reset(); } catch (err) {}
                } else {
                    // Erro simulado (ex: 500)
                    const errBody = response && response.json ? await response.json() : { error: 'Resposta inválida' };
                    await showModal({ title: 'Falha ao enviar', bodyHtml: `<p>${(errBody.error || JSON.stringify(errBody))}</p>`, type: 'danger', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
                }
            } catch (err) {
                // Erro de rede (fetch falhou)
                if (confirmationModalInstance) {
                    confirmationModalInstance.hide();
                }
                await showModal({ title: 'Erro de rede', bodyHtml: `<p>${(err && err.message ? err.message : String(err))}</p>`, type: 'danger', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
            } finally {
                // Reseta o botão de submissão (sempre, em sucesso ou falha)
                if (btnSubmit) btnSubmit.disabled = false;
                if (btnSpinner) btnSpinner.classList.add('d-none');
                if (btnText) btnText.textContent = 'Confirmar'; // Texto original do botão #btnSubmit
            }
        });
    }

    // Manipulador do botão "Cancelar" (o que fica fora do modal)
    const btnCancel = document.querySelector('#btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', async (ev) => {
            ev.preventDefault();
            // Pede confirmação
            const res = await showModal({ title: 'Confirmação', bodyHtml: '<p>Tem certeza que deseja cancelar!?</p>', type: 'warning', buttons: [ { id: 'no', label: 'Não', className: 'btn-secondary', dismiss: true }, { id: 'yes', label: 'Sim', className: 'btn-danger', dismiss: true } ] });
            if (res !== 'yes') return;
            
            // Reseta o formulário e o gerenciador de selects
            try { submitForm.reset(); } catch (e) {}
            try { manager.reset && typeof manager.reset === 'function' && manager.reset(); } catch (e) {}
            await showModal({ title: 'Entrada apagada', bodyHtml: '<p>Entradas apagadas.</p>', type: 'info', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
        });
    }

    return manager;
}

/**
 * Inicializa a validação e ações da página de requisição pendente
 */
export function initRequisicaoPendente({
    btnAprovarSelector = '#btnAprovar',
    btnNegarSelector = '#btnNegar',
    comentarioSelector = '#comentarioGestor',
    comentarioErrorSelector = '#comentarioError',
    redirectAprovadoUrl = 'requisicao-aprovada.html',
    redirectListaUrl = 'requisicoes.html'
} = {}) {
    const btnAprovar = document.querySelector(btnAprovarSelector);
    const btnNegar = document.querySelector(btnNegarSelector);
    const comentario = document.querySelector(comentarioSelector);
    const comentarioError = document.querySelector(comentarioErrorSelector);

    if (!comentario) return;

    // Validação de comentário usando o mesmo estilo/modal do fluxo de "Negar"
    const validarComentario = async () => {
        const comentarioTexto = comentario.value.trim();
        if (!comentarioTexto) {
            // Oculta feedback inline e usa modal padronizado
            if (comentarioError) comentarioError.classList.add('d-none');
            comentario.classList.add('border-danger');
            await showModal({
                title: 'Atenção',
                bodyHtml: '<p>O comentário é obrigatório.</p>',
                type: 'warning',
                buttons: [ { id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true } ]
            });
            comentario.focus();
            return false;
        }
        // Limpa estado de erro
        if (comentarioError) comentarioError.classList.add('d-none');
        comentario.classList.remove('border-danger');
        return true;
    };

    // Botão Aprovar
    if (btnAprovar) {
        btnAprovar.addEventListener('click', async () => {
            if (await validarComentario()) {
                window.location.href = redirectAprovadoUrl;
            }
        });
    }

    // Botão Negar
    if (btnNegar) {
        btnNegar.addEventListener('click', async () => {
            if (!(await validarComentario())) return;

            // Confirmação no mesmo estilo do cancelar em Solicitação
            const res = await showModal({
                title: 'Confirmação',
                bodyHtml: '<p>Tem certeza que deseja negar!?</p>',
                type: 'warning',
                buttons: [
                    { id: 'no', label: 'Não', className: 'btn-secondary', dismiss: true },
                    { id: 'yes', label: 'Sim', className: 'btn-danger', dismiss: true }
                ]
            });
            if (res !== 'yes') return;

            // Feedback visual antes do redirecionamento
            await showModal({
                title: 'Requisição negada',
                bodyHtml: '<p>Requisição negada com sucesso.</p>',
                type: 'info',
                buttons: [ { id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true } ]
            });
            window.location.href = redirectListaUrl;
        });
    }

    // Remove erro ao digitar
    comentario.addEventListener('input', () => {
        if (comentario.value.trim()) {
            if (comentarioError) comentarioError.classList.add('d-none');
            comentario.classList.remove('border-danger');
        }
    });
}