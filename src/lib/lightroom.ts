// Lightroom public API helpers
// Works with publicly shared albums (no auth needed)

export type LightroomAlbum = {
  shareId: string;
  albumId: string;
  name: string;
  coverImage: string | null;
};

export type LightroomPhoto = {
  id: string;
  thumbnail: string;
  medium: string;
  full: string;
  width: number;
  height: number;
  captureDate: string | null;
  fileName: string | null;
};

type AlbumConfig = {
  shareId: string;
  title?: string;
  description?: string;
};

// Albums configured by the user
export const ALBUMS: AlbumConfig[] = [
  {
    shareId: "92cbb6947b904d6c8b716ce934d5319e",
  },
  {
    shareId: "edc9c1534679412eaab1f55451a3ebf3",
  },
];

const LR_BASE = "https://lightroom.adobe.com";
const PHOTOS_BASE = "https://photos.adobe.io";
const API_KEY = "LightroomMobileWeb1";

export async function fetchAlbumMetadata(shareId: string): Promise<{
  albumId: string;
  name: string;
  assetsHref: string;
  base: string;
}> {
  const res = await fetch(`${LR_BASE}/shares/${shareId}`, {
    next: { revalidate: 86400 },
  });
  const html = await res.text();

  const match = html.match(/window\.SharesConfig\s*=\s*\{[\s\S]*?albumAttributes:\s*(\{[\s\S]*?\})\s*\n\s*\};/);
  if (!match) throw new Error(`Could not parse SharesConfig for share ${shareId}`);

  // Parse albumAttributes JSON
  const albumAttrsStr = match[1].replace(/\u0026/g, "&");
  const albumAttrs = JSON.parse(albumAttrsStr);

  const base = albumAttrs.base || `${PHOTOS_BASE}/v2/`;
  const albumId = albumAttrs.id;
  const name = albumAttrs.payload?.name || "Untitled";
  const assetsHref = albumAttrs.links?.["/rels/space_album_images_videos"]?.href
    || `spaces/${shareId}/albums/${albumId}/assets?embed=asset&subtype=image%3Bvideo`;

  return { albumId, name, assetsHref, base };
}

export async function fetchAlbumPhotos(shareId: string): Promise<{
  name: string;
  photos: LightroomPhoto[];
}> {
  const { albumId, name, base } = await fetchAlbumMetadata(shareId);

  const assetsUrl = `${LR_BASE}/v2/spaces/${shareId}/albums/${albumId}/assets?embed=asset&subtype=image%3Bvideo&limit=500&order_after=-&exclude=incomplete`;

  const res = await fetch(assetsUrl, {
    next: { revalidate: 86400 },
  });
  const text = await res.text();
  // Remove anti-XSSI prefix
  const json = text.replace(/^while\s*\(1\)\s*\{\}/, "");
  const data = JSON.parse(json);

  const spaceBase = data.base || `${PHOTOS_BASE}/v2/spaces/${shareId}/`;

  const photos: LightroomPhoto[] = (data.resources || []).map((r: any) => {
    const asset = r.asset;
    const links = asset.links;
    const payload = asset.payload;

    const thumbHref = links["/rels/rendition_type/thumbnail2x"]?.href || "";
    const mediumHref = links["/rels/rendition_type/1280"]?.href || links["/rels/rendition_type/640"]?.href || "";
    const fullHref = links["/rels/rendition_type/2048"]?.href || mediumHref;

    return {
      id: asset.id,
      thumbnail: `${spaceBase}${thumbHref}?api_key=${API_KEY}`,
      medium: `${spaceBase}${mediumHref}?api_key=${API_KEY}`,
      full: `${spaceBase}${fullHref}?api_key=${API_KEY}`,
      width: payload?.develop?.croppedWidth || 0,
      height: payload?.develop?.croppedHeight || 0,
      captureDate: payload?.captureDate || null,
      fileName: payload?.importSource?.fileName || null,
    };
  });

  return { name, photos };
}

export async function fetchAlbumCover(shareId: string): Promise<string | null> {
  const { albumId } = await fetchAlbumMetadata(shareId);

  const assetsUrl = `${LR_BASE}/v2/spaces/${shareId}/albums/${albumId}/assets?embed=asset&subtype=image%3Bvideo&limit=1&order_after=-&exclude=incomplete`;

  const res = await fetch(assetsUrl, {
    next: { revalidate: 86400 },
  });
  const text = await res.text();
  const json = text.replace(/^while\s*\(1\)\s*\{\}/, "");
  const data = JSON.parse(json);

  const spaceBase = data.base || `${PHOTOS_BASE}/v2/spaces/${shareId}/`;
  const first = data.resources?.[0];
  if (!first) return null;

  const href = first.asset?.links?.["/rels/rendition_type/1280"]?.href
    || first.asset?.links?.["/rels/rendition_type/640"]?.href
    || first.asset?.links?.["/rels/rendition_type/thumbnail2x"]?.href;

  return href ? `${spaceBase}${href}?api_key=${API_KEY}` : null;
}
