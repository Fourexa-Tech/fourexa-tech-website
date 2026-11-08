(function () {
  const cfg = window.siteConfig;

  /* ---------------- HEADER ---------------- */
  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const current = document.body.getAttribute("data-page");

    const navLinks = cfg.nav
      .map((item) => {
        const isCurrent = item.href.replace(".html", "") === current;
        return `<a href="${item.href}" ${isCurrent ? 'aria-current="page"' : ""}>${item.label}</a>`;
      })
      .join("");

    mount.innerHTML = `
      <div class="nav">
        <a href="index.html" class="brand" aria-label="Fourexa Tech — home">
          <img src="assets/logo-icon.png" alt="Fourexa Tech" width="34" height="28">
          <span>FOUREXA TECH</span>
        </a>
        <nav class="links" aria-label="Primary">
          ${navLinks}
        </nav>
        <a href="contact.html" class="nav-cta">${cfg.ctaLabel}</a>
        <button class="menu-btn" id="menuOpenBtn" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div class="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Site menu">
        <div class="mobile-menu-top">
          <a href="index.html" class="brand" aria-label="Fourexa Tech — home">
            <img src="assets/logo-icon.png" alt="Fourexa Tech" width="30" height="25">
            <span>FOUREXA TECH</span>
          </a>
          <button class="mobile-menu-close" id="menuCloseBtn" aria-label="Close menu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
          </button>
        </div>
        <nav class="mobile-menu-links" aria-label="Mobile">
          <a href="index.html" ${current === "home" ? 'aria-current="page"' : ""}>Home</a>
          ${cfg.nav.map((item) => {
            const isCurrent = item.href.replace(".html", "") === current;
            return `<a href="${item.href}" ${isCurrent ? 'aria-current="page"' : ""}>${item.label}</a>`;
          }).join("")}
          <a href="contact.html" ${current === "contact" ? 'aria-current="page"' : ""}>Contact</a>
        </nav>
        <div class="mobile-menu-cta">
          <a href="contact.html">${cfg.ctaLabel}</a>
        </div>
      </div>
    `;

    const menu = document.getElementById("mobileMenu");
    // The header uses backdrop-filter, which traps position:fixed children
    // inside the header box. Moving the menu to <body> pins it to the screen.
    document.body.appendChild(menu);
    const openBtn = document.getElementById("menuOpenBtn");
    const closeBtn = document.getElementById("menuCloseBtn");

    function openMenu() {
      menu.classList.add("open");
      document.body.classList.add("menu-open");
      openBtn.setAttribute("aria-expanded", "true");
      closeBtn.focus();
    }
    function closeMenu() {
      menu.classList.remove("open");
      document.body.classList.remove("menu-open");
      openBtn.setAttribute("aria-expanded", "false");
      openBtn.focus();
    }
    openBtn.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) closeMenu();
    });
  }

  /* ---------------- FOOTER ---------------- */
  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;

    const footerLinks = cfg.footerNav.map((item) => `<a href="${item.href}">${item.label}</a>`).join("");

    const channels = [];
    if (cfg.contact.email) channels.push(`<a href="mailto:${cfg.contact.email}">${cfg.contact.email}</a>`);
    if (cfg.contact.whatsapp) channels.push(`<a href="https://wa.me/${cfg.contact.whatsapp.replace(/\D/g, "")}">WhatsApp</a>`);
    if (cfg.contact.phone) channels.push(`<a href="tel:${cfg.contact.phone}">${cfg.contact.phone}</a>`);

    const socials = [];
    if (cfg.social.linkedin) socials.push(`<a href="${cfg.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`);
    if (cfg.social.instagram) socials.push(`<a href="${cfg.social.instagram}" target="_blank" rel="noopener">Instagram</a>`);
    if (cfg.social.facebook) socials.push(`<a href="${cfg.social.facebook}" target="_blank" rel="noopener">Facebook</a>`);

    mount.innerHTML = `
      <div class="wrap">
        <div class="foot-top">
          <div>
            <a href="index.html" class="foot-brand">
              <img src="assets/logo-icon.png" alt="Fourexa Tech" width="28" height="23">
              <span>FOUREXA TECH</span>
            </a>
            <p class="foot-tag">${cfg.company.description}</p>
          </div>
          <div class="foot-col">
            <h5>Company</h5>
            ${footerLinks}
          </div>
          <div class="foot-col">
            <h5>Contact</h5>
            ${channels.length ? channels.join("") : `<span style="color:var(--ink-faint);font-size:0.9rem;">Contact details coming soon</span>`}
          </div>
          <div class="foot-col">
            <h5>Follow</h5>
            ${socials.length ? socials.join("") : `<span style="color:var(--ink-faint);font-size:0.9rem;">Social links coming soon</span>`}
          </div>
        </div>
        <div class="foot-bottom">
          <span>&copy; ${new Date().getFullYear()} Fourexa Tech. ${cfg.company.tagline}</span>
          <div class="foot-social">${socials.length ? socials.join("") : ""}</div>
        </div>
      </div>
    `;
  }

  /* ---------------- PROCESS LINE (scroll-triggered fill) ---------------- */
  function initProcessLine() {
    const tracks = document.querySelectorAll(".process-track");
    if (!tracks.length) return;
    if (!("IntersectionObserver" in window)) {
      tracks.forEach((t) => t.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    tracks.forEach((t) => io.observe(t));
  }

  /* ---------------- SHOW MORE / PROGRESSIVE DISCLOSURE ---------------- */
  function initShowMore() {
    document.querySelectorAll(".show-more-btn[data-reveal-target]").forEach((btn) => {
      const group = btn.getAttribute("data-reveal-target");
      const items = document.querySelectorAll(`[data-reveal-group="${group}"]`);
      const moreLabel = btn.getAttribute("data-more-label") || "Show more";
      const lessLabel = btn.getAttribute("data-less-label") || "Show less";
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        items.forEach((item) => {
          if (expanded) item.setAttribute("hidden", "");
          else item.removeAttribute("hidden");
        });
        btn.setAttribute("aria-expanded", String(!expanded));
        btn.textContent = expanded ? moreLabel + " ↓" : lessLabel + " ↑";
      });
    });
  }

  /* ---------------- FAQ ACCORDION ---------------- */
  function initFaq() {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const q = item.querySelector(".faq-q");
      const a = item.querySelector(".faq-a");
      if (!q || !a) return;
      const panelId = a.id || "faq-panel-" + Math.random().toString(36).slice(2, 8);
      a.id = panelId;
      q.setAttribute("aria-expanded", "false");
      q.setAttribute("aria-controls", panelId);
      q.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach((o) => {
          o.classList.remove("open");
          o.querySelector(".faq-a").style.maxHeight = null;
          o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
          q.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------------- WORK MODAL ---------------- */
  function initWorkModal() {
    const overlay = document.getElementById("workModal");
    if (!overlay) return;
    const panel = overlay.querySelector(".modal-panel");
    let lastFocused = null;

    function openModal(data) {
      lastFocused = document.activeElement;
      panel.innerHTML = `
        <button class="modal-close" id="modalCloseBtn" aria-label="Close project details">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
        </button>
        <span class="work-tag modal-tag">${data.tag || "Concept Project"}</span>
        <h3 id="modalTitle">${data.title}</h3>
        <div class="modal-block"><h5>Problem</h5><p>${data.problem}</p></div>
        <div class="modal-block"><h5>Proposed solution</h5><p>${data.solution}</p></div>
        <div class="modal-block"><h5>Technology / system</h5><p>${data.tech}</p></div>
        <div class="modal-block"><h5>How it works</h5><p>${data.how}</p></div>
        <div class="modal-block"><h5>Business benefit</h5><p>${data.benefit}</p></div>
        <div class="modal-cta"><a href="contact.html" class="btn-primary">Discuss something like this</a></div>
      `;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("menu-open");
      document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
      panel.querySelector(".btn-primary").focus();
      history.replaceState(null, "", "#" + data.slug);
    }

    function closeModal() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("menu-open");
      history.replaceState(null, "", location.pathname);
      if (lastFocused) lastFocused.focus();
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });

    document.querySelectorAll("[data-work-item]").forEach((card) => {
      card.addEventListener("click", () => {
        const slug = card.getAttribute("data-work-item");
        const data = window.workProjects && window.workProjects[slug];
        if (data) openModal(data);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    });

    // deep link support: work.html#restaurant-digital-system
    const hash = location.hash.replace("#", "");
    if (hash && window.workProjects && window.workProjects[hash]) {
      openModal(window.workProjects[hash]);
    }
  }

  /* ---------------- CONTACT FORM ---------------- */
  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    const statusBox = document.getElementById("formStatus");
    const submitBtn = form.querySelector('button[type="submit"]');

    // Delivery-date guardrail: compute "today" fresh on every page load
    // (never hardcoded) and use it both to disable past dates in the
    // native date picker AND to re-check on submit, since a date can
    // still be typed manually and bypass the picker's own restriction.
    const dateInput = form.elements["deliveryDate"];
    function todayStr() {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    if (dateInput) dateInput.min = todayStr();

    const validators = {
      name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name."),
      company: (v) => (v.trim().length >= 1 ? "" : "Please enter your business or company name."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address."),
      problem: (v) => (v.trim().length >= 10 ? "" : "Tell us a little more about the problem (10+ characters)."),
      service: (v) => (v ? "" : "Please select what you need help with."),
      // Optional field — only validated if the visitor filled it in.
      deliveryDate: (v) => {
        if (!v) return "";
        return v >= todayStr() ? "" : "Please select today or a future date.";
      },
    };

    function showFieldError(field, message) {
      const input = form.elements[field];
      const errorEl = form.querySelector(`[data-error-for="${field}"]`);
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) errorEl.textContent = message;
    }

    function validateField(field) {
      const input = form.elements[field];
      if (!input || !validators[field]) return true;
      const message = validators[field](input.value);
      showFieldError(field, message);
      return !message;
    }

    Object.keys(validators).forEach((field) => {
      const input = form.elements[field];
      if (input) input.addEventListener("blur", () => validateField(field));
    });

    function setStatus(type, message) {
      statusBox.className = "form-status show " + type;
      statusBox.textContent = message;
      statusBox.setAttribute("role", "status");
    }
    function clearStatus() {
      statusBox.className = "form-status";
      statusBox.textContent = "";
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearStatus();

      const fields = Object.keys(validators);
      const valid = fields.map(validateField).every(Boolean);
      if (!valid) {
        setStatus("error", "Please fix the highlighted fields and try again.");
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      const payload = Object.fromEntries(new FormData(form).entries());

      submitBtn.disabled = true;
      submitBtn.setAttribute("data-loading", "true");
      submitBtn.querySelector(".btn-label").textContent = "Sending...";

      try {
        const res = await fetch(cfg.api.contactEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Request failed with status " + res.status);
        }

        setStatus("success", "Thanks — your request has been received. We'll get back to you soon.");
        form.reset();
      } catch (err) {
        setStatus(
          "error",
          "Something went wrong. Please try again, or email us directly at " +
            (cfg.contact.email || "the address below") +
            "."
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("data-loading");
        submitBtn.querySelector(".btn-label").textContent = "Start the Conversation";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    initShowMore();
    initProcessLine();
    initFaq();
    initWorkModal();
    initContactForm();
  });
})();
