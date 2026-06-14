"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { LightroomPhoto } from "@/lib/lightroom";

export default function PhotoGrid({ photos }: { photos: LightroomPhoto[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [currentLoaded, setCurrentLoaded] = useState(false);

  const close = useCallback(() => setSelected(null), []);

  const next = useCallback(() => {
    if (selected === null || photos.length <= 1) return;
    setCurrentLoaded(false);
    setSelected((selected + 1) % photos.length);
  }, [selected, photos.length]);

  const prev = useCallback(() => {
    if (selected === null || photos.length <= 1) return;
    setCurrentLoaded(false);
    setSelected((selected - 1 + photos.length) % photos.length);
  }, [selected, photos.length]);

  // Prefetch adjacent images
  useEffect(() => {
    if (selected === null) return;
    const toPreload = [
      (selected + 1) % photos.length,
      (selected - 1 + photos.length) % photos.length,
    ];
    toPreload.forEach((idx) => {
      const src = photos[idx].full;
      if (!loadedImages.has(src)) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(src));
        };
      }
    });
  }, [selected, photos, loadedImages]);

  // Check if current image is already cached
  useEffect(() => {
    if (selected === null) return;
    const src = photos[selected].full;
    if (loadedImages.has(src)) {
      setCurrentLoaded(true);
    } else {
      setCurrentLoaded(false);
    }
  }, [selected, photos, loadedImages]);

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
            onClick={() => {
              setCurrentLoaded(loadedImages.has(photo.full));
              setSelected(i);
            }}
            style={{
              aspectRatio: `${photo.width} / ${photo.height}`,
            }}
          >
            <img
              src={photo.thumbnail}
              alt={photo.title || photo.fileName || `Photo ${i + 1}`}
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
            {!currentLoaded && (
              <div className="lightbox-loading">
                <div className="lightbox-spinner" />
              </div>
            )}
            <img
              key={photos[selected].id}
              src={photos[selected].full}
              alt={photos[selected].title || photos[selected].fileName || `Photo ${selected + 1}`}
              style={{ display: currentLoaded ? "block" : "none" }}
              onLoad={() => {
                setCurrentLoaded(true);
                setLoadedImages((prev) => new Set(prev).add(photos[selected].full));
              }}
            />
            {currentLoaded && (photos[selected].title || photos[selected].caption) && (
              <div className="lightbox-info">
                {photos[selected].title && (
                  <div className="lightbox-title">{photos[selected].title}</div>
                )}
                {photos[selected].caption && (
                  <div className="lightbox-caption">{photos[selected].caption}</div>
                )}
              </div>
            )}
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
