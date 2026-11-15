(() => {
    const section = document.querySelector('.subscription-section');
    if (!section) return;

    const tabs = Array.from(section.querySelectorAll('[role="tab"]'));
    const activateTab = (tab) => {
        tabs.forEach((item) => {
            const active = item === tab;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-selected', String(active));
            item.tabIndex = active ? 0 : -1;
            section.querySelector(`#${item.getAttribute('aria-controls')}`).hidden = !active;
        });
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activateTab(tab));
        tab.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
            activateTab(nextTab);
            nextTab.focus();
        });
    });

    section.querySelectorAll('.pricing-cta').forEach((button) => {
        button.addEventListener('click', () => {
            const plan = button.closest('.pricing-card').dataset.plan;
            const message = section.querySelector('.pricing-selection-message');
            message.textContent = `Seleccionaste el plan ${plan}. La contratación se coordina con nuestro equipo.`;
        });
    });
})();
