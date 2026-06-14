import Nav from "@/components/Nav";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchAlbumPhotos, ALBUMS } from "@/lib/lightroom";
import PhotoGrid from "@/components/PhotoGrid";

type Props = { params: Promise<{ shareId: string }> };

export async function generateStaticParams() {
  return ALBUMS.map((album) => ({ shareId: album.shareId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  try {
    const { name } = await fetchAlbumPhotos(shareId);
    return { title: name, description: `Photo album: ${name}` };
  } catch {
    return { title: "Album" };
  }
}

export default async function AlbumPage({ params }: Props) {
  const { shareId } = await params;
  const { name, description, photos } = await fetchAlbumPhotos(shareId);

  return (
    <>
      <Nav />

      <div className="gallery-page">
        <div className="gallery-back">
          <Link href="/gallery">← All Albums</Link>
        </div>

        <div className="gallery-album-header">
          <h1 className="gallery-album-page-title">{name}</h1>
          {description && (
            <p className="gallery-album-desc">{description}</p>
          )}
          <p className="gallery-album-count">{photos.length} photos</p>
        </div>

        <PhotoGrid photos={photos} />
      </div>
    </>
  );
}
