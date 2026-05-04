export function KeyboardFocusMode() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (() => {
            const root = document.documentElement;
            const keyboardKeys = new Set(["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);

            window.addEventListener("keydown", (event) => {
              if (keyboardKeys.has(event.key)) {
                root.classList.add("keyboard-focus");
              }
            }, true);

            window.addEventListener("pointerdown", () => {
              root.classList.remove("keyboard-focus");
            }, true);
          })();
        `,
      }}
    />
  );
}
