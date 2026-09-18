/**
 * custom-forms.js
 * Progressively enhances native <select> and <input type="date"> elements
 * that carry the shared .field-input class into fully custom-styled
 * controls (no native dropdown / OS calendar chrome).
 *
 * The original <select>/<input> stays in the DOM — just visually hidden —
 * so it keeps working exactly as before: same id, same `required` /
 * `.value` reads, same `min` guard, same `change` events. That means the
 * reservation wizard logic in main.js needs zero changes.
 */

/* ------------------------------------------------------------------ */
/* Custom select                                                       */
/* ------------------------------------------------------------------ */
(function enhanceSelects() {
    const selects = document.querySelectorAll('select.field-input');

    selects.forEach((select, selectIndex) => {
        if (select.dataset.enhanced) return;
        select.dataset.enhanced = 'true';

        const wrapper = document.createElement('div');
        wrapper.className = 'ui-select';
        select.parentNode.insertBefore(wrapper, select);

        select.classList.add('ui-select-native');
        select.setAttribute('tabindex', '-1');
        select.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(select);

        const uid = 'ui-select-' + selectIndex;

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.id = uid + '-trigger';
        trigger.className = 'field-input ui-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const valueSpan = document.createElement('span');
        valueSpan.className = 'ui-select-value';

        const caret = document.createElement('span');
        caret.className = 'ui-select-caret';
        caret.setAttribute('aria-hidden', 'true');
        caret.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

        trigger.append(valueSpan, caret);
        wrapper.appendChild(trigger);

        const panel = document.createElement('div');
        panel.className = 'ui-select-panel';
        panel.setAttribute('role', 'listbox');
        panel.id = uid + '-panel';
        wrapper.appendChild(panel);
        trigger.setAttribute('aria-controls', panel.id);

        // Re-point the visible <label for="..."> at our new trigger button.
        const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
        if (label) label.setAttribute('for', trigger.id);

        let activeIndex = -1;

        function renderOptions() {
            panel.innerHTML = '';
            Array.from(select.options).forEach((opt, i) => {
                const item = document.createElement('div');
                item.className = 'ui-select-option';
                item.setAttribute('role', 'option');
                item.dataset.index = String(i);
                item.textContent = opt.textContent;
                if (opt.disabled) item.setAttribute('aria-disabled', 'true');
                if (i === select.selectedIndex) item.classList.add('is-selected');
                item.addEventListener('click', () => {
                    if (opt.disabled) return;
                    selectOption(i);
                    close();
                });
                panel.appendChild(item);
            });
        }

        function syncValueDisplay() {
            const opt = select.options[select.selectedIndex];
            valueSpan.textContent = opt ? opt.textContent : '';
            valueSpan.classList.toggle('is-placeholder', !select.value);
        }

        function selectOption(i) {
            if (select.selectedIndex !== i) {
                select.selectedIndex = i;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            syncValueDisplay();
            renderOptions();
        }

        function open() {
            document.querySelectorAll('.ui-select-panel.is-open, .ui-datepicker-panel.is-open')
                .forEach((p) => { p.classList.remove('is-open'); p.classList.remove('align-right'); });
            activeIndex = select.selectedIndex;
            panel.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            // Flip to right-aligned if the panel would otherwise overflow
            // past the right edge of the viewport (fixes clipped panels
            // on fields that sit in the right column of a form).
            requestAnimationFrame(() => {
                const rect = panel.getBoundingClientRect();
                panel.classList.toggle('align-right', rect.right > window.innerWidth - 12);
            });
            document.addEventListener('click', onOutsideClick, true);
        }
        function close() {
            panel.classList.remove('is-open');
            panel.classList.remove('align-right');
            trigger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', onOutsideClick, true);
        }
        function onOutsideClick(e) {
            if (!wrapper.contains(e.target)) close();
        }

        trigger.addEventListener('click', () => {
            panel.classList.contains('is-open') ? close() : open();
        });

        trigger.addEventListener('keydown', (e) => {
            const options = Array.from(select.options);
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!panel.classList.contains('is-open')) { open(); return; }
                const dir = e.key === 'ArrowDown' ? 1 : -1;
                let next = activeIndex;
                do {
                    next += dir;
                } while (options[next] && options[next].disabled);
                if (next >= 0 && next < options.length) {
                    activeIndex = next;
                    panel.querySelectorAll('.ui-select-option').forEach((el, i) => {
                        el.classList.toggle('is-active', i === activeIndex);
                    });
                    panel.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!panel.classList.contains('is-open')) { open(); return; }
                if (activeIndex >= 0) { selectOption(activeIndex); close(); }
            } else if (e.key === 'Escape') {
                close();
            } else if (e.key === 'Tab') {
                close();
            }
        });

        // If something else mutates the underlying select's value/style
        // (validation, resets), keep the custom UI in sync.
        select.addEventListener('change', () => { syncValueDisplay(); renderOptions(); });

        // If something else rebuilds the <option> list entirely (e.g. the
        // reservation form regenerating time slots for a newly-picked date),
        // it dispatches this instead of 'change' since the *value* may not
        // have changed, just the available choices.
        select.addEventListener('options-changed', () => { syncValueDisplay(); renderOptions(); });

        const observer = new MutationObserver(() => {
            trigger.classList.toggle('is-invalid', !!select.style.borderColor);
        });
        observer.observe(select, { attributes: true, attributeFilter: ['style'] });

        renderOptions();
        syncValueDisplay();
    });
})();

