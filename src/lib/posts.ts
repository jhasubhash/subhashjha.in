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
  status?: "draft" | "published";
};

export function getAllPosts(): Post[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(POSTS_DIR, "manifest.json"), "utf-8")
  ) as Post[];
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return manifest
    .filter((p) => (!p.status || p.status === "published") && !!p.date && new Date(p.date) <= today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): Post | undefined {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(POSTS_DIR, "manifest.json"), "utf-8")
  ) as Post[];
  return manifest.find((p) => p.slug === slug);
}

export function getPostContent(slug: string): string {
  const filePath = path.join(POSTS_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}
