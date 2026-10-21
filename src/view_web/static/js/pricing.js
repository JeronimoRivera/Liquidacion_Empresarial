(() => {
    const section = document.querySelector('.subscription-section');
    if (!section) return;

    const currency = new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 0,
    });
    let billing = 'monthly';

    const updatePrices = () => {
        section.querySelectorAll('.pricing-card').forEach((card) => {
            const price = card.querySelector('[data-monthly-price]');
            const period = card.querySelector('[data-price-period]');
            const savings = card.querySelector('.pricing-savings');
            const annualNote = card.querySelector('[data-annual-note]');
            const monthlyPrice = Number(price.dataset.monthlyPrice);
            const annualPrice = Number(price.dataset.annualPrice);
            const singlePayment = period.dataset.pricePeriod === 'single';
            const isAnnual = billing === 'annual' && !singlePayment;

            price.textContent = `$${currency.format(isAnnual ? annualPrice : monthlyPrice)}`;
            period.textContent = singlePayment
                ? 'Pago único'
                : isAnnual
                    ? card.dataset.plan === 'Corporativo' ? 'Desde · / año · A medida' : '/ año'
                    : card.dataset.plan === 'Corporativo' ? 'Desde · / mes · A medida' : '/ mes';

            if (savings) {
                const amountSaved = monthlyPrice * 12 - annualPrice;
                savings.hidden = !isAnnual || amountSaved <= 0;
                savings.textContent = `Ahorra $${currency.format(amountSaved)} · 2 meses gratis (16,7%)`;
            }
            if (annualNote) annualNote.hidden = !isAnnual;
        });
    };

    section.querySelectorAll('[data-billing]').forEach((button) => {
        button.addEventListener('click', () => {
            billing = button.dataset.billing;
            section.querySelectorAll('[data-billing]').forEach((option) => {
                const active = option === button;
                option.classList.toggle('is-active', active);
                option.setAttribute('aria-pressed', String(active));
            });
            updatePrices();
        });
    });

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

    updatePrices();
})();
