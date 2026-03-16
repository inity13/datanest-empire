/**
 * Deploy Kit — Storefront JavaScript
 * CodeVault Empire — No external dependencies. Vanilla JS only.
 */

(function () {
  'use strict';

  // =========================================================================
  // Dark / Light Mode Toggle
  // =========================================================================
  const ThemeManager = {
    STORAGE_KEY: 'codevault-deploy-kit-theme',

    init() {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      // Default to dark — CodeVault is a dark-first brand
      const theme = saved || 'dark';
      this.apply(theme);

      document.querySelectorAll('.theme-toggle').forEach((btn) => {
        btn.addEventListener('click', () => this.toggle());
      });
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    },

    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      this.apply(current === 'dark' ? 'light' : 'dark');
    },
  };

  // =========================================================================
  // Mobile Navigation Toggle
  // =========================================================================
  const MobileNav = {
    init() {
      const btn = document.getElementById('mobile-menu-btn');
      const nav = document.getElementById('mobile-nav');
      if (!btn || !nav) return;

      btn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('active');
        btn.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      // Close on link click
      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          nav.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
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
  // Scroll Reveal Animations (IntersectionObserver)
  // =========================================================================
  const ScrollReveal = {
    init() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    },
  };

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
  // Header Scroll Effect
  // =========================================================================
  const HeaderScroll = {
    init() {
      const header = document.querySelector('.site-header');
      if (!header) return;

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            header.classList.toggle('scrolled', window.scrollY > 50);
            ticking = false;
          });
          ticking = true;
        }
      });
    },
  };

  // =========================================================================
  // License Tier Selector
  // =========================================================================
  const LicenseTiers = {
    multipliers: { personal: 1, team: 2, enterprise: 4 },

    init() {
      const buttons = document.querySelectorAll('[data-tier]');
      if (!buttons.length) return;

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const tier = btn.dataset.tier;
          buttons.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.updatePrices(tier);
        });
      });
    },

    updatePrices(tier) {
      const mult = this.multipliers[tier] || 1;
      document.querySelectorAll('[data-base-price]').forEach((el) => {
        const base = parseFloat(el.dataset.basePrice);
        const adjusted = (base * mult).toFixed(2);
        // Update display — find the price number only
        const priceNum = el.querySelector('.price-num');
        if (priceNum) {
          priceNum.textContent = adjusted;
        }
      });
    },
  };

  // =========================================================================
  // Cross-Nav Store Dropdown
  // =========================================================================
  const CrossNav = {
    init() {
      const toggle = document.querySelector('.cross-nav-toggle');
      const dropdown = document.querySelector('.cross-nav-dropdown');
      if (!toggle || !dropdown) return;

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('active');
      });
    },
  };

  // =========================================================================
  // Initialize All Modules
  // =========================================================================
  function init() {
    ThemeManager.init();
    MobileNav.init();
    SmoothScroll.init();
    ScrollReveal.init();
    FaqAccordion.init();
    HeaderScroll.init();
    LicenseTiers.init();
    CrossNav.init();
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
