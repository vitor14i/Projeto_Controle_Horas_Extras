// Select_funcionarios.js
// Classe SelectFuncionarios: gerencia selects dinâmicos de funcionários e retorna seleção atual

class SelectFuncionarios {
    constructor({ dataSourceSelector = '#dataSource', containerSelector = '#selectsContainer', addButtonSelector = '#btnAdd', addPlaceholderSelector = '.add-placeholder', selectionsInputSelector = '#selectionsInput', obraSelector = '#obraSelect', hoursSelector = '#hoursInput', dateSelector = '#dateInput' } = {}) {
        // Cache selectors once
        this.dataSource = document.querySelector(dataSourceSelector);
        this.container = document.querySelector(containerSelector);
        this.btnAdd = document.querySelector(addButtonSelector);
        this.addPlaceholder = document.querySelector(addPlaceholderSelector);
        this.selectionsInput = document.querySelector(selectionsInputSelector);
        this.obraEl = document.querySelector(obraSelector);
        this.hoursEl = document.querySelector(hoursSelector);
        this.dateEl = document.querySelector(dateSelector);

        if (!this.dataSource || !this.container) throw new Error('dataSource or container not found');

        // master options (source of truth) and counts cached
        this.masterOptions = Array.from(this.dataSource.options).filter(o => o.value !== '').map(o => ({ value: o.value, text: o.text }));
        this.masterCount = this.masterOptions.length;
        this.selectCounter = 0;

        if (this.btnAdd) this.btnAdd.addEventListener('click', () => this.handleAddClick());

        // create initial select and set button state
        this.createSelectRow();
        this.updateAddButtonState();
    }

    // helpers
    getAllSelects() { return Array.from(this.container.querySelectorAll('select')); }
    getSelectedValues() { return new Set(this.getAllSelects().map(s => s.value).filter(Boolean)); }

    // Add/remove logic
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

    // Refresh all selects to keep de-duplication consistent (runs on change)
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

    // Create a new select and populate it with currently available options only (no full rebuild)
    createSelectRow(pre = '') {
        const row = document.createElement('div'); row.className = 'select-row';
        const floatWrap = document.createElement('div'); floatWrap.className = 'form-floating';
        const select = document.createElement('select'); select.className = 'form-select select-control'; select.id = 'select_' + (++this.selectCounter);
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

        del.addEventListener('click', () => {
            if (select.value) {
                const ok = confirm('Tem certeza que deseja excluir este funcionário?');
                if (!ok) return;
            }
            row.remove();
            this.refreshAllSelects();
        });

        floatWrap.appendChild(select); floatWrap.appendChild(label); row.appendChild(floatWrap); row.appendChild(del);
        if (this.addPlaceholder) this.container.insertBefore(row, this.addPlaceholder); else this.container.appendChild(row);

        // update payload and add-button state
        this.updateSelectionsPayload();
        this.updateAddButtonState();
    }

    updateSelectionsPayload() {
        const data = this.getAllSelects().map(s => ({ value: s.value, text: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '' })).filter(x => x.value);
        if (this.selectionsInput) this.selectionsInput.value = JSON.stringify(data);
    }

    // UI helpers
    updateAddButtonState() {
        if (!this.btnAdd) return;
        this.btnAdd.disabled = !this.canAddMoreSelects();
        this.btnAdd.title = this.btnAdd.disabled ? 'Não é possível adicionar mais — todos os funcionários já foram adicionados.' : '';
    }

    // Retorna array de funcionários selecionados como objetos { value, text }
    getSelectedEmployees() {
        return this.getAllSelects().map(s => ({ value: s.value, text: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '' })).filter(x => x.value);
    }

    // Retorna o estado completo do formulário (se houver campos adicionais na página)
    getFormData() {
        const employees = this.getSelectedEmployees();
        const obraEl = document.querySelector('#obraSelect');
        const hoursEl = document.querySelector('#hoursInput');
        const dateEl = document.querySelector('#dateInput');

        const obra = obraEl ? { value: obraEl.value, text: obraEl.options[obraEl.selectedIndex] ? obraEl.options[obraEl.selectedIndex].text : '' } : null;
        const hours = hoursEl ? Math.max(1, parseInt(hoursEl.value || '1', 10)) : undefined;
        const date = dateEl ? (dateEl.value || null) : undefined;

        return { obra, hours, date, employees };
    }

    // Validação simples do formulário - retorna { valid: boolean, errors: string[] }
    isValidForm() {
        const errors = [];
        const form = this.getFormData();
        if (document.querySelector('#obraSelect') && (!form.obra || !form.obra.value)) errors.push('Selecione a obra.');
        if (document.querySelector('#dateInput') && !form.date) errors.push('Informe a data.');
        if (!form.employees || form.employees.length === 0) errors.push('Adicione ao menos um funcionário.');
        return { valid: errors.length === 0, errors };
    }
}

if (typeof window !== 'undefined') window.SelectFuncionarios = SelectFuncionarios;

export default SelectFuncionarios;
