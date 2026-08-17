import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type Post = {
  slug: string;
  title: string;
  htmlTitle?: string;
  description: string;
  htmlDescription?: string;
  date: string;
  readTime: string;
  category: string;
  eyebrow?: string;
  tags?: string[];
  status?: "draft" | "published";
  image?: string;
};

export function getAllPosts(): Post[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(POSTS_DIR, "manifest.json"), "utf-8")
  ) as Post[];
  return manifest
    .filter((p) => !p.status || p.status === "published")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): Post | undefined {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(POSTS_DIR, "manifest.json"), "utf-8")
  ) as Post[];
  return manifest.find((p) => p.slug === slug);
}

export function getAllTags(): string[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.keys()].sort((a, b) => a.localeCompare(b));
}

export function getPostContent(slug: string): string {
  const filePath = path.join(POSTS_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}
