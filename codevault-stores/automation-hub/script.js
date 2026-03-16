/**
 * Automation Hub — Storefront JavaScript
 * CodeVault Empire — No external dependencies. Vanilla JS only.
 */

(function () {
  'use strict';

  // =========================================================================
  // FAQ Accordion
  // =========================================================================
  const FaqAccordion = {
    init() {
      document.querySelectorAll('.faq-item').forEach((item) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!question || !answer) return;

        question.addEventListener('click', () => {
          const isOpen = item.classList.contains('active');

          // Close all others
          document.querySelectorAll('.faq-item.active').forEach((other) => {
            if (other !== item) {
              other.classList.remove('active');
              const otherAnswer = other.querySelector('.faq-answer');
              if (otherAnswer) otherAnswer.style.maxHeight = '0';
              other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
            }
          });

          // Toggle current
          if (isOpen) {
            item.classList.remove('active');
            answer.style.maxHeight = '0';
            question.setAttribute('aria-expanded', 'false');
          } else {
            item.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            question.setAttribute('aria-expanded', 'true');
          }
        });
      });
    },
  };

  // =========================================================================
  // Scroll Reveal Animations (IntersectionObserver)
  // =========================================================================
  const ScrollReveal = {
    init() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Show everything immediately if reduced motion preferred
        document.querySelectorAll('.fade-in').forEach((el) => el.classList.add('visible'));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );

      document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    },
  };

  // =========================================================================
  // Product Filter + Sort
  // =========================================================================
  const ProductFilter = {
    activeFilter: 'all',

    init() {
      const tags = document.querySelectorAll('.filter-tag');
      const sortSelect = document.querySelector('.sort-select');

      tags.forEach((tag) => {
        tag.addEventListener('click', () => {
          tags.forEach((t) => t.classList.remove('active'));
          tag.classList.add('active');
          this.activeFilter = tag.dataset.filter || 'all';
          this.apply();

          // Plausible custom event
          if (typeof window.plausible === 'function') {
            window.plausible('Filter', { props: { tag: this.activeFilter } });
          }
        });
      });

      if (sortSelect) {
        sortSelect.addEventListener('change', () => this.sort(sortSelect.value));
      }
    },

    apply() {
      const cards = document.querySelectorAll('#product-grid .product-card');
      cards.forEach((card) => {
        const tags = (card.dataset.tags || '').split(',');
        const show = this.activeFilter === 'all' || tags.includes(this.activeFilter);
        card.style.display = show ? '' : 'none';
      });
    },

    sort(mode) {
      const grid = document.getElementById('product-grid');
      if (!grid) return;

      const cards = Array.from(grid.querySelectorAll('.product-card:not(.product-card--bundle)'));

      if (mode === 'price-asc') {
        cards.sort((a, b) => parseInt(a.dataset.price || 0) - parseInt(b.dataset.price || 0));
      } else if (mode === 'price-desc') {
        cards.sort((a, b) => parseInt(b.dataset.price || 0) - parseInt(a.dataset.price || 0));
      } else {
        return; // default — leave as-is
      }

      // Re-append non-bundle cards after bundles
      const bundles = Array.from(grid.querySelectorAll('.product-card--bundle'));
      bundles.forEach((b) => grid.appendChild(b));
      cards.forEach((c) => grid.appendChild(c));
    },
  };

  // =========================================================================
  // Smooth Scroll for Anchor Links
  // =========================================================================
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;
          const target = document.querySelector(targetId);
          if (!target) return;

          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;

          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          history.pushState(null, null, targetId);
        });
      });
    },
  };

  // =========================================================================
  // (old buy handler removed — replaced by PAYMENT_LINKS integration)
          }
        });
      });
    },
  };

  // =========================================================================
  // Initialize All Modules
  // =========================================================================
  function init() {
    FaqAccordion.init();
    ScrollReveal.init();
    ProductFilter.init();
    SmoothScroll.init();
    BuyTracking.init();
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
