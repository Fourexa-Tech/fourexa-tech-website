
/* =========================================
   FOUREXA TECH - SWARM REBUILD ENGINE
   Independent vanilla JavaScript feature
========================================= */

(() => {
  "use strict";

  function initSwarmRebuild() {
    // Homepage only for the first implementation
    if (document.body.dataset.page !== "home") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Keep the feature available, but use a shorter animation.
    }

    // Avoid duplicate initialization
    if (document.getElementById("swarm-rebuild-trigger")) return;

    const trigger = document.createElement("button");
    trigger.id = "swarm-rebuild-trigger";
    trigger.type = "button";
    trigger.innerHTML = `
      <span class="swarm-spark" aria-hidden="true">✦</span>
      Rebuild this website
    `;
    trigger.setAttribute("aria-label", "Watch the website rebuild");

    const overlay = document.createElement("div");
    overlay.id = "swarm-rebuild-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const preview = document.createElement("div");
    preview.className = "swarm-preview";

    const topbar = document.createElement("div");
    topbar.className = "swarm-topbar";
    topbar.innerHTML = `
      <span class="swarm-status-dot"></span>
      <span id="swarm-status" aria-live="polite">
        Reconstructing FOUREXA TECH...
      </span>
      <button class="swarm-exit" type="button">
        Exit
      </button>
    `;

    const progress = document.createElement("div");
    progress.className = "swarm-progress";
    progress.innerHTML = `
      <div class="swarm-progress-fill"></div>
    `;

    overlay.append(preview, topbar, progress);
    document.body.append(trigger, overlay);

    const status = topbar.querySelector("#swarm-status");
    const exitButton = topbar.querySelector(".swarm-exit");
    const progressFill = progress.querySelector(".swarm-progress-fill");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const delay = reducedMotion ? 120 : 650;

    const cursorColors = ["cyan", "purple", "blue"];

    const cursors = cursorColors.map((color, index) => {
      const cursor = document.createElement("div");
      cursor.className = `swarm-cursor ${color}`;

      cursor.innerHTML = `
        <svg viewBox="0 0 24 30" fill="none">
          <path
            d="M3 2L3 25L9 19L14 28L18 26L13 17L22 16Z"
            fill="currentColor"
            stroke="white"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
      `;

      cursor.style.transitionDelay = `${index * 80}ms`;
      overlay.appendChild(cursor);

      return cursor;
    });

    let timers = [];
    let running = false;
    let previousOverflow = "";

    function later(callback, time) {
      const timer = setTimeout(callback, time);
      timers.push(timer);
      return timer;
    }

    function moveCursor(cursor, target, offset = 0) {
      if (!target) return;

      const rect = target.getBoundingClientRect();

      cursor.style.left =
        Math.max(0, rect.left + rect.width / 2 + offset) + "px";

      cursor.style.top =
        Math.max(0, rect.top + rect.height / 2) + "px";
    }

    function stopTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function closeRebuild() {
      stopTimers();
      running = false;

      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");

      document.body.style.overflow = previousOverflow;

      preview.innerHTML = "";
      progressFill.style.width = "0%";

      trigger.focus();
    }

    function createPreview() {
      preview.innerHTML = "";

      // Clone the current page without running its scripts.
      const pageCopy = document.body.cloneNode(true);

      // Remove interactive elements from the preview.
      pageCopy.querySelector("#swarm-rebuild-trigger")?.remove();
      pageCopy.querySelector("#swarm-rebuild-overlay")?.remove();

      pageCopy.querySelectorAll("script").forEach((script) => {
        script.remove();
      });

      pageCopy.className = "swarm-preview-body";
      pageCopy.removeAttribute("style");

      // Keep the page's original content and layout.
      pageCopy.querySelectorAll("a, button, input, textarea, select").forEach(
        (element) => {
          element.setAttribute("tabindex", "-1");
        }
      );

      // Main container must remain visible while sections rebuild.
      const main = pageCopy.querySelector("main");
      if (main) {
        main.style.opacity = "1";
        main.style.transform = "none";
      }

      const targets = pageCopy.querySelectorAll(
        "header, main > section, footer"
      );

      targets.forEach((element) => {
        element.classList.remove("swarm-revealed");
        element.style.opacity = "0";
        element.style.transform = "translateY(15px)";
      });

      preview.appendChild(pageCopy);

      return { pageCopy, targets };
    }

    function startRebuild() {
      if (running) return;

      running = true;
      stopTimers();

      previousOverflow = document.body.style.overflow;

      // Lock the original page while the overlay is active.
      document.body.style.overflow = "hidden";

      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");

      status.textContent = "Reconstructing FOUREXA TECH...";
      exitButton.textContent = "Exit";
      progressFill.style.width = "0%";

      const { targets } = createPreview();

      // Initial cursor positions.
      cursors.forEach((cursor, index) => {
        cursor.style.left = `${30 + index * 40}px`;
        cursor.style.top = "100px";
      });

      // Reveal one website section at a time.
      const elements = Array.from(targets);
      const total = elements.length;

      if (!total) {
        status.textContent = "Rebuild complete";
        running = false;
        return;
      }

      elements.forEach((element, index) => {
        later(() => {
          if (!running) return;

          // Scroll the preview to the next section.
          const previewTop =
            element.getBoundingClientRect().top +
            preview.scrollTop -
            70;

          preview.scrollTo({
            top: Math.max(0, previewTop),
            behavior: reducedMotion ? "auto" : "smooth"
          });

          // Let the preview scroll before moving cursors.
          later(() => {
            if (!running) return;

            element.classList.add("swarm-revealed");
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";

            // Different cursors move toward the section.
            cursors.forEach((cursor, cursorIndex) => {
              moveCursor(
                cursor,
                element,
                (cursorIndex - 1) * 22
              );
            });

            const percent = Math.round(
              ((index + 1) / total) * 100
            );

            progressFill.style.width = percent + "%";

            status.textContent =
              `Building website components... ${percent}%`;

          }, reducedMotion ? 20 : 400);

        }, index * delay);
      });

      // Finish the animation.
      later(() => {
        if (!running) return;

        status.textContent = "FOUREXA TECH successfully rebuilt ✦";
        exitButton.textContent = "Go Live";

        cursors.forEach((cursor) => {
          cursor.style.opacity = "0";
        });

        running = false;

      }, total * delay + (reducedMotion ? 300 : 850));
    }

    trigger.addEventListener("click", startRebuild);

    exitButton.addEventListener("click", () => {
      if (running) {
        closeRebuild();
      } else {
        closeRebuild();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        overlay.classList.contains("active")
      ) {
        closeRebuild();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSwarmRebuild);
  } else {
    initSwarmRebuild();
  }
})();
document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.querySelector('#swarm-rebuild-trigger');

    if (trigger) {
        trigger.click();
    }
});
