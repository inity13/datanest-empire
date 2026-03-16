/* ============================================================
   CodeVault — Landing Lab Storefront Script
   FAQ accordion, filtering, sorting, scroll animations
   ============================================================ */

(function () {
    'use strict';

    /* ----- FAQ Accordion ----- */
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
                        var otherAns = other.querySelector('.faq-answer');
                        if (otherAns) otherAns.style.maxHeight = '0';
                    }
                });

                // Toggle current
                if (isOpen) {
                    item.classList.remove('open');
                    answer.style.maxHeight = '0';
                } else {
                    item.classList.add('open');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
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

            cards.forEach(function (card) { grid.appendChild(card); });
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
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

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

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = form.querySelector('.newsletter-form__input');
            var btn = form.querySelector('.newsletter-form__btn');
            if (input && btn) {
                btn.textContent = 'Subscribed!';
                btn.disabled = true;
                input.disabled = true;
                input.value = '';
            }
        });
    }

    /* ----- Plausible Custom Events ----- */
    function trackEvent(eventName, props) {
        if (typeof window.plausible === 'function') {
            window.plausible(eventName, { props: props || {} });
        }
    }

    function initTracking() {
        // Track buy button clicks
        document.querySelectorAll('[data-product]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                trackEvent('Buy Click', { product: btn.getAttribute('data-product') });
            });
        });

        // Track filter usage
        document.querySelectorAll('.filter-tag').forEach(function (tag) {
            tag.addEventListener('click', function () {
                trackEvent('Filter Used', { filter: tag.getAttribute('data-filter') });
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
        initTracking();
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
