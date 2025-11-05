// botoes.js (renomeado de Select_funcionarios.js)
// Classe SelectFuncionarios: gerencia selects dinâmicos de funcionários e retorna seleção atual

class SelectFuncionarios {
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

        this.masterOptions = Array.from(this.dataSource.options).filter(o => o.value !== '').map(o => ({ value: o.value, text: o.text }));
        this.masterCount = this.masterOptions.length;
        this.selectCounter = 0;

        if (this.btnAdd) this.btnAdd.addEventListener('click', () => this.handleAddClick());
        this.confirm = confirm || (msg => Promise.resolve(window.confirm(msg)));

        this.createSelectRow();
        this.updateAddButtonState();
    }

    getAllSelects() { return Array.from(this.container.querySelectorAll('select')); }
    getSelectedValues() { return new Set(this.getAllSelects().map(s => s.value).filter(Boolean)); }
    handleAddClick() {
        if (!this.canAddMoreSelects()) {
            // disable button handled by updateAddButtonState
            this.updateAddButtonState();
            return;
        }
        this.createSelectRow();
        this.updateAddButtonState();
    }

    canAddMoreSelects() { return this.getAllSelects().length < this.masterCount; }
    getAvailableOptions() {
        const selected = this.getSelectedValues();
        return this.masterOptions.filter(o => !selected.has(o.value));
    }

    // Refresh selects when selection changes
    refreshAllSelects() {
        const selects = this.getAllSelects();
        const selected = this.getSelectedValues();
        selects.forEach(sel => {
            const cur = sel.value;
            // Rebuild options (keeps current value if still valid)
            sel.innerHTML = '';
            const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Selecione um funcionário'; sel.appendChild(ph);
            this.masterOptions.forEach(opt => {
                if (opt.value === cur || !selected.has(opt.value)) {
                    const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.text; sel.appendChild(o);
                }
            });
            sel.value = cur && Array.from(sel.options).some(o => o.value === cur) ? cur : '';
        });
        this.updateSelectionsPayload();
        this.updateAddButtonState();
    }

    createSelectRow(pre = '') {
        const row = document.createElement('div'); row.className = 'select-row';
        const floatWrap = document.createElement('div'); floatWrap.className = 'form-floating';
        const select = document.createElement('select'); select.className = 'form-select select-control'; select.id = 'select_' + (++this.selectCounter);
        select.required = true;
        const label = document.createElement('label'); label.setAttribute('for', select.id); label.className = 'form-label'; label.textContent = 'Funcionário';
        const del = document.createElement('button'); del.type = 'button'; del.className = 'del-button btn btn-danger'; del.setAttribute('aria-label', 'Excluir select'); del.title = 'Excluir'; del.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i>';

        // populate this new select with available options to avoid a costly full rebuild
        const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Selecione um funcionário'; select.appendChild(ph);
        const available = this.getAvailableOptions();
        available.forEach(opt => {
            const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.text; select.appendChild(o);
        });
        if (pre) select.value = pre;

        select.addEventListener('change', () => this.refreshAllSelects());

        del.addEventListener('click', async () => {
            if (select.value) {
                const ok = await this.confirm('Tem certeza que deseja excluir este funcionário?');
                if (!ok) return;
            }
            row.remove();
            this.refreshAllSelects();
        });

        floatWrap.appendChild(select); floatWrap.appendChild(label);
        row.appendChild(floatWrap); row.appendChild(del);
        if (this.addPlaceholder) this.container.insertBefore(row, this.addPlaceholder); else this.container.appendChild(row);
        this.updateSelectionsPayload();
        this.updateAddButtonState();
    }

    updateSelectionsPayload() {
        const data = this.getAllSelects().map(s => ({ value: s.value, text: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '' })).filter(x => x.value);
        if (this.selectionsInput) this.selectionsInput.value = JSON.stringify(data);
    }

    updateAddButtonState() {
        if (!this.btnAdd) return;
        this.btnAdd.disabled = !this.canAddMoreSelects();
        this.btnAdd.title = this.btnAdd.disabled ? 'Não é possível adicionar mais — todos os funcionários já foram adicionados.' : '';
    }

    getSelectedEmployees() {
        return this.getAllSelects().map(s => ({ value: s.value, text: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '' })).filter(x => x.value);
    }

    getFormData() {
        const employees = this.getSelectedEmployees();
        const obraEl = this.obraEl;
        const hoursEl = this.hoursEl;
        const dateEl = this.dateEl;

        const obra = obraEl ? { value: obraEl.value, text: obraEl.options[obraEl.selectedIndex] ? obraEl.options[obraEl.selectedIndex].text : '' } : null;
    // hours may be fractional; ensure a sensible minimum (0)
        const hours = hoursEl ? Math.max(0, parseFloat(hoursEl.value || '0')) : undefined;
        const date = dateEl ? (dateEl.value || null) : undefined;

        return { obra, hours, date, employees };
    }

    isValidForm() {
        const errors = [];
        const form = this.getFormData();
        if (document.querySelector('#obraSelect') && (!form.obra || !form.obra.value)) errors.push('Selecione a obra.');
        // date must be present and allowed (>= 3 days)
        if (document.querySelector('#dateInput')) {
            if (!form.date) {
                errors.push('Informe a data.');
            } else if (typeof isDateAllowed === 'function' && !isDateAllowed(form.date)) {
                errors.push('A data informada deve ser com pelo menos 03 dias de antecedência.');
            }
        }
        // hours must be > 0
        if (document.querySelector('#hoursInput')) {
            if (typeof form.hours === 'undefined' || form.hours <= 0) errors.push('Informe a quantidade de horas (maior que 0).');
        }
        if (!form.employees || form.employees.length === 0) errors.push('Adicione ao menos um funcionário.');
        // justification/notes required
        const notesEl = document.querySelector('#notes');
        if (notesEl && (!notesEl.value || !notesEl.value.trim())) errors.push('Preencha a justificativa.');
        return { valid: errors.length === 0, errors };
    }

    reset() {
        // remove all .select-row children
        const rows = Array.from(this.container.querySelectorAll('.select-row'));
        rows.forEach(r => r.remove());
        // recreate a single select row
        this.selectCounter = 0;
        this.createSelectRow();
        this.updateSelectionsPayload();
        this.updateAddButtonState();
    }
}

