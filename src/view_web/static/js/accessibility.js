(() => {
    const root = document.documentElement;
    const trigger = document.getElementById('a11y-trigger');
    const panel = document.getElementById('a11y-panel');
    const close = document.getElementById('a11y-close');
    const storageKey = 'liquidacion-accessibility';
    const toggleNames = [
        'contrast', 'dyslexia', 'spacing', 'links', 'motion', 'focus', 'targets',
        'guide', 'monochrome', 'reading', 'hoverRead', 'color-rg', 'color-by', 'cursor',
        'align', 'headings'
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
        toggleNames.forEach((name) => {
            settings[name] = saved[name] === true;
        });
    } catch {
        settings = { ...defaults };
    }

    const readingGuide = document.createElement('div');
    readingGuide.className = 'a11y-reading-guide';
    readingGuide.setAttribute('aria-hidden', 'true');
    readingGuide.hidden = true;
    document.body.append(readingGuide);

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
        readingGuide.hidden = !settings.guide;
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

    const speechTargetSelector = 'h1, h2, h3, h4, h5, h6, p, a, button, label, input, select, textarea, summary, li, td, th, [role="button"], [aria-label], [data-a11y-read]';
    let lastSpokenTarget = null;

    const resolveSpeechTarget = (target) => {
        const element = target.closest(speechTargetSelector);
        if (element && element.matches('input, select, textarea') && element.labels?.length) {
            return element.labels[0];
        }
        return element;
    };

    const getSpeechText = (element) => {
        const labelText = element.labels
            ? Array.from(element.labels).map((label) => label.innerText).join(' ')
            : '';
        const text = element.getAttribute('aria-label')
            || element.getAttribute('title')
            || labelText
            || element.innerText
            || element.textContent
            || element.getAttribute('placeholder')
            || '';
        return text.replace(/\s+/g, ' ').trim().slice(0, 240);
    };

    const readElement = (element) => {
        if (!settings.hoverRead || !element || element.closest('[hidden]')) return;
        if (element.matches('[data-a11y-action="stop"]') || element === lastSpokenTarget) return;
        const text = getSpeechText(element);
        if (!text) return;
        lastSpokenTarget = element;
        if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
            announce('La lectura por voz no está disponible en este navegador.');
            return;
        }
        stopReading();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = document.documentElement.lang || 'es';
        window.speechSynthesis.speak(utterance);
    };

    const readEventTarget = (event) => {
        if (!(event.target instanceof Element)) return;
        readElement(resolveSpeechTarget(event.target));
    };

    const resetSpokenTarget = (event) => {
        if (!(event.target instanceof Element)) return;
        const target = resolveSpeechTarget(event.target);
        if (target && target === lastSpokenTarget && !target.contains(event.relatedTarget)) {
            lastSpokenTarget = null;
        }
    };

    trigger?.addEventListener('click', () => setPanel(panel?.hidden ?? true));
    close?.addEventListener('click', () => {
        setPanel(false);
        trigger?.focus();
    });
    document.querySelectorAll('[data-a11y-toggle]').forEach((control) => {
        control.addEventListener('change', () => {
            settings[control.dataset.a11yToggle] = control.checked;
            if (control.dataset.a11yToggle === 'hoverRead' && !control.checked) {
                stopReading();
                lastSpokenTarget = null;
            }
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
            else if (action === 'stop') {
                stopReading();
                lastSpokenTarget = null;
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
            readingGuide.style.top = `${event.clientY}px`;
        }
    });
    document.addEventListener('pointerover', readEventTarget);
    document.addEventListener('pointerout', resetSpokenTarget);
    document.addEventListener('focusin', readEventTarget);
    document.addEventListener('focusout', resetSpokenTarget);
    apply();
})();