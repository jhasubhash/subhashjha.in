# subhashjha.in — Project Guide for Claude

## ⚠️ Never push without explicit permission

**This rule overrides every other instruction in this file, including the numbered checklists below.**

- **Never run `git push` (or any command that pushes to a remote) unless the user has explicitly asked for it in the current request.**
- Phrases like "publish a new post", "add this post", "create an app", or "ship X" do **not** authorize a push. They authorize creating files and (at most) a local commit.
- The numbered "Commit and push" steps in the checklists below describe the *full* publishing flow for reference. They are **not** standing authorization to push. Stop after staging (or committing locally, if asked) and wait.
- If you are unsure whether a push is wanted, **ask first**. Default: don't push.
- The same rule applies to any other irreversible or remote-affecting action: force-pushes, tag pushes, branch deletions on the remote, deploys triggered manually, etc.

When the user is ready, they will say something explicit like "push it", "push to main", or "go ahead and push". Only then run the push command.

---

## Publishing a New Post

When the user asks to publish or add a new blog post, complete **all** of the following steps:

### 1. Create the post HTML file
Add the post content to `content/posts/{slug}.html` as an HTML fragment (no `<html>` or `<body>` tags — just the article body starting with `<div class="article-body">`).

#### Punctuation style — avoid em-dashes
When writing prose for posts, **do not default to em-dashes (`—`)**. They read as AI-generated and clutter the rhythm. Prefer, in this order:
- **Commas** for light pauses and asides (`The algorithm was weak, and you'd stop after ten minutes.`)
- **Parentheses** for genuine asides or clarifications (`The replacements (thinner, flatter) don't quite nourish.`)
- **Periods** — just split the sentence in two.
- **Conjunctions** (`and`, `but`, `so`, `because`) to connect clauses naturally.

Em-dashes are fine sparingly (roughly one per post, max) for a deliberate dramatic break. If a draft has more than one or two, rewrite them.

### 2. Update the manifest
Add a new entry to `content/posts/manifest.json`:
```json
{
  "slug": "your-post-slug",
  "title": "Post Title",
  "description": "One or two sentence summary shown on the home page and in the RSS feed.",
  "date": "YYYY-MM-DD",
  "readTime": "~X min read",
  "category": "Category Name"
}
```
The manifest drives everything: home page listing, RSS feed, and post page rendering.

### 3. Add any images
Place post images in `public/images/posts/`. Reference them in the HTML as `/images/posts/filename.png`.

#### OG / meta images — always compress before adding
When adding an `image` field to the manifest for social share previews, **always compress the image first**:
```bash
sips -s format jpeg -s formatOptions 85 -Z 1200 input.png --out output.jpg
```
- Target format: **JPEG**, quality **85**, max dimension **1200px**
- Target size: under **400 KB** (original photos are often 2–5 MB — always check with `ls -lh`)
- Use the `.jpg` extension in the manifest `image` field
- Delete the original uncompressed file after converting

### 4. Commit locally — do NOT push
Stage and commit the new files locally:
```bash
git add content/posts/{slug}.html content/posts/manifest.json public/images/posts/{slug}-og.jpg
git commit -m "Add post: {title}"
```
**Stop here.** Do not push. Report the commit to the user and wait for explicit instruction to push.

### 5. Push (only when the user explicitly asks)
When, and only when, the user explicitly says to push, run:
```bash
git push git@github-personal:jhasubhash/subhashjha.in.git main
```

### 6. What happens automatically after push
- **Vercel** picks up the push and deploys the site

---

## Creating a New App

When the user asks to create an app or interactive demo, follow this structure:

### 1. Create the app folder
Add a self-contained folder under `public/apps/{app-name}/`:
```
public/apps/{app-name}/
  index.html   ← full HTML document (includes <html>, <head>, <body>)
  style.css    ← app styles (separate file, not inline)
  script.js    ← app logic (separate file, not inline)
```
Keep all assets relative (e.g. `<link rel="stylesheet" href="style.css">`). Do not reference `/apps/...` absolute paths inside the app — relative paths work for both direct access and iframe embedding.

### 2. Access URL
The app is accessible at `subhashjha.in/apps/{app-name}/` — no Next.js route needed, served as static files via the rewrite in `next.config.ts`.

### 3. Embedding in a blog post
To embed the app inside a post, import and use the `AppEmbed` component in the post's HTML or in the blog page. In an HTML post fragment, add:
```html
<!-- AppEmbed: app-name | Title of the app | height=500 -->
```
Or if wiring it directly in a TSX page:
```tsx
import AppEmbed from "@/components/AppEmbed";
<AppEmbed appName="app-name" title="Title" height={500} />
```

### 4. Commit locally — do NOT push
Stage and commit the new `public/apps/{app-name}/` folder (plus any post HTML changes) locally. **Stop there and wait for the user to explicitly ask for a push.** See the global "Never push without explicit permission" rule at the top of this file.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind v4 + custom CSS in `src/app/globals.css`
- **Fonts**: Playfair Display (serif headings) + DM Sans (body)
- **Comments**: Giscus (GitHub Discussions) — theme follows `document.documentElement.dataset.theme`
- **Newsletter**: None currently — RSS feed at `/feed.xml` is ready for a future newsletter service
- **RSS feed**: `/feed.xml` — dynamic Next.js route, auto-reflects manifest on every request
- **Deployment**: Vercel (auto-deploys on push to `main`)
- **Git remote**: `git@github-personal:jhasubhash/subhashjha.in.git` (uses `id_ed25519_personal` SSH key for `jhasubhash` GitHub account)

## Key Files

| File | Purpose |
|------|---------|
| `content/posts/manifest.json` | Source of truth for all posts |
| `content/posts/{slug}.html` | Post HTML content fragments |
| `public/images/posts/` | Post images |
| `src/lib/posts.ts` | Reads manifest and HTML files |
| `src/app/page.tsx` | Home page with post listing and pagination (10/page) |
| `src/app/blog/[slug]/page.tsx` | Individual post page |
| `src/app/feed.xml/route.ts` | RSS feed route |
| `src/components/GiscusComments.tsx` | Comments widget |
| `public/apps/{app-name}/` | Self-contained HTML/CSS/JS apps, served at `/apps/{app-name}/` |
| `src/components/AppEmbed.tsx` | Iframe embed component for apps inside blog posts |
| `next.config.ts` | Rewrite rule for clean `/apps/{name}` URLs |