export default SelectFuncionarios;

// showModal: helper de modal reutilizável usado pela página para exibir mensagens consistentes
export async function showModal({ title = '', bodyHtml = '', type = 'info', buttons = [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] } = {}) {
    const modalEl = document.getElementById('messageModal');
    // fallback to native alerts if modal or bootstrap is unavailable
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

    // icon by type
    let icon = '';
    if (type === 'warning') icon = '<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>';
    if (type === 'danger') icon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
    if (type === 'success') icon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
    if (type === 'info') icon = '<i class="bi bi-info-circle-fill text-info me-2"></i>';

    titleEl.innerHTML = icon + title;
    bodyEl.innerHTML = bodyHtml;

    // Align footer: center when single button, otherwise right-aligned
    footerEl.className = 'modal-footer ' + (buttons.length === 1 ? 'd-flex justify-content-center' : 'd-flex justify-content-end');

    return await new Promise((resolve) => {
        // create buttons
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn ' + (btn.className || 'btn-primary');
            b.textContent = btn.label || btn.id || 'OK';
            if (btn.dismiss) b.setAttribute('data-bs-dismiss', 'modal');
            b.addEventListener('click', () => {
                resolve(btn.id);
            });
            footerEl.appendChild(b);
        });

        const bsModal = new bootstrap.Modal(modalEl, { keyboard: true });
        const onHidden = () => { resolve(null); modalEl.removeEventListener('hidden.bs.modal', onHidden); };
        modalEl.addEventListener('hidden.bs.modal', onHidden);
        bsModal.show();
    });
}

// helpers de data
export function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return Infinity;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const selected = new Date(y, m, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = selected - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isDateAllowed(dateStr) {
    const days = daysUntil(dateStr);
    return days >= 3;
}

// mostra modal de aviso específico para data e limpa o campo ao fechar
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
        try { if (selector) { selector.value = ''; selector.focus(); } } catch (e) {}
    }
}

// simula uma requisição POST (utilitário; pode ser trocado pelo fetch real)
export function simulatePost(url, payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (Math.random() < 0.92) {
                resolve({ ok: true, status: 201, json: async () => ({ id: Math.floor(Math.random() * 90000) + 1000, message: 'Criado' }) });
            } else {
                resolve({ ok: false, status: 500, json: async () => ({ error: 'Erro interno do servidor (simulado)' }) });
            }
        }, 900 + Math.random() * 600);
    });
}

