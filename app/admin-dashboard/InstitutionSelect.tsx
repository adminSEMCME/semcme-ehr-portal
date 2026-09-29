"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function InstitutionSelect({ institutions, value, disabled, onChange }: {
  institutions: { id: string; name: string }[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef({ text: "", time: 0 });
  const sorted = [...institutions].sort((a, b) => a.name.localeCompare(b.name));
  const selected = sorted.find((institution) => institution.id === value);

  function focusOption(index: number) {
    requestAnimationFrame(() => options.current[index]?.focus());
  }

  function showOptions() {
    setOpen(true);
    focusOption(Math.max(0, sorted.findIndex((institution) => institution.id === value)));
  }

  function closeOptions() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="relative min-w-0" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button id="user-institution" ref={trigger} type="button" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? "institution-options" : undefined}
        onClick={() => open ? closeOptions() : showOptions()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            showOptions();
          }
        }}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-semcmeBlue focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
        <span className={selected ? "text-gray-900" : "text-gray-500"}>{selected?.name || "Select an institution"}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div id="institution-options" role="listbox" aria-label="New institution"
            className="max-h-60 overflow-y-auto overscroll-contain p-1.5"
            onKeyDown={(event) => {
              const index = options.current.indexOf(document.activeElement as HTMLButtonElement);
              let next = index;
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeOptions();
                return;
              }
              if (event.key === "ArrowDown") next = (index + 1) % sorted.length;
              else if (event.key === "ArrowUp") next = (index - 1 + sorted.length) % sorted.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = sorted.length - 1;
              else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
                const now = Date.now();
                typeahead.current.text = (now - typeahead.current.time < 700 ? typeahead.current.text : "") + event.key.toLowerCase();
                typeahead.current.time = now;
                next = sorted.findIndex((institution) => institution.name.toLowerCase().startsWith(typeahead.current.text));
              } else return;
              event.preventDefault();
              if (next >= 0) focusOption(next);
            }}>
            {sorted.map((institution, index) => (
              <button key={institution.id} type="button" role="option"
                aria-selected={institution.id === value} tabIndex={-1}
                ref={(element) => { options.current[index] = element; }}
                onClick={() => { onChange(institution.id); closeOptions(); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm focus:outline-none focus:bg-blue-100 hover:bg-blue-50 ${institution.id === value ? "bg-blue-50 font-semibold text-semcmeBlue" : "text-gray-800"}`}>
                <span className="flex-1">{institution.name}</span>
                {institution.id === value && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
