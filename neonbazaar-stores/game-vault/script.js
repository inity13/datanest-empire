/* ============================================================
   Neon Bazaar — Storefront Script
   FAQ accordion, filtering, sorting, scroll animations,
   theme toggle, mobile menu, email capture, page view analytics
   ============================================================ */

(function () {
    'use strict';

    var SUPABASE_URL = 'https://ferovwapilhcpqozqinn.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcm92d2FwaWxoY3Bxb3pxaW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTU3NTYsImV4cCI6MjA4ODU5MTc1Nn0.RhBBxPaAw5Fyzal5m3GY_sdxiIAp_RVJ_ki8CUgPnRY';
    var STORE_SLUG = 'game-vault';

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
                    // Also set 'All' as active
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
            // Fallback: show everything immediately
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

    /* ----- Dark/Light Theme Toggle ----- */
    function initThemeToggle() {
        var btn = document.getElementById('nb-theme-toggle');
        if (!btn) return;
        var body = document.body;
        var stored = localStorage.getItem('nb-theme');
        if (stored === 'light') {
            body.classList.add('nb-light');
            btn.textContent = '\u2600\uFE0F';
        }
        btn.addEventListener('click', function () {
            body.classList.toggle('nb-light');
            var isLight = body.classList.contains('nb-light');
            btn.textContent = isLight ? '\u2600\uFE0F' : '\uD83C\uDF19';
            localStorage.setItem('nb-theme', isLight ? 'light' : 'dark');
        });
    }

    /* ----- Mobile Menu ----- */
    function initMobileMenu() {
        var openBtn = document.getElementById('nb-hamburger');
        var nav = document.getElementById('nb-mobile-nav');
        if (!openBtn || !nav) return;
        var closeBtn = nav.querySelector('.nb-mobile-nav__close');

        openBtn.addEventListener('click', function () { nav.classList.add('open'); });
        if (closeBtn) closeBtn.addEventListener('click', function () { nav.classList.remove('open'); });
        nav.querySelectorAll('.nb-mobile-nav__link').forEach(function (link) {
            link.addEventListener('click', function () { nav.classList.remove('open'); });
        });
    }

    /* ----- Email Capture Bar ----- */
    function initEmailBar() {
        var bar = document.getElementById('nb-email-bar');
        if (!bar) return;
        if (localStorage.getItem('nb-email-dismissed') === '1') {
            bar.classList.add('nb-hidden');
            return;
        }
        // Show after 3 second delay
        setTimeout(function () { bar.classList.remove('nb-hidden'); }, 3000);

        var form = bar.querySelector('.nb-email-bar__form');
        var input = bar.querySelector('.nb-email-bar__input');
        var dismiss = bar.querySelector('.nb-email-bar__dismiss');

        if (dismiss) {
            dismiss.addEventListener('click', function () {
                bar.classList.add('nb-hidden');
                localStorage.setItem('nb-email-dismissed', '1');
            });
        }

        if (form && input) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var email = input.value.trim();
                if (!email || email.indexOf('@') === -1) return;

                fetch(SUPABASE_URL + '/rest/v1/email_subscribers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        email: email,
                        store_name: STORE_SLUG,
                        source: 'neon-bazaar'
                    })
                }).then(function () {
                    var msgEl = bar.querySelector('.nb-email-bar__msg');
                    if (msgEl) msgEl.textContent = "You're in! Welcome to the bazaar.";
                    input.style.display = 'none';
                    var submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.style.display = 'none';
                    localStorage.setItem('nb-email-dismissed', '1');
                    setTimeout(function () { bar.classList.add('nb-hidden'); }, 4000);
                }).catch(function () {
                    var msgEl = bar.querySelector('.nb-email-bar__msg');
                    if (msgEl) msgEl.textContent = 'Something went wrong. Try again?';
                });
            });
        }
    }

    /* ----- Supabase Page View Analytics ----- */
    function trackPageView() {
        if (!SUPABASE_URL || !SUPABASE_KEY) return;
        try {
            fetch(SUPABASE_URL + '/rest/v1/page_views', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    store_name: STORE_SLUG,
                    page: window.location.pathname,
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent
                })
            });
        } catch (e) { /* fire-and-forget */ }
    }

    /* ----- Initialize Everything ----- */
    function init() {
        initFaq();
        initFilters();
        initSorting();
        initScrollAnimations();
        initSmoothScroll();
        initThemeToggle();
        initMobileMenu();
        initEmailBar();
        trackPageView();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