// anexa handlers do stepper para o input de horas
export function attachHoursStepper(hoursSelector, incSelector, decSelector) {
    const inc = document.querySelector(incSelector);
    const dec = document.querySelector(decSelector);
    const el = document.querySelector(hoursSelector);
    if (!el) return;
    if (inc) inc.addEventListener('click', () => { try { el.stepUp(); } catch (err) { el.value = (parseFloat(el.value || '0') + parseFloat(el.step || '1')).toString(); } });
    if (dec) dec.addEventListener('click', () => { try { el.stepDown(); } catch (err) { el.value = (Math.max(0, parseFloat(el.value || '0') - parseFloat(el.step || '1'))).toString(); } });
}

// Inicializa comportamento da página de solicitação de horas
// - instancia SelectFuncionarios
// - anexa stepper de horas
// - valida e trata submissão (simulada)
// - trata cancelar e reset
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
    const manager = new SelectFuncionarios({
        dataSourceSelector,
        containerSelector,
        addButtonSelector,
        addPlaceholderSelector,
        selectionsInputSelector,
        obraSelector,
        hoursSelector,
        dateSelector,
        confirm: (msg) => showModal({ title: 'Confirmação', bodyHtml: `<p>${msg}</p>`, type: 'warning', buttons: [ { id: 'no', label: 'Não', className: 'btn-secondary', dismiss: true }, { id: 'yes', label: 'Sim', className: 'btn-danger', dismiss: true } ] }).then(r => r === 'yes')
    });

    const dateEl = document.querySelector(dateSelector);
    const submitForm = document.querySelector(submitFormSelector);
    const notesEl = document.querySelector(notesSelector);

    attachHoursStepper(hoursSelector, btnHoursInc, btnHoursDec);

    if (dateEl) {
        dateEl.addEventListener('change', (ev) => {
            const val = ev.target.value;
            if (val && !isDateAllowed(val)) showDateWarning(dateEl);
        });
    }

    if (submitForm) {
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedDate = dateEl ? dateEl.value : '';
            if (selectedDate && !isDateAllowed(selectedDate)) { showDateWarning(dateEl); return; }

            const validation = manager.isValidForm();
            if (!validation.valid) {
                await showModal({ title: 'Corrija os seguintes erros', bodyHtml: '<div>' + validation.errors.map(er => `<div>• ${er}</div>`).join('') + '</div>', type: 'warning', buttons: [{ id: 'ok', label: 'Voltar', className: 'btn-primary', dismiss: true }] });
                return;
            }

            const data = manager.getFormData();
            data.notes = notesEl ? notesEl.value.trim() : '';

            const btnSubmit = submitForm.querySelector('#btnSubmit');
            const btnSpinner = submitForm.querySelector('#btnSpinner');
            const btnText = submitForm.querySelector('#btnText');
            if (btnSubmit) btnSubmit.disabled = true;
            if (btnSpinner) btnSpinner.classList.remove('d-none');
            if (btnText) btnText.textContent = 'Enviando...';

            try {
                const response = await simulatePost('/api/solicitacoes', data);
                if (response && response.ok) {
                    const body = await response.json();
                    await showModal({ title: 'Solicitação enviada', bodyHtml: `<p>Solicitação enviada com sucesso. ID: <strong>${body.id}</strong></p>`, type: 'success', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
                    try { submitForm.reset(); manager.reset && typeof manager.reset === 'function' && manager.reset(); } catch (err) {}
                } else {
                    const errBody = response && response.json ? await response.json() : { error: 'Resposta inválida' };
                    await showModal({ title: 'Falha ao enviar', bodyHtml: `<p>${(errBody.error || JSON.stringify(errBody))}</p>`, type: 'danger', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
                }
            } catch (err) {
                await showModal({ title: 'Erro de rede', bodyHtml: `<p>${(err && err.message ? err.message : String(err))}</p>`, type: 'danger', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
                if (btnSpinner) btnSpinner.classList.add('d-none');
                if (btnText) btnText.textContent = 'Solicitar';
            }
        });
    }

    const btnCancel = document.querySelector('#btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const res = await showModal({ title: 'Confirmação', bodyHtml: '<p>Tem certeza que deseja cancelar!?</p>', type: 'warning', buttons: [ { id: 'no', label: 'Não', className: 'btn-secondary', dismiss: true }, { id: 'yes', label: 'Sim', className: 'btn-danger', dismiss: true } ] });
            if (res !== 'yes') return;
            try { submitForm.reset(); } catch (e) {}
            try { manager.reset && typeof manager.reset === 'function' && manager.reset(); } catch (e) {}
            await showModal({ title: 'Entrada apagada', bodyHtml: '<p>Entradas apagadas.</p>', type: 'info', buttons: [{ id: 'ok', label: 'OK', className: 'btn-primary', dismiss: true }] });
        });
    }

    return manager;
}