/* ------------------------------------------------------------------ */
/* Custom date picker                                                   */
/* ------------------------------------------------------------------ */
(function enhanceDateInputs() {
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const pad = (n) => String(n).padStart(2, '0');
    const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    function parseISO(str) {
        if (!str) return null;
        const parts = str.split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    function formatDisplay(date) {
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    const dateInputs = document.querySelectorAll('input[type="date"].field-input');

    dateInputs.forEach((input, inputIndex) => {
        if (input.dataset.enhanced) return;
        input.dataset.enhanced = 'true';

        const wrapper = document.createElement('div');
        wrapper.className = 'ui-datepicker';
        input.parentNode.insertBefore(wrapper, input);

        input.classList.add('ui-datepicker-native');
        input.setAttribute('tabindex', '-1');
        input.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(input);

        const uid = 'ui-date-' + inputIndex;
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.id = uid + '-trigger';
        trigger.className = 'field-input ui-datepicker-trigger';
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-expanded', 'false');

        const valueSpan = document.createElement('span');
        valueSpan.className = 'ui-datepicker-value is-placeholder';
        valueSpan.textContent = 'Select a date';

        const icon = document.createElement('span');
        icon.className = 'ui-datepicker-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>';

        trigger.append(valueSpan, icon);
        wrapper.appendChild(trigger);

        const label = input.id ? document.querySelector(`label[for="${input.id}"]`) : null;
        if (label) label.setAttribute('for', trigger.id);

        const panel = document.createElement('div');
        panel.className = 'ui-datepicker-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Choose a date');
        wrapper.appendChild(panel);

        let selectedDate = parseISO(input.value);
        let viewDate = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : (() => { const t = new Date(); t.setDate(1); return t; })();

        if (selectedDate) {
            valueSpan.textContent = formatDisplay(selectedDate);
            valueSpan.classList.remove('is-placeholder');
        }

        const minDate = () => parseISO(input.min);
        const maxDate = () => parseISO(input.max);
        // Optional data-closed-days="1,2" on the <input> — comma-separated
        // JS weekday numbers (0=Sun..6=Sat) that should be unselectable,
        // e.g. a day the restaurant is closed. Generic/reusable: this file
        // doesn't otherwise know anything about business hours.
        const closedDays = (input.dataset.closedDays || '')
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n));
        function isDisabled(date) {
            const min = minDate();
            const max = maxDate();
            if (min && date < min) return true;
            if (max && date > max) return true;
            if (closedDays.includes(date.getDay())) return true;
            return false;
        }

        function render() {
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            const startOffset = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const min = minDate();
            const prevMonthEnd = new Date(year, month, 0);
            const canGoPrev = !min || prevMonthEnd >= min;

            const leadingCells = Array.from({ length: startOffset }, (_, i) =>
                `<div class="ui-datepicker-day is-other-month is-disabled">${daysInPrevMonth - startOffset + i + 1}</div>`
            ).join('');

            const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const dateObj = new Date(year, month, d);
                const disabled = isDisabled(dateObj);
                const classes = ['ui-datepicker-day'];
                if (disabled) classes.push('is-disabled');
                if (dateObj.getTime() === today.getTime()) classes.push('is-today');
                if (selectedDate && dateObj.getTime() === selectedDate.getTime()) classes.push('is-selected');
                return `<div class="${classes.join(' ')}" data-day="${d}"${disabled ? '' : ' role="button" tabindex="-1"'}>${d}</div>`;
            }).join('');

            panel.innerHTML = `
                <div class="ui-datepicker-head">
                    <button type="button" class="ui-datepicker-nav" data-nav="-1" aria-label="Previous month" ${canGoPrev ? '' : 'disabled'}>&#8249;</button>
                    <span class="ui-datepicker-title">${MONTHS[month]} ${year}</span>
                    <button type="button" class="ui-datepicker-nav" data-nav="1" aria-label="Next month">&#8250;</button>
                </div>
                <div class="ui-datepicker-grid">
                    ${WEEKDAYS.map((w) => `<div class="ui-datepicker-weekday">${w}</div>`).join('')}
                    ${leadingCells}${dayCells}
                </div>
                <div class="ui-datepicker-footer">
                    <button type="button" class="ui-datepicker-today-btn">Jump to today</button>
                </div>
            `;

            panel.querySelectorAll('.ui-datepicker-day[role="button"]').forEach((cell) => {
                cell.addEventListener('click', () => pick(new Date(year, month, Number(cell.dataset.day))));
            });
            panel.querySelectorAll('.ui-datepicker-nav').forEach((btn) => {
                btn.addEventListener('click', () => {
                    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + Number(btn.dataset.nav), 1);
                    render();
                });
            });
            const todayBtn = panel.querySelector('.ui-datepicker-today-btn');
            if (todayBtn) {
                todayBtn.addEventListener('click', () => {
                    const t = new Date();
                    t.setHours(0, 0, 0, 0);
                    if (!isDisabled(t)) pick(t);
                });
            }
        }

        function pick(date) {
            selectedDate = date;
            viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
            input.value = toISO(date.getFullYear(), date.getMonth(), date.getDate());
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            valueSpan.textContent = formatDisplay(date);
            valueSpan.classList.remove('is-placeholder');
            render();
            close();
        }

        function open() {
            document.querySelectorAll('.ui-select-panel.is-open, .ui-datepicker-panel.is-open')
                .forEach((p) => { p.classList.remove('is-open'); p.classList.remove('align-right'); });
            render();
            panel.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            // Flip to right-aligned if the panel would otherwise overflow
            // past the right edge of the viewport (fixes a clipped/cut-off
            // calendar when the date field sits in the right-hand column).
            requestAnimationFrame(() => {
                const rect = panel.getBoundingClientRect();
                panel.classList.toggle('align-right', rect.right > window.innerWidth - 12);
            });
            document.addEventListener('click', onOutsideClick, true);
        }
        function close() {
            panel.classList.remove('is-open');
            panel.classList.remove('align-right');
            trigger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', onOutsideClick, true);
        }
        function onOutsideClick(e) {
            if (!wrapper.contains(e.target)) close();
        }

        trigger.addEventListener('click', () => {
            panel.classList.contains('is-open') ? close() : open();
        });
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                panel.classList.contains('is-open') ? close() : open();
            }
        });

        const observer = new MutationObserver(() => {
            trigger.classList.toggle('is-invalid', !!input.style.borderColor);
        });
        observer.observe(input, { attributes: true, attributeFilter: ['style'] });
    });
})();
