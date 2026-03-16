/* ============================================================
   Neon Bazaar — Storefront Script
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

    /* ----- Initialize Everything ----- */
    function init() {
        initFaq();
        initFilters();
        initSorting();
        initScrollAnimations();
        initSmoothScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
