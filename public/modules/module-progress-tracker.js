// public/modules/module-progress-tracker.js
(function () {
  const query = new URLSearchParams(location.search);

  // Educator previews are intentionally read-only and limited to the first
  // two slides. This branch exits before touching localStorage or progress APIs.
  if (query.get("preview") === "1") {
    startEducatorPreviewLimit(2);
    return;
  }

  function startEducatorPreviewLimit(slideLimit) {
    let currentSlide = 0;
    let gate = null;
    let returnAttempted = false;

    function getPlayer() {
      try {
        return window.GetPlayer?.();
      } catch {
        return null;
      }
    }

    function readSlideNumber() {
      const player = getPlayer();
      if (!player?.GetVar) return 0;

      for (const variable of [
        "projectSlideNumber",
        "menuSlideNumber",
        "sceneSlideNumber",
      ]) {
        try {
          const value = Number(player.GetVar(variable));
          if (Number.isFinite(value) && value > 0) return value;
        } catch {
          // Storyline may not have initialized this variable yet.
        }
      }

      const slideItems = getSlideMenuItems();
      const selectedIndex = slideItems.findIndex((item) =>
        item.classList.contains("cs-selected"),
      );

      if (selectedIndex >= 0) return selectedIndex + 1;

      return 0;
    }

    function getSlideMenuItems() {
      return Array.from(
        document.querySelectorAll(".cs-listitem[data-ref]"),
      ).filter((item) =>
        (item.getAttribute("data-ref") || "").startsWith("_player."),
      );
    }

    function closePreview() {
      window.close();

      window.setTimeout(() => {
        if (gate) {
          const message = gate.querySelector("[data-preview-close-message]");
          if (message) {
            message.textContent =
              "You may now close this browser tab to return to the educator preview.";
          }
        }
      }, 150);
    }

    function showGate() {
      if (gate) return;

      gate = document.createElement("div");
      gate.id = "educator-preview-slide-limit";
      gate.setAttribute("role", "dialog");
      gate.setAttribute("aria-modal", "true");
      gate.setAttribute("aria-labelledby", "educator-preview-limit-title");
      gate.innerHTML = `
        <div class="educator-preview-limit-card">
          <div class="educator-preview-limit-icon" aria-hidden="true">✓</div>
          <p class="educator-preview-limit-label">Educator Preview</p>
          <h1 id="educator-preview-limit-title">Preview complete</h1>
          <p data-preview-close-message>
            This preview includes the first two slides of the module. Enrolled
            learners receive access to the complete module experience.
          </p>
          <button type="button" data-preview-close>Close Preview</button>
        </div>
      `;

      const style = document.createElement("style");
      style.id = "educator-preview-slide-limit-styles";
      style.textContent = `
        #educator-preview-slide-limit {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 24px;
          background: rgba(2, 35, 70, 0.88);
          font-family: Arial, sans-serif;
        }
        .educator-preview-limit-card {
          box-sizing: border-box;
          width: min(520px, 100%);
          padding: 34px;
          border: 1px solid #bfdbfe;
          border-radius: 18px;
          background: #ffffff;
          color: #1e293b;
          text-align: center;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
        }
        .educator-preview-limit-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          margin: 0 auto 16px;
          border-radius: 14px;
          background: #dbeafe;
          color: #02519c;
          font-size: 28px;
          font-weight: 700;
        }
        .educator-preview-limit-label {
          margin: 0 0 8px;
          color: #02519c;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .educator-preview-limit-card h1 {
          margin: 0;
          color: #0f172a;
          font-size: 28px;
          line-height: 1.2;
        }
        .educator-preview-limit-card p[data-preview-close-message] {
          margin: 16px 0 24px;
          color: #475569;
          font-size: 16px;
          line-height: 1.6;
        }
        .educator-preview-limit-card button {
          min-width: 170px;
          padding: 12px 20px;
          border: 0;
          border-radius: 8px;
          background: #02519c;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .educator-preview-limit-card button:hover,
        .educator-preview-limit-card button:focus-visible {
          background: #013e7a;
        }
        .educator-preview-limit-card button:focus-visible {
          outline: 3px solid #93c5fd;
          outline-offset: 3px;
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(gate);
      gate
        .querySelector("[data-preview-close]")
        ?.addEventListener("click", closePreview);
      gate.querySelector("button")?.focus();
    }

    function isNextControl(target) {
      return Boolean(
        target?.closest?.(
          "#next, [data-ref='next'], [aria-label='Next'], [title='Next']",
        ),
      );
    }

    function menuItemExceedsLimit(target) {
      const item = target?.closest?.(".cs-listitem[data-ref]");
      if (!item) return false;

      const items = getSlideMenuItems();
      return items.indexOf(item) >= slideLimit;
    }

    function blockAdvance(event) {
      if (
        menuItemExceedsLimit(event.target) ||
        (currentSlide >= slideLimit && isNextControl(event.target))
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        showGate();
      }
    }

    function blockAdvanceKey(event) {
      if (
        currentSlide >= slideLimit &&
        ["ArrowRight", "PageDown", "Enter"].includes(event.key)
      ) {
        const active = document.activeElement;
        if (event.key !== "Enter" || isNextControl(active)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          showGate();
        }
      }
    }

    function updateControls() {
      currentSlide = readSlideNumber() || currentSlide;

      const next = document.querySelector("#next");
      if (next) {
        const locked = currentSlide >= slideLimit;
        next.setAttribute("aria-disabled", locked ? "true" : "false");
        next.style.opacity = locked ? "0.45" : "";
        next.style.cursor = locked ? "not-allowed" : "";
      }

      const menuItems = getSlideMenuItems();
      menuItems.forEach((item, index) => {
        if (index >= slideLimit) {
          item.setAttribute("aria-disabled", "true");
          item.style.opacity = "0.5";
          item.style.cursor = "not-allowed";
        }
      });

      if (currentSlide > slideLimit) {
        showGate();

        if (!returnAttempted) {
          returnAttempted = true;
          document.querySelector("#prev")?.click();
        }
      } else {
        returnAttempted = false;
      }
    }

    document.addEventListener("click", blockAdvance, true);
    document.addEventListener("keydown", blockAdvanceKey, true);

    const observer = new MutationObserver(updateControls);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "aria-selected", "data-ref"],
    });

    window.setInterval(updateControls, 200);
  }

  // ————— helpers —————
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const moduleId =
    location.pathname.split("/modules/")[1]?.split("/")[0] || "unknown_module";

  let lastSentPercent = -1;
  let sending = false;
  let maxPercentSent = 0;
  let lastVisited = 0;
  let fallbackTotalSlides = 0;
  let fallbackSlideIds = [];
  let fallbackLastSlideVarNames = [];
  let fallbackMaxSlide = 0;

  const completedKey = "module_completed_" + moduleId;

  async function postProgress({ percent, completed }) {
    percent = Math.max(0, Math.min(100, Math.round(percent)));

    if (percent < maxPercentSent && !completed) return;

    maxPercentSent = Math.max(maxPercentSent, percent);

    const payload = {
      module_id: moduleId,
      progress_percent: percent,
      status: completed ? "completed" : "in_progress",
      ...(completed ? { date_completed: new Date().toISOString() } : {}),
    };

    try {
      sending = true;

      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (e) {
      console.warn("Progress send failed:", e);
    } finally {
      sending = false;
    }
  }

  function findOutlineEl() {
    return (
      document.querySelector("#outline-content") ||
      document.querySelector("nav.cs-outline") ||
      document.querySelector("#outline-panel nav")
    );
  }

  function countTotals(outlineEl) {
    if (!outlineEl) return { visited: 0, total: 0, percent: 0 };

    const allSlides = outlineEl.querySelectorAll(".cs-listitem[data-ref]");
    const total = allSlides.length;

    const visitedSlides = outlineEl.querySelectorAll(
      ".cs-listitem.cs-viewed[data-ref]",
    );

    const visited = visitedSlides.length;

    const percent = total ? Math.round((visited / total) * 100) : 0;

    return { visited, total, percent };
  }

  async function loadStorylineSlideData() {
    try {
      const res = await fetch("html5/data/js/data.js", { cache: "no-store" });
      if (!res.ok) return null;

      const js = await res.text();
      const match = js.match(
        /window\.globalProvideData\('data'\s*,\s*'([\s\S]*)'\);?\s*$/,
      );

      if (!match) return null;

      const payload = match[1];

      let slideIds = Array.from(
        payload.matchAll(/"slideid":"([^"]+)"/g),
        (match) => match[1],
      );

      if (!slideIds.length) {
        slideIds = Array.from(
          payload.matchAll(/"kind":"slideref","id":"([^"]+)"/g),
          (match) => match[1],
        )
          .filter((slideId) => !slideId.startsWith("PromptScene."))
          .map((slideId) => `_player.${slideId}`);
      }

      const lastSlideVarNames = Array.from(
        payload.matchAll(/"name":"(LastSlideViewed_[^"]+)"/g),
        (match) => match[1],
      );

      const slideCount = Number(payload.match(/"slideCount":(\d+)/)?.[1]) || 0;

      return { slideIds, lastSlideVarNames, slideCount };
    } catch (e) {
      console.warn("Module tracker: could not load Storyline data.", e);
      return null;
    }
  }

  function configureFallbackTracking(data) {
    fallbackSlideIds = data?.slideIds || [];
    fallbackTotalSlides = fallbackSlideIds.length || data?.slideCount || 0;
    fallbackLastSlideVarNames = data?.lastSlideVarNames || [];
  }

  function getPlayer() {
    try {
      return window.GetPlayer?.();
    } catch {
      return null;
    }
  }

  function readPlayerVar(player, name) {
    try {
      return player?.GetVar?.(name);
    } catch {
      return null;
    }
  }

  function getFallbackSlideNumber() {
    const player = getPlayer();
    if (!player) return 0;

    const numericVars = [
      "projectSlideNumber",
      "sceneSlideNumber",
      "menuSlideNumber",
    ];

    for (const varName of numericVars) {
      const value = Number(readPlayerVar(player, varName));

      if (Number.isFinite(value) && value > 0) return value;
    }

    const possibleIds = [
      readPlayerVar(player, "currentSlideId"),
      ...fallbackLastSlideVarNames.map((name) => readPlayerVar(player, name)),
    ].filter(Boolean);

    for (const slideId of possibleIds) {
      const index = fallbackSlideIds.indexOf(slideId);

      if (index >= 0) return index + 1;
    }

    return 0;
  }

  function isOnFinalFallbackSlide() {
    return fallbackTotalSlides > 0 && fallbackMaxSlide >= fallbackTotalSlides;
  }

  function markCompleted() {
    localStorage.setItem(completedKey, "true");
    postProgress({ percent: 100, completed: true });
  }

  function elementLooksLikeExit(el) {
    if (!el) return false;

    const text = (el.textContent || "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const title = (el.getAttribute("title") || "").toLowerCase();
    const label = `${text} ${aria} ${title}`;

    if (label.includes("exit")) return true;

    return isOnFinalFallbackSlide() && label.includes("close");
  }

  function bindExitOnce() {
    const exitBtn = Array.from(
      document.querySelectorAll("button, [role='button'], a"),
    ).find(elementLooksLikeExit);

    if (!exitBtn || exitBtn.dataset._progressBound) return false;

    exitBtn.dataset._progressBound = "1";

    exitBtn.addEventListener("click", markCompleted, { capture: true });

    return true;
  }

  function startExitDetection() {
    bindExitOnce();

    const exitFinder = new MutationObserver(() => bindExitOnce());

    exitFinder.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "title", "class"],
    });

    document.addEventListener(
      "click",
      (event) => {
        const clicked = event.target?.closest?.("button, [role='button'], a");

        if (elementLooksLikeExit(clicked)) markCompleted();
      },
      true,
    );
  }

  async function startFallbackTracking() {
    const data = await loadStorylineSlideData();

    configureFallbackTracking(data);

    if (!fallbackTotalSlides) {
      console.warn("Module tracker: fallback slide count not found.");
      return;
    }

    console.info(
      "Module tracker: fallback active for module:",
      moduleId,
      "slides:",
      fallbackTotalSlides,
    );

    const interval = setInterval(() => {
      const slideNumber = getFallbackSlideNumber();

      if (!slideNumber || slideNumber <= fallbackMaxSlide) return;

      fallbackMaxSlide = Math.min(slideNumber, fallbackTotalSlides);

      const percent = Math.round((fallbackMaxSlide / fallbackTotalSlides) * 100);

      if (percent >= 100) {
        markCompleted();
        clearInterval(interval);
        return;
      }

      scheduleSend({ percent });
    }, 500);
  }

  // Debounce sends
  let debounceTimer = null;

  function scheduleSend({ percent, completed = false }, delay = 600) {
    if (!completed && percent === lastSentPercent) return;

    lastSentPercent = percent;

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(
      () => postProgress({ percent, completed }),
      delay,
    );
  }

  // ————— bootstrap —————
  (async function init() {
    // unlock navigation if module already completed
    if (localStorage.getItem(completedKey)) {
      const unlockInterval = setInterval(() => {
        try {
          if (window.GetPlayer) {
            const player = window.GetPlayer();

            if (player?.SetVar) {
              player.SetVar("MenuRestricted", false);
              clearInterval(unlockInterval);
            }
          }
        } catch {}
      }, 200);
    }

    startExitDetection();

    // Give Storyline time to render outline
    for (let i = 0; i < 30; i++) {
      if (findOutlineEl()) break;

      await sleep(250);
    }

    const outline = findOutlineEl();

    if (!outline) {
      console.warn("Module tracker: outline not found; using fallback.");
      startFallbackTracking();
      return;
    }

    console.info("📘 Tracker active for module:", moduleId);

    let first = { visited: 0, percent: 0 };

    for (let i = 0; i < 20; i++) {
      const result = countTotals(outline);

      if (
        result.visited > 0 ||
        document.querySelector(".cs-listitem.cs-viewed")
      ) {
        first = result;
        break;
      }

      await sleep(300);
    }

    lastVisited = first.visited;
    maxPercentSent = first.percent;

    // Watch for slide visits
    const observer = new MutationObserver((mutations) => {
      const changed = mutations.some(
        (m) => m.type === "attributes" || m.type === "childList",
      );

      if (!changed || sending || !outline.isConnected) return;

      const { visited, percent } = countTotals(outline);

      if (visited > lastVisited) {
        lastVisited = visited;
        scheduleSend({ percent });
      }
    });

    observer.observe(outline, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "aria-selected", "aria-expanded"],
    });

    // Auto completion when all slides viewed
    const autoCompleteObserver = new MutationObserver(() => {
      const { visited, total } = countTotals(outline);

      if (total > 0 && visited === total) {
        localStorage.setItem(completedKey, "true");

        scheduleSend({ percent: 100, completed: true }, 300);

        autoCompleteObserver.disconnect();
      }
    });

    autoCompleteObserver.observe(outline, {
      subtree: true,
      attributes: true,
      childList: true,
      attributeFilter: ["class"],
    });
  })();
})();
