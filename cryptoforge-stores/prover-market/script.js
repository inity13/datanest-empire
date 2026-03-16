/* ═══════════════════════════════════════════════════════════════════════
   PROVER MARKET — Storefront JavaScript
   CryptoForge Dark Industrial Theme
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Mobile Navigation Toggle ──────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('active');
    });

    // Close nav on link click (mobile)
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('active');
      });
    });
  }

  // ── Smooth Scroll for Anchor Links ─────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Scroll-based Nav Background ────────────────────────────────
  var nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        nav.style.background = 'rgba(13, 13, 26, 0.98)';
      } else {
        nav.style.background = 'rgba(13, 13, 26, 0.9)';
      }
    });
  }

  // ── Product Card Hover Glow ────────────────────────────────────
  document.querySelectorAll('.product-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      card.style.setProperty('--glow-x', x + 'px');
      card.style.setProperty('--glow-y', y + 'px');
    });
  });

  // ── Intersection Observer for Fade-In ──────────────────────────
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(
      '.product-card, .bundle-card, .feature-card, .lead-card, .cross-card'
    ).forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });

    // Add visible styles
    var style = document.createElement('style');
    style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);
  }

  // ── Buy Button Handlers (Stripe Payment Links) ──────────────────────
  document.querySelectorAll('[data-stripe], .product-card [data-product]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      // Get product ID from data-product attribute, or from parent card's data-product
      var productId = this.getAttribute('data-product');
      if (!productId) {
        var card = this.closest('[data-product]');
        if (card) productId = card.getAttribute('data-product');
      }
      // Also check data-stripe for bundle buttons
      if (!productId) {
        var stripe = this.getAttribute('data-stripe');
        if (stripe) productId = stripe;
      }

      // Look up payment link from payment-links.js
      if (typeof PAYMENT_LINKS !== 'undefined' && productId && PAYMENT_LINKS[productId]) {
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

  // ── Console Branding ───────────────────────────────────────────
  console.log(
    '%c PROVER MARKET %c CryptoForge Store #10 ',
    'background: #FF6B00; color: #fff; font-weight: bold; padding: 4px 8px;',
    'background: #1A1A2E; color: #FFD700; padding: 4px 8px;'
  );
})();
