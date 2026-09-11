(() => {
    const root = document.documentElement;
    const trigger = document.getElementById('a11y-trigger');
    const panel = document.getElementById('a11y-panel');
    const close = document.getElementById('a11y-close');
    const storageKey = 'liquidacion-accessibility';
    const defaults = {
        font: 'normal',
        contrast: false,
        dyslexia: false,
        spacing: false,
        links: false,
        motion: false,
        focus: false,
        targets: false,
        guide: false,
        monochrome: false,
        reading: false,
        'color-rg': false,
        'color-by': false,
        cursor: false
    };
    let settings = { ...defaults };

    try {
        settings = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
    } catch (error) {
        settings = { ...defaults };
    }

    const save = () => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(settings));
        } catch (error) {
            return false;
        }
        return true;
    };

    const apply = () => {
        root.dataset.a11yFont = settings.font;
        ['contrast', 'dyslexia', 'spacing', 'links', 'motion', 'focus', 'targets', 'guide', 'monochrome', 'reading', 'color-rg', 'color-by', 'cursor'].forEach((name) => {
            root.classList.toggle(`a11y-${name}`, settings[name]);
            const control = document.querySelector(`[data-a11y-toggle="${name}"]`);
            if (control) {
                control.checked = settings[name];
                const row = control.closest('.a11y-switch-row');
                if (row) row.classList.toggle('is-active', settings[name]);
            }
        });
        document.querySelectorAll('[data-a11y-action^="font-"]').forEach((control) => {
            control.setAttribute('aria-pressed', String(control.dataset.a11yAction === `font-${settings.font}`));
        });
        save();
    };

    const announce = (message) => {
        const status = document.getElementById('a11y-status');
        if (status) status.textContent = message;
    };

    const stopReading = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    const readPage = () => {
        if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
            announce('La lectura en voz alta no está disponible en este navegador.');
            return;
        }
        const content = document.getElementById('main-content');
        if (!content) return;
        stopReading();
        const text = content.innerText.trim();
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = document.documentElement.lang || 'es-ES';
        window.speechSynthesis.speak(utterance);
        announce('Lectura en voz alta iniciada.');
    };

    const setPanel = (open) => {
        if (!trigger || !panel) return;
        panel.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
        if (open) {
            const firstControl = panel.querySelector('button, input');
            if (firstControl) firstControl.focus();
        }
    };

    if (trigger && panel) {
        trigger.addEventListener('click', () => setPanel(panel.hidden));
        if (close) close.addEventListener('click', () => {
            setPanel(false);
            trigger.focus();
        });

        document.querySelectorAll('[data-a11y-toggle]').forEach((control) => {
            control.addEventListener('change', () => {
                settings[control.dataset.a11yToggle] = control.checked;
                apply();
                const label = control.closest('.a11y-switch-row')?.querySelector('span')?.textContent.trim();
                announce(`${label || 'Opción'} ${control.checked ? 'activada' : 'desactivada'}.`);
            });
        });

        document.querySelectorAll('[data-a11y-action]').forEach((control) => {
            control.addEventListener('click', () => {
                const action = control.dataset.a11yAction;
                if (action === 'reset') {
                    settings = { ...defaults };
                } else if (action.startsWith('font-')) {
                    settings.font = action.replace('font-', '');
                } else if (action === 'read') {
                    readPage();
                    return;
                } else if (action === 'stop') {
                    stopReading();
                    announce('Lectura detenida.');
                    return;
                }
                apply();
                if (action === 'reset') announce('Opciones restablecidas.');
                if (action.startsWith('font-')) announce(`Tamaño de texto: ${settings.font}.`);
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !panel.hidden) {
                setPanel(false);
                trigger.focus();
            }
        });
    }

    apply();
})();
