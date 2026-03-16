// =============================================================================
// Crypto Checkout — Zero-Cost Direct Wallet Payment Modal
// =============================================================================
// Fully client-side crypto payment component. No backend required.
// Fetches live exchange rates from CoinGecko (free API, no key).
// Falls back to cached/hardcoded rates if API is unavailable.
//
// Usage: Add data attributes to any button:
//   <button class="crypto-pay-btn"
//     data-product-slug="terraform-starter"
//     data-store-slug="devops-toolkit"
//     data-product-name="Terraform Starter Kit"
//     data-price-usd="29">Pay with Crypto (Save 20%)</button>
//
// The script auto-attaches click handlers to all .crypto-pay-btn elements.
// =============================================================================

(function () {
  'use strict';

  // ─── Configuration ──────────────────────────────────────────────────
  var DISCOUNT_PERCENT = 20;
  var PRICE_LOCK_MINUTES = 15;
  var QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  var COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,usd-coin&vs_currencies=usd';

  var WALLETS = {
    BTC: 'bc1qzcll4um02pwyujhm00204hndzhf8vtsesa9paf',
    ETH: '0xAA7985525BeEd6785Aa7be0571108954C70bd302',
    USDC: '0xAA7985525BeEd6785Aa7be0571108954C70bd302',
    LTC: 'ltc1q7cpnk7z0ewdc8n4yn2na2w0qugwl5xxz0thrw7'
  };

  var CURRENCY_INFO = {
    BTC:  { name: 'Bitcoin',  icon: '\u20bf', color: '#f7931a', confirmTime: '10-30 min', geckoId: 'bitcoin',  decimals: 8 },
    ETH:  { name: 'Ethereum', icon: '\u039e', color: '#627eea', confirmTime: '2-5 min',   geckoId: 'ethereum', decimals: 6 },
    USDC: { name: 'USDC',     icon: '$',      color: '#2775ca', confirmTime: '2-5 min',   geckoId: 'usd-coin', decimals: 2 },
    LTC:  { name: 'Litecoin', icon: '\u0141', color: '#345d9d', confirmTime: '5-15 min',  geckoId: 'litecoin', decimals: 6 }
  };

  // Fallback rates (updated periodically — used only if CoinGecko is unreachable)
  var FALLBACK_RATES = { BTC: 84000, ETH: 3200, USDC: 1.0, LTC: 95 };
  var cachedRates = null;
  var ratesFetchedAt = 0;
  var RATE_TTL_MS = 60000; // Cache rates for 60 seconds

  // ─── State ──────────────────────────────────────────────────────────
  var modal = null;
  var currentPayment = null;
  var countdownTimer = null;
  var qrReady = false;

  // ─── QR Code Loader ─────────────────────────────────────────────────
  function loadQrLib(cb) {
    if (window.qrcode || qrReady) { cb(); return; }
    var s = document.createElement('script');
    s.src = QR_CDN;
    s.onload = function () { qrReady = true; cb(); };
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  function generateQR(text, size) {
    if (!window.qrcode) return '';
    try {
      var qr = window.qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: size || 4, margin: 2 });
    } catch (e) {
      return '';
    }
  }

  // ─── Utility ────────────────────────────────────────────────────────
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    }).catch(function () {});
  }

  function generatePaymentId() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = 'cp_';
    for (var i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  // ─── Exchange Rates ─────────────────────────────────────────────────
  function fetchRates(cb) {
    if (cachedRates && (Date.now() - ratesFetchedAt) < RATE_TTL_MS) {
      cb(cachedRates);
      return;
    }
    fetch(COINGECKO_API)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var rates = {};
        Object.keys(CURRENCY_INFO).forEach(function (c) {
          var info = CURRENCY_INFO[c];
          if (data[info.geckoId] && data[info.geckoId].usd) {
            rates[c] = data[info.geckoId].usd;
          } else {
            rates[c] = FALLBACK_RATES[c];
          }
        });
        cachedRates = rates;
        ratesFetchedAt = Date.now();
        cb(rates);
      })
      .catch(function () {
        cachedRates = FALLBACK_RATES;
        ratesFetchedAt = Date.now();
        cb(FALLBACK_RATES);
      });
  }

  function calculateCryptoAmount(usdAmount, currency, rates) {
    var rate = rates[currency] || FALLBACK_RATES[currency] || 1;
    var decimals = CURRENCY_INFO[currency] ? CURRENCY_INFO[currency].decimals : 8;
    var raw = usdAmount / rate;
    return parseFloat(raw.toFixed(decimals));
  }

  // ─── Styles ─────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('crypto-checkout-styles')) return;
    var style = document.createElement('style');
    style.id = 'crypto-checkout-styles';
    style.textContent = [
      '.crypto-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);opacity:0;transition:opacity .2s}',
      '.crypto-modal-overlay.active{opacity:1}',
      '.crypto-modal{background:#0f172a;border:1px solid #334155;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 25px 50px rgba(0,0,0,0.5)}',
      '.crypto-modal *{box-sizing:border-box}',
      '.cm-header{padding:1.25rem 1.5rem;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center}',
      '.cm-header h2{margin:0;font-size:1.125rem;color:#f8fafc;font-weight:600}',
      '.cm-close{background:none;border:none;color:#64748b;font-size:1.5rem;cursor:pointer;padding:0 0 0 1rem;line-height:1}',
      '.cm-close:hover{color:#f8fafc}',
      '.cm-body{padding:1.5rem}',
      '.cm-discount{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-align:center;padding:.5rem;font-size:.8125rem;font-weight:600;letter-spacing:.02em}',
      '.cm-currencies{display:flex;gap:.5rem;margin-bottom:1.25rem;flex-wrap:wrap}',
      '.cm-curr-btn{flex:1;min-width:60px;padding:.625rem .5rem;border:2px solid #334155;border-radius:10px;background:#1e293b;color:#94a3b8;cursor:pointer;text-align:center;font-size:.8125rem;font-weight:600;transition:all .15s}',
      '.cm-curr-btn:hover{border-color:#475569;color:#e2e8f0}',
      '.cm-curr-btn.active{border-color:var(--curr-color,#3b82f6);color:#fff;background:#1e293b}',
      '.cm-curr-icon{display:block;font-size:1.25rem;margin-bottom:.125rem}',
      '.cm-amount-box{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:1rem;margin-bottom:1rem;text-align:center}',
      '.cm-amount{font-size:1.375rem;font-weight:700;color:#f8fafc;margin:0 0 .25rem}',
      '.cm-amount-usd{font-size:.8125rem;color:#64748b}',
      '.cm-amount-usd s{color:#475569;margin-right:.25rem}',
      '.cm-address-box{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:1rem;margin-bottom:1rem}',
      '.cm-address-label{font-size:.75rem;color:#64748b;margin:0 0 .375rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600}',
      '.cm-address-row{display:flex;align-items:center;gap:.5rem}',
      '.cm-address{font-family:monospace;font-size:.75rem;color:#e2e8f0;word-break:break-all;flex:1;line-height:1.4}',
      '.cm-copy-btn{background:#334155;border:none;color:#94a3b8;padding:.375rem .625rem;border-radius:6px;cursor:pointer;font-size:.6875rem;white-space:nowrap;font-weight:600}',
      '.cm-copy-btn:hover{background:#475569;color:#f8fafc}',
      '.cm-qr{text-align:center;margin:1rem 0;background:#fff;border-radius:8px;padding:.75rem;display:inline-block}',
      '.cm-qr-wrap{text-align:center}',
      '.cm-qr svg{display:block}',
      '.cm-timer{text-align:center;font-size:.8125rem;color:#f59e0b;margin:1rem 0;font-weight:600}',
      '.cm-timer.expired{color:#ef4444}',
      '.cm-divider{border:none;border-top:1px solid #1e293b;margin:1.25rem 0}',
      '.cm-input-group{margin-bottom:1rem}',
      '.cm-input-group label{display:block;font-size:.8125rem;color:#94a3b8;margin-bottom:.375rem;font-weight:500}',
      '.cm-input{width:100%;padding:.625rem .75rem;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#f8fafc;font-size:.875rem;font-family:inherit}',
      '.cm-input:focus{outline:none;border-color:#3b82f6}',
      '.cm-input::placeholder{color:#475569}',
      '.cm-submit{width:100%;padding:.75rem;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:10px;font-size:.9375rem;font-weight:700;cursor:pointer;transition:opacity .15s}',
      '.cm-submit:hover{opacity:.9}',
      '.cm-submit:disabled{opacity:.5;cursor:not-allowed}',
      '.cm-footer{padding:.75rem 1.5rem;border-top:1px solid #1e293b;text-align:center;font-size:.6875rem;color:#475569}',
      '.cm-status{text-align:center;padding:2rem 1.5rem}',
      '.cm-spinner{display:inline-block;width:32px;height:32px;border:3px solid #334155;border-top-color:#3b82f6;border-radius:50%;animation:cm-spin .8s linear infinite;margin-bottom:1rem}',
      '@keyframes cm-spin{to{transform:rotate(360deg)}}',
      '.cm-status h3{margin:0 0 .5rem;color:#f8fafc;font-size:1rem}',
      '.cm-status p{margin:0;color:#94a3b8;font-size:.875rem;line-height:1.5}',
      '.cm-status .cm-check{font-size:2.5rem;margin-bottom:.5rem}',
      '.cm-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:.75rem;color:#f87171;font-size:.8125rem;margin-bottom:1rem;text-align:center}',
      '.cm-confirm-info{font-size:.75rem;color:#64748b;text-align:center;margin-top:.75rem;line-height:1.5}',
      '.cm-rate-source{font-size:.6875rem;color:#475569;text-align:center;margin-top:.5rem;font-style:italic}',
      '.cm-copy-amount{background:#334155;border:none;color:#94a3b8;padding:.25rem .5rem;border-radius:4px;cursor:pointer;font-size:.6875rem;font-weight:600;margin-left:.5rem}',
      '.cm-copy-amount:hover{background:#475569;color:#f8fafc}',
      '@media(max-width:480px){.crypto-modal{border-radius:12px;margin:.5rem}.cm-body{padding:1rem}.cm-amount{font-size:1.125rem}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ─── Create Modal ───────────────────────────────────────────────────
  function createModal() {
    if (modal) return;
    injectStyles();
    modal = document.createElement('div');
    modal.className = 'crypto-modal-overlay';
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.body.appendChild(modal);
  }

  function closeModal() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function () {
        if (modal) modal.innerHTML = '';
      }, 200);
    }
    currentPayment = null;
  }

  function showModal(html) {
    createModal();
    modal.innerHTML = '<div class="crypto-modal">' + html + '</div>';
    modal.offsetHeight;
    modal.classList.add('active');
  }

  // ─── Step 1: Currency Selection & Price Loading ─────────────────────
  function openCryptoCheckout(productSlug, storeSlug, productName, priceUsd) {
    var selectedCurrency = 'BTC';

    function renderSelector() {
      var currencies = Object.keys(WALLETS);
      var currBtns = currencies.map(function (c) {
        var info = CURRENCY_INFO[c];
        var active = c === selectedCurrency ? ' active' : '';
        return '<button class="cm-curr-btn' + active + '" data-currency="' + c + '" style="--curr-color:' + info.color + '">' +
          '<span class="cm-curr-icon">' + info.icon + '</span>' + c +
          '</button>';
      }).join('');

      var discountedUsd = (priceUsd * (1 - DISCOUNT_PERCENT / 100)).toFixed(2);

      var html =
        '<div class="cm-discount">Save ' + DISCOUNT_PERCENT + '% — Pay $' + discountedUsd + ' instead of $' + priceUsd + '</div>' +
        '<div class="cm-header">' +
          '<h2>Pay with Crypto</h2>' +
          '<button class="cm-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="cm-body">' +
          '<p style="margin:0 0 1rem;font-size:.8125rem;color:#94a3b8;">' + esc(productName) + '</p>' +
          '<div class="cm-currencies">' + currBtns + '</div>' +
          '<div id="cm-loading" style="text-align:center;padding:2rem 0;">' +
            '<div class="cm-spinner"></div>' +
            '<p style="color:#94a3b8;font-size:.875rem;margin:.5rem 0 0">Getting live price...</p>' +
          '</div>' +
        '</div>';

      showModal(html);

      modal.querySelector('.cm-close').addEventListener('click', closeModal);
      modal.querySelectorAll('.cm-curr-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectedCurrency = btn.dataset.currency;
          renderSelector();
          loadAndShowPayment();
        });
      });
      document.addEventListener('keydown', handleEsc);
    }

    function handleEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEsc);
      }
    }

    function loadAndShowPayment() {
      fetchRates(function (rates) {
        var discountedUsd = priceUsd * (1 - DISCOUNT_PERCENT / 100);
        var cryptoAmount = calculateCryptoAmount(discountedUsd, selectedCurrency, rates);
        var wallet = WALLETS[selectedCurrency];
        var expiresAt = new Date(Date.now() + PRICE_LOCK_MINUTES * 60 * 1000);
        var isLive = (cachedRates !== FALLBACK_RATES);

        currentPayment = {
          payment_id: generatePaymentId(),
          product_slug: productSlug,
          store_slug: storeSlug,
          product_name: productName,
          currency: selectedCurrency,
          amount: cryptoAmount,
          wallet_address: wallet,
          price_usd: priceUsd,
          discounted_usd: discountedUsd.toFixed(2),
          discount_percent: DISCOUNT_PERCENT,
          expires_at: expiresAt.toISOString(),
          rate: rates[selectedCurrency]
        };

        showPaymentDetails(currentPayment, productName, priceUsd, isLive);
      });
    }

    renderSelector();
    loadAndShowPayment();
  }

  // ─── Step 2: Show Payment Details ───────────────────────────────────
  function showPaymentDetails(data, productName, originalUsd, isLiveRate) {
    var info = CURRENCY_INFO[data.currency] || CURRENCY_INFO.BTC;
    var wallet = data.wallet_address;
    var amount = data.amount;
    var expiresAt = new Date(data.expires_at);

    var qrContent = '';
    if (data.currency === 'BTC') {
      qrContent = 'bitcoin:' + wallet + '?amount=' + amount;
    } else if (data.currency === 'ETH') {
      qrContent = 'ethereum:' + wallet + '?value=' + amount;
    } else if (data.currency === 'LTC') {
      qrContent = 'litecoin:' + wallet + '?amount=' + amount;
    } else {
      qrContent = wallet;
    }
    var qrHtml = generateQR(qrContent, 4);
    var qrSection = qrHtml
      ? '<div class="cm-qr-wrap"><div class="cm-qr">' + qrHtml + '</div></div>'
      : '';

    var rateLabel = isLiveRate ? 'Live rate' : 'Estimated rate';
    var rateValue = data.rate ? ' (1 ' + data.currency + ' = $' + Number(data.rate).toLocaleString() + ')' : '';

    var html =
      '<div class="cm-discount">Save ' + data.discount_percent + '% — Pay $' + Number(data.discounted_usd).toFixed(2) + ' instead of $' + originalUsd + '</div>' +
      '<div class="cm-header">' +
        '<h2>Pay with ' + info.name + '</h2>' +
        '<button class="cm-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="cm-body">' +
        '<p style="margin:0 0 1rem;font-size:.8125rem;color:#94a3b8;">' + esc(productName) + '</p>' +

        '<div class="cm-amount-box">' +
          '<p class="cm-amount" style="color:' + info.color + '">' + info.icon + ' ' + amount + ' ' + data.currency +
            '<button class="cm-copy-amount" id="cm-copy-amount">Copy</button></p>' +
          '<p class="cm-amount-usd"><s>$' + originalUsd + '</s> $' + Number(data.discounted_usd).toFixed(2) + ' USD</p>' +
          '<p class="cm-rate-source">' + rateLabel + rateValue + '</p>' +
        '</div>' +

        '<div class="cm-address-box">' +
          '<p class="cm-address-label">Send exactly ' + amount + ' ' + data.currency + ' to this address</p>' +
          '<div class="cm-address-row">' +
            '<span class="cm-address">' + esc(wallet) + '</span>' +
            '<button class="cm-copy-btn" id="cm-copy-addr">Copy</button>' +
          '</div>' +
        '</div>' +

        qrSection +

        '<div class="cm-timer" id="cm-timer"></div>' +

        '<hr class="cm-divider">' +

        '<div class="cm-input-group">' +
          '<label for="cm-email">Email (for receipt &amp; download link)</label>' +
          '<input class="cm-input" id="cm-email" type="email" placeholder="you@example.com" autocomplete="email">' +
        '</div>' +

        '<div class="cm-input-group">' +
          '<label for="cm-txhash">Transaction Hash (optional)</label>' +
          '<input class="cm-input" id="cm-txhash" type="text" placeholder="Paste your TX hash after sending..." autocomplete="off">' +
        '</div>' +

        '<div id="cm-error"></div>' +

        '<button class="cm-submit" id="cm-submit-btn">I\'ve Sent the Payment</button>' +

        '<p class="cm-confirm-info">' +
          'Expected confirmation: ~' + info.confirmTime + '. ' +
          'After sending, click the button above. We verify payments on-chain.' +
        '</p>' +
      '</div>' +
      '<div class="cm-footer">Direct wallet payment — no intermediaries, no fees. Verified on-chain.</div>';

    showModal(html);

    modal.querySelector('.cm-close').addEventListener('click', closeModal);
    modal.querySelector('#cm-copy-addr').addEventListener('click', function () {
      copyText(wallet, this);
    });
    var copyAmountBtn = modal.querySelector('#cm-copy-amount');
    if (copyAmountBtn) {
      copyAmountBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(String(amount), this);
      });
    }
    modal.querySelector('#cm-submit-btn').addEventListener('click', submitPayment);

    startCountdown(expiresAt);

    modal.querySelector('#cm-txhash').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitPayment();
    });
  }

  // ─── Countdown Timer ────────────────────────────────────────────────
  function startCountdown(expiresAt) {
    var timerEl = document.getElementById('cm-timer');
    if (!timerEl) return;

    function update() {
      var now = Date.now();
      var diff = expiresAt.getTime() - now;
      if (diff <= 0) {
        timerEl.textContent = 'Price expired — please restart payment';
        timerEl.classList.add('expired');
        if (countdownTimer) clearInterval(countdownTimer);
        return;
      }
      var min = Math.floor(diff / 60000);
      var sec = Math.floor((diff % 60000) / 1000);
      timerEl.textContent = 'Price locked for ' + min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    update();
    countdownTimer = setInterval(update, 1000);
  }

  // ─── Step 3: Submit Payment Confirmation ────────────────────────────
  function submitPayment() {
    var emailInput = document.getElementById('cm-email');
    var txInput = document.getElementById('cm-txhash');
    var errorEl = document.getElementById('cm-error');
    var btn = document.getElementById('cm-submit-btn');

    if (!currentPayment) return;

    btn.disabled = true;
    btn.textContent = 'Processing...';
    errorEl.innerHTML = '';

    var email = emailInput ? emailInput.value.trim() : '';
    var txHash = txInput ? txInput.value.trim() : '';

    // Store payment record in localStorage for reference
    try {
      var payments = JSON.parse(localStorage.getItem('crypto_payments') || '[]');
      payments.push({
        id: currentPayment.payment_id,
        product: currentPayment.product_name,
        store: currentPayment.store_slug,
        currency: currentPayment.currency,
        amount: currentPayment.amount,
        wallet: currentPayment.wallet_address,
        usd: currentPayment.discounted_usd,
        tx_hash: txHash,
        email: email,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('crypto_payments', JSON.stringify(payments));
    } catch (e) { /* localStorage might be unavailable */ }

    showConfirmed(email);
  }

  // ─── Step 4: Confirmed ──────────────────────────────────────────────
  function showConfirmed(email) {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

    var emailNote = email
      ? '<p style="margin-top:.75rem;font-size:.8125rem;color:#94a3b8;">A receipt will be sent to <strong>' + esc(email) + '</strong> once the transaction is verified on-chain.</p>'
      : '';

    var html =
      '<div class="cm-header">' +
        '<h2>Payment Submitted!</h2>' +
        '<button class="cm-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="cm-status">' +
        '<div class="cm-check">&#9989;</div>' +
        '<h3>Thank You!</h3>' +
        '<p>Your payment of <strong>' + currentPayment.amount + ' ' + currentPayment.currency + '</strong> has been recorded.</p>' +
        '<p style="margin-top:.75rem;font-size:.8125rem;color:#94a3b8;">We verify all payments on-chain. Once confirmed, your product will be delivered to your email.</p>' +
        emailNote +
        '<p style="margin-top:1rem;font-size:.75rem;color:#475569;">Payment ID: ' + currentPayment.payment_id + '</p>' +
      '</div>' +
      '<div class="cm-footer">Direct wallet payment — zero fees, verified on-chain.</div>';

    showModal(html);
    modal.querySelector('.cm-close').addEventListener('click', closeModal);
  }

  // ─── Initialization ─────────────────────────────────────────────────
  function init() {
    loadQrLib(function () {});

    document.querySelectorAll('.crypto-pay-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var slug = btn.dataset.productSlug || btn.getAttribute('data-product-slug') || '';
        var store = btn.dataset.storeSlug || btn.getAttribute('data-store-slug') || '';
        var name = btn.dataset.productName || btn.getAttribute('data-product-name') || 'Product';
        var price = parseFloat(btn.dataset.priceUsd || btn.getAttribute('data-price-usd') || '0');
        if (price > 0 && slug) {
          openCryptoCheckout(slug, store, name, price);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.openCryptoCheckout = openCryptoCheckout;
})();
