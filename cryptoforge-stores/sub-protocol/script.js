/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  sub-protocol Storefront — JavaScript                           ║
 * ║  CryptoForge Store #5                                           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

(function () {
    "use strict";

    // ── Product Filter Tabs ────────────────────────────────────────

    const filterTabs = document.querySelectorAll(".filter-tab");
    const productCards = document.querySelectorAll(".product-card");

    filterTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const filter = tab.dataset.filter;

            // Update active tab
            filterTabs.forEach((t) => t.classList.remove("filter-tab--active"));
            tab.classList.add("filter-tab--active");

            // Filter products
            productCards.forEach((card) => {
                if (filter === "all") {
                    card.classList.remove("product-card--hidden");
                } else {
                    const tags = card.dataset.tags || "";
                    const matches = tags.includes(filter);
                    card.classList.toggle("product-card--hidden", !matches);
                }
            });
        });
    });

    // ── Scroll-based Nav Background ────────────────────────────────

    const nav = document.getElementById("nav");

    function updateNav() {
        if (window.scrollY > 50) {
            nav.style.background = "rgba(13, 13, 26, 0.95)";
        } else {
            nav.style.background = "rgba(13, 13, 26, 0.8)";
        }
    }

    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();

    // ── Smooth Scroll for Anchor Links ─────────────────────────────

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetId = anchor.getAttribute("href");
            if (targetId === "#") return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = nav.offsetHeight;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
                window.scrollTo({ top: targetPos, behavior: "smooth" });
            }
        });
    });

    // ── Lead Magnet Forms ──────────────────────────────────────────

    const magnetForms = document.querySelectorAll(".lead-magnet-card__form");

    magnetForms.forEach((form) => {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const magnet = form.dataset.magnet;
            const input = form.querySelector(".lead-magnet-card__input");
            const email = input.value.trim();

            if (!email || !email.includes("@")) return;

            // Track event
            if (window.plausible) {
                window.plausible("Lead Magnet", {
                    props: { magnet, email_domain: email.split("@")[1] },
                });
            }

            // Show success state
            const btn = form.querySelector(".btn");
            const originalText = btn.textContent;
            btn.textContent = "Sent!";
            btn.style.background = "#00CC88";
            input.value = "";
            input.placeholder = "Check your inbox";

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = "";
                input.placeholder = "you@example.com";
            }, 3000);

            // In production: POST to email service
            console.log(`[sub-protocol] Lead magnet "${magnet}" requested by ${email}`);
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

    // ── Intersection Observer for Animations ───────────────────────

    const animateOnScroll = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    animateOnScroll.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    // Apply initial hidden state and observe
    document.querySelectorAll(
        ".product-card, .bundle-card, .feature-card, .lead-magnet-card, .cross-sell-card"
    ).forEach((card) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        animateOnScroll.observe(card);
    });
})();
