export const dynamic = 'force-dynamic';

import { getAllPosts, getPostContent } from "@/lib/posts";

const SITE_URL = "https://subhashjha.in";
const SITE_TITLE = "Code & Coffee with Subhash";
const SITE_DESCRIPTION =
  "Software Developer at Adobe building Photoshop. Writing about macOS tools, systems programming, and creative software.";

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absolutifyImageSrcs(html: string) {
  return html.replace(/src="\/images\//g, `src="${SITE_URL}/images/`);
}

export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map((post) => {
      const rawContent = getPostContent(post.slug);
      const content = absolutifyImageSrcs(rawContent);
      const postUrl = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.description)}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
