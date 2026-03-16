/* ═══════════════════════════════════════════════════════════════════════
   INDEX LAB — Storefront JavaScript
   Minimal, no build tools, vanilla JS
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Mobile Navigation Toggle ─────────────────────────────────────────
  var mobileToggle = document.getElementById('mobile-toggle');
  var navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });

    // Close nav when clicking a link
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

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

  // ── FAQ Accordion (details/summary) ──────────────────────────────────
  // Auto-close other FAQ items when one is opened
  var faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (this.open) {
        faqItems.forEach(function (other) {
          if (other !== item && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  // ── Scroll Animations ────────────────────────────────────────────────
  if ('IntersectionObserver' in window) {
    var animateTargets = document.querySelectorAll(
      '.product-card, .bundle-card, .feature-card, .free-tool-card, .cross-sell-card'
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

  // ── Nav Shrink on Scroll ─────────────────────────────────────────────
  var nav = document.getElementById('nav');

  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 80) {
        nav.style.borderBottomColor = 'var(--cf-border-light)';
      } else {
        nav.style.borderBottomColor = 'var(--cf-border)';
      }
    }, { passive: true });
  }

})();
