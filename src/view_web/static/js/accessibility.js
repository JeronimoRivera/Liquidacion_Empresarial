(() => {
    const root = document.documentElement;
    const trigger = document.getElementById('a11y-trigger');
    const panel = document.getElementById('a11y-panel');
    const close = document.getElementById('a11y-close');
    const storageKey = 'liquidacion-accessibility';
    const toggleNames = [
        'contrast', 'dyslexia', 'spacing', 'links', 'motion', 'focus', 'targets',
        'guide', 'monochrome', 'reading', 'color-rg', 'color-by', 'cursor'
    ];
    const defaults = Object.fromEntries([
        ['font', 'normal'],
        ...toggleNames.map((name) => [name, false])
    ]);
    let settings = { ...defaults };

    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
        settings = { ...defaults, ...saved };
        if (!['small', 'normal', 'large'].includes(settings.font)) settings.font = 'normal';
    } catch {
        settings = { ...defaults };
    }

    const announce = (message) => {
        const status = document.getElementById('a11y-status');
        if (status) status.textContent = message;
    };

    const apply = () => {
        root.dataset.a11yFont = settings.font;
        toggleNames.forEach((name) => {
            root.classList.toggle(`a11y-${name}`, Boolean(settings[name]));
            const control = document.querySelector(`[data-a11y-toggle="${name}"]`);
            if (control) {
                control.checked = Boolean(settings[name]);
                control.closest('.a11y-switch-row')?.classList.toggle('is-active', Boolean(settings[name]));
            }
        });
        document.querySelectorAll('[data-a11y-action^="font-"]').forEach((control) => {
            control.setAttribute('aria-pressed', String(control.dataset.a11yAction === `font-${settings.font}`));
        });
        try {
            localStorage.setItem(storageKey, JSON.stringify(settings));
        } catch {
            announce('Las preferencias se aplicarán solo durante esta sesión.');
        }
    };

    const setPanel = (open) => {
        if (!trigger || !panel) return;
        panel.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
        if (open) panel.querySelector('button, input')?.focus();
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
        const text = content?.innerText.trim();
        if (!text) return;
        stopReading();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = document.documentElement.lang || 'es';
        window.speechSynthesis.speak(utterance);
        announce('Lectura en voz alta iniciada.');
    };

    trigger?.addEventListener('click', () => setPanel(panel.hidden));
    close?.addEventListener('click', () => {
        setPanel(false);
        trigger?.focus();
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
            if (action === 'reset') settings = { ...defaults };
            else if (action.startsWith('font-')) settings.font = action.slice(5);
            else if (action === 'read') return readPage();
            else if (action === 'stop') {
                stopReading();
                announce('Lectura detenida.');
                return;
            }
            apply();
            announce(action === 'reset' ? 'Preferencias restablecidas.' : `Tamaño de texto: ${settings.font}.`);
        });
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && panel && !panel.hidden) {
            setPanel(false);
            trigger?.focus();
        }
    });
    document.addEventListener('pointermove', (event) => {
        if (root.classList.contains('a11y-guide')) {
            root.style.setProperty('--a11y-guide-y', `${event.clientY}px`);
        }
    });
    apply();
})();