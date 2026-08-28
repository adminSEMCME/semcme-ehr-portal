// public/modules/module-progress-tracker.js
(function () {
  // Educator previews are intentionally read-only. Exit before touching
  // localStorage, observing the course, or calling the progress API.
  if (new URLSearchParams(location.search).get("preview") === "1") return;

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
