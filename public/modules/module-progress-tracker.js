// public/modules/module-progress-tracker.js
(function () {
  // ————— helpers —————
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const moduleId =
    location.pathname.split("/modules/")[1]?.split("/")[0] || "unknown_module";

  let lastSentPercent = -1;
  let sending = false;
  let maxPercentSent = 0;
  let lastVisited = 0;

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

    // Give Storyline time to render outline
    for (let i = 0; i < 30; i++) {
      if (findOutlineEl()) break;

      await sleep(250);
    }

    const outline = findOutlineEl();

    if (!outline) {
      console.warn("Module tracker: outline not found.");
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

    // Detect Exit button -> completion
    function bindExitOnce() {
      const exitBtn = Array.from(document.querySelectorAll("button")).find(
        (el) => {
          const t = (el.textContent || "").toLowerCase();
          const a = (el.getAttribute("aria-label") || "").toLowerCase();

          return t.includes("exit") || a.includes("exit");
        },
      );

      if (!exitBtn || exitBtn.dataset._progressBound) return false;

      exitBtn.dataset._progressBound = "1";

      exitBtn.addEventListener("click", () => {
        localStorage.setItem(completedKey, "true");
        scheduleSend({ percent: 100, completed: true }, 0);
      });

      return true;
    }

    bindExitOnce();

    const exitFinder = new MutationObserver(() => bindExitOnce());

    exitFinder.observe(document.body, {
      childList: true,
      subtree: true,
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
