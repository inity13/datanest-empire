/* ============================================================
   Neon Bazaar — Crypto Checkout Modal (Placeholder)
   ============================================================
   This will be wired up to real wallet addresses and Supabase
   verification via the crypto_payments pipeline module.
   ============================================================ */

(function () {
    'use strict';

    var SUPPORTED_COINS = ['BTC', 'ETH', 'USDC', 'LTC'];

    /* ----- Modal Template ----- */
    function createModal() {
        var overlay = document.createElement('div');
        overlay.id = 'crypto-modal-overlay';
        overlay.className = 'crypto-overlay hidden';
        overlay.innerHTML = [
            '<div class="crypto-modal">',
            '  <button class="crypto-modal__close" aria-label="Close">&times;</button>',
            '  <h3 class="crypto-modal__title">Pay with Crypto</h3>',
            '  <p class="crypto-modal__subtitle">20% off — choose your coin</p>',
            '  <div class="crypto-modal__product"></div>',
            '  <div class="crypto-modal__coins"></div>',
            '  <div class="crypto-modal__address hidden">',
            '    <p class="crypto-modal__label">Send exactly:</p>',
            '    <p class="crypto-modal__amount"></p>',
            '    <p class="crypto-modal__label">To this address:</p>',
            '    <code class="crypto-modal__wallet"></code>',
            '    <button class="btn btn--primary btn--sm crypto-modal__copy">Copy Address</button>',
            '    <p class="crypto-modal__status">Waiting for payment confirmation...</p>',
            '  </div>',
            '</div>'
        ].join('\n');

        document.body.appendChild(overlay);
        return overlay;
    }

    /* ----- Event Handlers ----- */
    function initCryptoCheckout() {
        var overlay = createModal();
        var modal = overlay.querySelector('.crypto-modal');
        var closeBtn = overlay.querySelector('.crypto-modal__close');

        // Close modal
        function closeModal() {
            overlay.classList.add('hidden');
        }

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });

        // Open modal from crypto buttons
        document.querySelectorAll('[data-crypto-product]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var productName = btn.getAttribute('data-crypto-product');
                var price = btn.getAttribute('data-crypto-price') || '0';

                modal.querySelector('.crypto-modal__product').textContent =
                    productName + ' — $' + (parseInt(price, 10) / 100).toFixed(2);

                var coinsContainer = modal.querySelector('.crypto-modal__coins');
                coinsContainer.innerHTML = '';
                SUPPORTED_COINS.forEach(function (coin) {
                    var coinBtn = document.createElement('button');
                    coinBtn.className = 'btn btn--secondary btn--sm';
                    coinBtn.textContent = coin;
                    coinBtn.addEventListener('click', function () {
                        // TODO: fetch real wallet address and conversion from API
                        var addressSection = modal.querySelector('.crypto-modal__address');
                        addressSection.classList.remove('hidden');
                        modal.querySelector('.crypto-modal__amount').textContent =
                            '≈ calculating ' + coin + ' amount...';
                        modal.querySelector('.crypto-modal__wallet').textContent =
                            'Loading wallet address...';
                    });
                    coinsContainer.appendChild(coinBtn);
                });

                // Reset address section
                modal.querySelector('.crypto-modal__address').classList.add('hidden');

                overlay.classList.remove('hidden');
            });
        });

        // Copy button
        var copyBtn = modal.querySelector('.crypto-modal__copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var wallet = modal.querySelector('.crypto-modal__wallet');
                if (wallet && navigator.clipboard) {
                    navigator.clipboard.writeText(wallet.textContent).then(function () {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(function () { copyBtn.textContent = 'Copy Address'; }, 2000);
                    });
                }
            });
        }
    }

    /* ----- Inline Styles for Modal ----- */
    function injectStyles() {
        var style = document.createElement('style');
        style.textContent = [
            '.crypto-overlay {',
            '  position: fixed; inset: 0; z-index: 9999;',
            '  background: rgba(10,10,18,.85);',
            '  backdrop-filter: blur(8px);',
            '  display: flex; align-items: center; justify-content: center;',
            '  padding: 24px;',
            '}',
            '.crypto-overlay.hidden { display: none; }',
            '.crypto-modal {',
            '  position: relative;',
            '  background: var(--nb-surface, #12122a);',
            '  border: 1px solid var(--nb-border, #2a2a4a);',
            '  border-radius: 20px;',
            '  padding: 40px 36px;',
            '  max-width: 460px; width: 100%;',
            '  text-align: center;',
            '  box-shadow: 0 0 60px rgba(57,255,20,.08);',
            '}',
            '.crypto-modal__close {',
            '  position: absolute; top: 16px; right: 20px;',
            '  background: none; border: none;',
            '  color: var(--nb-text-muted, #8888aa);',
            '  font-size: 1.5rem; cursor: pointer;',
            '}',
            '.crypto-modal__title {',
            '  font-family: var(--nb-font-heading, sans-serif);',
            '  font-size: 1.5rem; margin-bottom: 4px;',
            '  color: var(--nb-acid-green, #05FFA1);',
            '}',
            '.crypto-modal__subtitle {',
            '  color: var(--nb-text-muted, #8888aa);',
            '  font-size: 0.9rem; margin-bottom: 20px;',
            '}',
            '.crypto-modal__product {',
            '  font-weight: 600; margin-bottom: 20px;',
            '  color: var(--nb-text, #eaeaff);',
            '}',
            '.crypto-modal__coins {',
            '  display: flex; gap: 10px; justify-content: center;',
            '  flex-wrap: wrap; margin-bottom: 20px;',
            '}',
            '.crypto-modal__label {',
            '  font-size: 0.8rem; color: var(--nb-text-muted, #8888aa);',
            '  margin-bottom: 4px; text-transform: uppercase;',
            '  letter-spacing: 0.08em;',
            '}',
            '.crypto-modal__amount {',
            '  font-family: var(--nb-font-mono, monospace);',
            '  font-size: 1.2rem; color: var(--nb-acid-green, #05FFA1);',
            '  margin-bottom: 16px;',
            '}',
            '.crypto-modal__wallet {',
            '  display: block;',
            '  font-family: var(--nb-font-mono, monospace);',
            '  font-size: 0.75rem;',
            '  background: var(--nb-surface-variant, #1a1a3a);',
            '  padding: 12px 16px; border-radius: 8px;',
            '  word-break: break-all; margin-bottom: 16px;',
            '  color: var(--nb-text, #eaeaff);',
            '}',
            '.crypto-modal__status {',
            '  font-size: 0.8rem; color: var(--nb-text-muted, #8888aa);',
            '  margin-top: 12px;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    /* ----- Init ----- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            injectStyles();
            initCryptoCheckout();
        });
    } else {
        injectStyles();
        initCryptoCheckout();
    }
})();
