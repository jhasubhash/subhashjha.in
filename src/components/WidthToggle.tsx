"use client";

import { useEffect, useState } from "react";

// Segmented control to switch the reading width on blog-post pages between
// small / medium / full. The choice is stored in localStorage and applied
// (no flash) by the inline script in layout.tsx via [data-post-width] on <html>.
const widths = [
  { key: "small", label: "Small", bar: 6 },
  { key: "medium", label: "Medium", bar: 12 },
  { key: "full", label: "Full", bar: 18 },
] as const;

type WidthKey = (typeof widths)[number]["key"];

export default function WidthToggle() {
  const [width, setWidth] = useState<WidthKey>("medium");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = document.documentElement.dataset.postWidth as
      | WidthKey
      | undefined;
    if (current === "small" || current === "full") setWidth(current);
    else setWidth("medium");
  }, []);

  function choose(key: WidthKey) {
    setWidth(key);
    document.documentElement.dataset.postWidth = key;
    localStorage.setItem("postWidth", key);
  }

  if (!mounted) return null;

  return (
    <div className="width-toggle" role="group" aria-label="Reading width">
      {widths.map((w) => (
        <button
          key={w.key}
          type="button"
          onClick={() => choose(w.key)}
          data-active={width === w.key}
          title={`${w.label} width`}
          aria-label={`${w.label} width`}
          aria-pressed={width === w.key}
        >
          <svg viewBox="0 0 22 14" aria-hidden="true">
            <rect className="frame" x="1" y="1" width="20" height="12" rx="2" />
            <rect
              className="fill"
              x={(22 - w.bar) / 2}
              y="4"
              width={w.bar}
              height="6"
              rx="1"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
