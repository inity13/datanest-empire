/* ============================================================
   CodeVault — Form Forge Storefront Script
   FAQ accordion, filtering, sorting, scroll animations,
   newsletter guard, license tier toggle
   ============================================================ */

(function () {
    'use strict';

    /* ----- FAQ Accordion (single-open) ----- */
    function initFaq() {
        var items = document.querySelectorAll('.faq-item');
        items.forEach(function (item) {
            var question = item.querySelector('.faq-question');
            var answer = item.querySelector('.faq-answer');
            if (!question || !answer) return;

            question.addEventListener('click', function () {
                var isOpen = item.classList.contains('open');

                // Close all other items
                items.forEach(function (other) {
                    if (other !== item) {
                        other.classList.remove('open');
                        var otherBtn = other.querySelector('.faq-question');
                        var otherAns = other.querySelector('.faq-answer');
                        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                        if (otherAns) {
                            otherAns.style.maxHeight = '0';
                            otherAns.setAttribute('aria-hidden', 'true');
                        }
                    }
                });

                // Toggle current
                if (isOpen) {
                    item.classList.remove('open');
                    question.setAttribute('aria-expanded', 'false');
                    answer.style.maxHeight = '0';
                    answer.setAttribute('aria-hidden', 'true');
                } else {
                    item.classList.add('open');
                    question.setAttribute('aria-expanded', 'true');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    answer.setAttribute('aria-hidden', 'false');
                }
            });
        });
    }

    /* ----- Product Filter by Tag ----- */
    function initFilters() {
        var filterTags = document.querySelectorAll('.filter-tag');
        var cards = document.querySelectorAll('.product-card');

        filterTags.forEach(function (tag) {
            tag.addEventListener('click', function () {
                var filter = tag.getAttribute('data-filter');

                // Toggle active class
                if (tag.classList.contains('active') && filter !== 'all') {
                    tag.classList.remove('active');
                    filter = 'all';
                    filterTags.forEach(function (t) {
                        t.classList.toggle('active', t.getAttribute('data-filter') === 'all');
                    });
                } else {
                    filterTags.forEach(function (t) { t.classList.remove('active'); });
                    tag.classList.add('active');
                }

                cards.forEach(function (card) {
                    if (filter === 'all') {
                        card.style.display = '';
                        return;
                    }
                    var cardTags = (card.getAttribute('data-tags') || '').split(',');
                    card.style.display = cardTags.indexOf(filter) !== -1 ? '' : 'none';
                });
            });
        });
    }

    /* ----- Price Sorting ----- */
    function initSorting() {
        var sortSelect = document.querySelector('.sort-select');
        if (!sortSelect) return;

        sortSelect.addEventListener('change', function () {
            var grid = document.querySelector('.product-grid');
            if (!grid) return;

            var cards = Array.from(grid.querySelectorAll('.product-card'));
            var sortValue = sortSelect.value;

            cards.sort(function (a, b) {
                var priceA = parseInt(a.getAttribute('data-price') || '0', 10);
                var priceB = parseInt(b.getAttribute('data-price') || '0', 10);
                var bundleA = a.classList.contains('product-card--bundle') ? 1 : 0;
                var bundleB = b.classList.contains('product-card--bundle') ? 1 : 0;

                // Bundles always at top
                if (bundleA !== bundleB) return bundleB - bundleA;

                if (sortValue === 'price-asc') return priceA - priceB;
                if (sortValue === 'price-desc') return priceB - priceA;
                return 0; // 'default' keeps original order
            });

            cards.forEach(function (card) {
                grid.appendChild(card);
            });
        });
    }

    /* ----- Lazy-Load Fade-In Animations ----- */
    function initScrollAnimations() {
        var elements = document.querySelectorAll('.fade-in');
        if (!elements.length) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(function (el) { el.classList.add('visible'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        elements.forEach(function (el) { observer.observe(el); });
    }

    /* ----- Smooth Scroll for Anchor Links ----- */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /* ----- Newsletter Form Guard ----- */
    function initNewsletter() {
        var form = document.querySelector('.newsletter-form');
        if (!form) return;

        var statusEl = form.parentElement.querySelector('.newsletter-form__status');

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = form.querySelector('input[type="email"]');
            if (!email || !email.value) return;

            // Simple client-side guard: disable double-submit
            var btn = form.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            if (statusEl) statusEl.textContent = 'Subscribing...';

            // POST to ConvertKit via fetch (or let native form submit as fallback)
            var action = form.getAttribute('action');
            fetch(action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_address: email.value })
            })
            .then(function () {
                if (statusEl) statusEl.textContent = 'You\'re in! Check your inbox.';
                email.value = '';
            })
            .catch(function () {
                // Fallback: submit the form natively
                form.submit();
            })
            .finally(function () {
                if (btn) btn.disabled = false;
            });
        });
    }

    /* ----- License Tier Toggle ----- */
    function initLicenseTiers() {
        var cards = document.querySelectorAll('.license-card');
        var priceEls = document.querySelectorAll('.product-card__price');
        var cryptoBtns = document.querySelectorAll('.btn--crypto');
        var stripeBtns = document.querySelectorAll('[data-stripe-link]');

        if (!cards.length) return;

        // Store original prices from data attributes
        var originalPrices = [];
        document.querySelectorAll('.product-card').forEach(function (card) {
            originalPrices.push({
                el: card,
                price: parseInt(card.getAttribute('data-price') || '0', 10)
            });
        });

        cards.forEach(function (card) {
            card.addEventListener('click', function () {
                // Update active state
                cards.forEach(function (c) { c.classList.remove('active'); });
                card.classList.add('active');

                var multiplier = parseInt(card.getAttribute('data-multiplier') || '1', 10);

                // Update displayed prices
                originalPrices.forEach(function (item) {
                    var newPrice = item.price * multiplier;
                    var displayPrice = (newPrice / 100).toFixed(2);
                    var cryptoPrice = (newPrice * 0.8 / 100).toFixed(2);

                    // Update price display on the card
                    var priceEl = item.el.querySelector('.product-card__price');
                    if (priceEl) priceEl.textContent = '$' + displayPrice;

                    // Update crypto button text
                    var cryptoBtn = item.el.querySelector('.btn--crypto');
                    if (cryptoBtn) {
                        var productName = cryptoBtn.getAttribute('data-crypto-product');
                        cryptoBtn.setAttribute('data-crypto-price', newPrice);
                        cryptoBtn.textContent = 'Pay with Crypto ($' + cryptoPrice + ')';
                    }
                });
            });
        });
    }

    /* ----- Initialize Everything ----- */
    function init() {
        initFaq();
        initFilters();
        initSorting();
        initScrollAnimations();
        initSmoothScroll();
        initNewsletter();
        initLicenseTiers();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

  // ── Buy Button Handlers (Stripe Payment Links) ──────────────────────
  document.querySelectorAll('[data-product]').forEach(function (el) {
    // Find buy buttons inside product cards
    var btns = el.querySelectorAll('button, .btn, [data-stripe-link]');
    if (btns.length === 0 && el.tagName === 'BUTTON') btns = [el];
    btns.forEach(function (btn) {
      if (btn.textContent.match(/buy|get|purchase|add to cart/i) || btn.hasAttribute('data-stripe-link')) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var card = this.closest('[data-product]');
          var productId = card ? card.getAttribute('data-product') : null;
          if (!productId) productId = this.getAttribute('data-product');

          if (typeof PAYMENT_LINKS !== 'undefined' && productId && PAYMENT_LINKS[productId]) {
            window.open(PAYMENT_LINKS[productId], '_blank');
          } else {
            var orig = this.textContent;
            this.textContent = 'Coming Soon!';
            this.style.pointerEvents = 'none';
            var self = this;
            setTimeout(function () { self.textContent = orig; self.style.pointerEvents = ''; }, 2000);
          }
        });
      }
    });
  });

})();
