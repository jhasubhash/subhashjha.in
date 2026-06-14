"use client";

import { useState, useEffect, useCallback } from "react";
import type { LightroomPhoto } from "@/lib/lightroom";

export default function PhotoGrid({ photos }: { photos: LightroomPhoto[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  const close = useCallback(() => setSelected(null), []);

  const next = useCallback(() => {
    if (selected === null) return;
    setSelected((selected + 1) % photos.length);
  }, [selected, photos.length]);

  const prev = useCallback(() => {
    if (selected === null) return;
    setSelected((selected - 1 + photos.length) % photos.length);
  }, [selected, photos.length]);

  useEffect(() => {
    if (selected === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, close, next, prev]);

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            className="photo-grid-item"
            onClick={() => setSelected(i)}
            style={{
              aspectRatio: `${photo.width} / ${photo.height}`,
            }}
          >
            <img
              src={photo.thumbnail}
              alt={photo.fileName || `Photo ${i + 1}`}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {selected !== null && (
        <div className="lightbox" onClick={close}>
          <button className="lightbox-close" onClick={close} aria-label="Close">
            ✕
          </button>

          <button
            className="lightbox-nav lightbox-prev"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[selected].full}
              alt={photos[selected].fileName || `Photo ${selected + 1}`}
            />
          </div>

          <button
            className="lightbox-nav lightbox-next"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
          >
            ›
          </button>

          <div className="lightbox-counter">
            {selected + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
