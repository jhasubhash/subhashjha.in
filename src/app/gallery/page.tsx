import Nav from "@/components/Nav";
import Link from "next/link";
import type { Metadata } from "next";
import { ALBUMS, fetchAlbumMetadata, fetchAlbumCover } from "@/lib/lightroom";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo albums by Subhash Jha.",
};

export default async function GalleryPage() {
  const albums = await Promise.all(
    ALBUMS.map(async (config) => {
      try {
        const meta = await fetchAlbumMetadata(config.shareId);
        const cover = await fetchAlbumCover(config.shareId);
        return {
          shareId: config.shareId,
          title: config.title || meta.name,
          description: config.description || meta.description,
          cover,
        };
      } catch {
        return {
          shareId: config.shareId,
          title: config.title || "Album",
          description: config.description || null,
          cover: null,
        };
      }
    })
  );

  return (
    <>
      <Nav />

      <div className="gallery-page">
        <div className="gallery-header">
          <div className="gallery-header-label">Gallery</div>
          <h1 className="gallery-header-title">Photos</h1>
          <p className="gallery-header-desc">
            Moments captured through the lens. Albums synced from Lightroom.
          </p>
        </div>

        <div className="gallery-grid">
          {albums.map((album) => (
            <Link
              key={album.shareId}
              href={`/gallery/${album.shareId}`}
              className="gallery-card"
            >
              <div className="gallery-card-cover">
                {album.cover ? (
                  <img src={album.cover} alt={album.title} loading="lazy" />
                ) : (
                  <div className="gallery-card-placeholder">📷</div>
                )}
              </div>
              <div className="gallery-card-info">
                <h2 className="gallery-card-title">{album.title}</h2>
                {album.description && (
                  <p className="gallery-card-desc">{album.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
