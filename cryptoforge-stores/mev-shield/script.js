/* ═══════════════════════════════════════════════════════════════════════
   MEV SHIELD — Storefront JavaScript
   Minimal, no build tools, vanilla JS
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Mobile Navigation Toggle ─────────────────────────────────────────
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

  // ── Product Category Filtering ───────────────────────────────────────
  var filterButtons = document.querySelectorAll('.filter-btn');
  var productCards = document.querySelectorAll('.product-card');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = this.getAttribute('data-filter');

      filterButtons.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');

      productCards.forEach(function (card) {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // ── Buy Button Handlers (Stripe Payment Links) ──────────────────────
  var buyButtons = document.querySelectorAll('[data-product]');

  buyButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var productId = this.getAttribute('data-product');

      // Look up payment link from payment-links.js
      if (typeof PAYMENT_LINKS !== 'undefined' && PAYMENT_LINKS[productId]) {
        window.open(PAYMENT_LINKS[productId], '_blank');
      } else {
        // Fallback if payment link not found
        console.log('Purchase initiated for:', productId);
        var originalText = this.textContent;
        this.textContent = 'Coming Soon!';
        this.style.pointerEvents = 'none';
        var self = this;
        setTimeout(function () {
          self.textContent = originalText;
          self.style.pointerEvents = '';
        }, 2000);
      }
    });
  });

  // ── Lead Magnet Form Handlers ────────────────────────────────────────
  var leadForms = document.querySelectorAll('.lm-form');

  leadForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var magnet = this.getAttribute('data-magnet');
      var email = this.querySelector('.lm-input').value;

      if (!email) return;

      console.log('Lead magnet requested:', magnet, 'Email:', email);

      var submitBtn = this.querySelector('button');
      submitBtn.textContent = 'Check your email!';
      submitBtn.style.background = '#00E676';

      setTimeout(function () {
        submitBtn.textContent = 'Download Free';
        submitBtn.style.background = '';
      }, 3000);
    });
  });

  // ── Scroll Animations ────────────────────────────────────────────────
  if ('IntersectionObserver' in window) {
    var animateTargets = document.querySelectorAll(
      '.product-card, .bundle-card, .feature-card, .lead-magnet-card, .cross-sell-card'
    );

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animateTargets.forEach(function (el) {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  // ── Smooth Scroll for Anchor Links ───────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
