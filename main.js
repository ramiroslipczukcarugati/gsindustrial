(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------------------------------------------------------
     Nav — sticky solid on scroll + mobile fullscreen menu
     --------------------------------------------------------- */
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var onScroll = function () {
      if (scrollY > 60) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    var burger = $("[data-menu-open]");
    var closeBtn = $("[data-menu-close]");
    var menu = $("[data-mobile-menu]");
    if (!burger || !menu) return;

    function open() { menu.setAttribute("data-open", "true"); document.body.style.overflow = "hidden"; }
    function close() { menu.setAttribute("data-open", "false"); document.body.style.overflow = ""; }

    burger.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    $$("a", menu).forEach(function (a) { a.addEventListener("click", close); });
  }

  /* ---------------------------------------------------------
     Smooth anchor scroll (native)
     --------------------------------------------------------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------------------------------------------------------
     Reveal on scroll — signature effect
     --------------------------------------------------------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;

    if (typeof IntersectionObserver === "undefined") {
      els.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

    els.forEach(function (el, i) {
      el.style.transitionDelay = reduced ? "0s" : Math.min(i % 6, 5) * 0.09 + "s";
      io.observe(el);
    });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* ---------------------------------------------------------
     Hero parallax — subtle, GSAP + ScrollTrigger
     --------------------------------------------------------- */
  function initHeroParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var bg = $(".hero-bg img");
    var content = $(".hero-content");
    if (!bg) return;

    gsap.to(bg, {
      yPercent: reduced ? 6 : 14,
      scale: reduced ? 1.12 : 1.22,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });

    if (content) {
      gsap.to(content, {
        yPercent: reduced ? -6 : -18,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ---------------------------------------------------------
     Contact form — posts to a Google Apps Script Web App via a
     hidden iframe target (avoids CORS; standard pattern for this).
     The submit is NOT prevented for real submissions — the browser
     does the actual POST to the iframe. Apps Script never returns a
     readable response cross-origin, so the "success" state below is
     optimistic by design.
     --------------------------------------------------------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var btn = $("[data-submit-btn]", form);
    var label = $("[data-submit-label]", form);
    var honeypot = form.elements.website;

    function setLabel(text) { if (label) label.textContent = text; }

    form.addEventListener("submit", function (e) {
      if (!form.reportValidity()) { e.preventDefault(); return; }

      if (honeypot && honeypot.value) {
        // Likely a bot: silently drop the submission, fake success.
        e.preventDefault();
        setLabel("¡Listo! Te vamos a responder a la brevedad.");
        form.reset();
        return;
      }

      if (btn) btn.disabled = true;
      setLabel("Enviando…");

      setTimeout(function () {
        setLabel("¡Listo! Te vamos a responder a la brevedad.");
        form.reset();
        setTimeout(function () {
          setLabel("Enviar mensaje");
          if (btn) btn.disabled = false;
        }, 4000);
      }, 1300);
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    safe(initNav, "initNav");
    safe(initMobileMenu, "initMobileMenu");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initContactForm, "initContactForm");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_e) {}
      safe(initHeroParallax, "initHeroParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
