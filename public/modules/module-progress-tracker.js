// public/modules/module-progress-tracker.js
(async function () {
  // Small delay to ensure Storyline initializes
  await new Promise((r) => setTimeout(r, 3000));

  function getModuleId() {
    const pathParts = window.location.pathname.split("/");
    const moduleFolder = pathParts[pathParts.indexOf("modules") + 1];
    return moduleFolder || "unknown_module";
  }

  const moduleId = getModuleId();
  console.log(`📘 Progress Tracker loaded for module: ${moduleId}`);

  // Track percentage and completion status
  let lastProgress = 0;
  let hasCompleted = false;

  // Helper function to send progress data to your API
  async function updateProgress(status, progressPercent) {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: moduleId,
          status,
          progress_percent: progressPercent,
          date_completed:
            status === "completed" ? new Date().toISOString() : null,
        }),
      });
      console.log(`✅ Progress updated: ${status} (${progressPercent}%)`);
    } catch (err) {
      console.error("❌ Failed to update progress", err);
    }
  }

  // Poll Storyline every few seconds to check progress
  const interval = setInterval(() => {
    try {
      // Storyline exposes progress in user.js via GetPlayer()
      const player = window.GetPlayer?.();
      if (!player) return;

      // If the author set a "Progress" variable in Storyline (recommended)
      const progress = Number(player.GetVar?.("Progress") || 0);
      const slidesCompleted = player.GetVar?.("SlidesCompleted");
      const totalSlides = player.GetVar?.("TotalSlides");

      // Compute progress percentage if Storyline variables are available
      let progressPercent = progress;
      if (slidesCompleted && totalSlides) {
        progressPercent = Math.round(
          (Number(slidesCompleted) / Number(totalSlides)) * 100
        );
      }

      // Only send if progress changed
      if (progressPercent > lastProgress && progressPercent <= 100) {
        lastProgress = progressPercent;
        updateProgress(
          progressPercent >= 100 ? "completed" : "in_progress",
          progressPercent
        );
      }

      // Detect Exit button click (common in Storyline)
      const exitButton =
        document.querySelector(".cs-exit, #exit, button.exit") ||
        document.querySelector("button[title*='Exit']");

      if (exitButton && !exitButton.dataset.tracked) {
        exitButton.dataset.tracked = "true";
        exitButton.addEventListener("click", async () => {
          if (!hasCompleted) {
            hasCompleted = true;
            await updateProgress("completed", 100);
          }
        });
      }
    } catch (err) {
      console.warn("Progress tracking loop error:", err);
    }
  }, 5000); // check every 5 seconds

  // Stop tracking after 2 hours just for safety
  setTimeout(() => clearInterval(interval), 2 * 60 * 60 * 1000);
})();
