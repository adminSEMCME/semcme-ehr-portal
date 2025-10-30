// public/modules/module-progress-tracker.js
(function () {
  // ————— helpers —————
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const moduleId =
    (location.pathname.match(/\/modules\/([^/]+)\//) || [])[1] ||
    "unknown_module";

  let lastSentPercent = -1;
  let sending = false;

  async function postProgress({ percent, completed }) {
    // avoid duplicate sends
    if (!completed && percent === lastSentPercent) return;
    lastSentPercent = percent;

    const payload = {
      module_id: moduleId,
      progress_percent: Math.max(0, Math.min(100, Math.round(percent))),
      status: completed ? "completed" : "in_progress",
      ...(completed ? { date_completed: new Date().toISOString() } : {}),
    };

    try {
      sending = true;
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true, // survives tab close
      });
      // console.debug("Progress sent:", payload);
    } catch (e) {
      console.warn("Progress send failed:", e);
    } finally {
      sending = false;
    }
  }

  function findOutlineEl() {
    // Typical structure: <nav id="outline-content" class="cs-outline"> ... .cs-listitem ...
    return (
      document.querySelector("#outline-content") ||
      document.querySelector("nav.cs-outline") ||
      document.querySelector("#outline-panel nav")
    );
  }

  function countTotals(outlineEl) {
    if (!outlineEl) return { visited: 0, total: 0, percent: 0 };

    // Every clickable item in menu
    const allItems = outlineEl.querySelectorAll(".cs-listitem.listitem");
    const total = allItems.length;

    // Storyline marks visited with .cs-viewed
    const visitedItems = outlineEl.querySelectorAll(
      ".cs-listitem.listitem.cs-viewed"
    );
    const visited = visitedItems.length;

    const percent = total ? Math.round((visited / total) * 100) : 0;
    return { visited, total, percent };
  }

  // Debounce sends
  let debounceTimer = null;
  function scheduleSend({ percent, completed = false }, delay = 600) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(
      () => postProgress({ percent, completed }),
      delay
    );
  }

  // ————— bootstrap —————
  (async function init() {
    // Give Storyline time to render the outline
    for (let i = 0; i < 30; i++) {
      if (findOutlineEl()) break;
      await sleep(250);
    }
    const outline = findOutlineEl();
    if (!outline) {
      console.warn("Module tracker: outline not found, will not compute %.");
      return;
    }

    console.info("📘 Tracker active for module:", moduleId);

    // Initial send
    const first = countTotals(outline);
    // console.info(`📑 Found ${first.total} tabs`);
    scheduleSend({ percent: first.percent });

    // Watch for visited/selected changes
    const observer = new MutationObserver((mutations) => {
      // Only react to class changes or node additions/removals
      const changed = mutations.some(
        (m) => m.type === "attributes" || m.type === "childList"
      );
      if (!changed || sending) return;

      const { percent } = countTotals(outline);
      scheduleSend({ percent });
    });

    observer.observe(outline, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "aria-selected", "aria-expanded"],
    });

    // Detect Exit button -> Completed
    function bindExitOnce() {
      const exitBtn = Array.from(
        document.querySelectorAll("button, a, div")
      ).find((el) => {
        const t = (el.textContent || "").toLowerCase();
        const a = (el.getAttribute("aria-label") || "").toLowerCase();
        return t.includes("exit") || a.includes("exit");
      });
      if (!exitBtn || exitBtn.dataset._progressBound) return false;
      exitBtn.dataset._progressBound = "1";
      exitBtn.addEventListener("click", () => {
        // On explicit exit, force 100% + completed
        scheduleSend({ percent: 100, completed: true }, 0);
      });
      return true;
    }

    // Try immediately & also keep trying for late renders
    bindExitOnce();
    const exitFinder = new MutationObserver(() => bindExitOnce());
    exitFinder.observe(document.body, { childList: true, subtree: true });

    // (Optional) If you ALSO want to auto-complete when all tabs are visited
    // uncomment the block below.
    /*
    const autoCompleteObserver = new MutationObserver(() => {
      const { visited, total } = countTotals(outline);
      if (total > 0 && visited === total) {
        scheduleSend({ percent: 100, completed: true }, 300);
        autoCompleteObserver.disconnect();
      }
    });
    autoCompleteObserver.observe(outline, { subtree: true, attributes: true, childList: true, attributeFilter: ["class"] });
    */
  })();
})();
