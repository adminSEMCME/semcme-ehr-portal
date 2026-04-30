import type React from "react";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableChildren(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
}

export function focusFirstChild(container: HTMLElement | null) {
  requestAnimationFrame(() => {
    getFocusableChildren(container)[0]?.focus();
  });
}

export function focusFirstDescendant(
  container: HTMLElement | null,
  selector: string,
) {
  requestAnimationFrame(() => {
    const target = container?.querySelector<HTMLElement>(selector) ?? null;
    getFocusableChildren(target)[0]?.focus();
  });
}

export function handleDropdownKeyDown(
  event: React.KeyboardEvent<HTMLElement>,
  onEscape?: () => void,
) {
  if (
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp" &&
    event.key !== "Escape"
  ) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onEscape?.();
    return;
  }

  const items = getFocusableChildren(event.currentTarget);
  if (items.length === 0) return;

  event.preventDefault();

  const currentIndex = items.indexOf(document.activeElement as HTMLElement);
  const nextIndex =
    event.key === "ArrowDown"
      ? (currentIndex + 1) % items.length
      : (currentIndex - 1 + items.length) % items.length;

  items[nextIndex]?.focus();
}
