# subhashjha.in — Project Guide for Claude

## Publishing a New Post

When the user asks to publish or add a new blog post, complete **all** of the following steps:

### 1. Create the post HTML file
Add the post content to `content/posts/{slug}.html` as an HTML fragment (no `<html>` or `<body>` tags — just the article body starting with `<div class="article-body">`).

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
The manifest drives everything: home page listing, RSS feed, post page rendering, and the Beehiiv draft automation.

### 3. Add any images
Place post images in `public/images/posts/`. Reference them in the HTML as `/images/posts/filename.png`.

### 4. Commit and push
Push to `main` on the personal GitHub remote:
```bash
git push git@github-personal:jhasubhash/subhashjha.in.git main
```

### 5. What happens automatically after push
- **Vercel** picks up the push and deploys the site
- **GitHub Actions** detects the new entry in `manifest.json` and creates a **draft post in Beehiiv** with the post content pre-filled

### 6. Remind the user
After pushing, always remind the user:

> "A draft has been created in your Beehiiv dashboard. Go to [app.beehiiv.com](https://app.beehiiv.com), review the draft, and click **Send** to notify your subscribers."

---

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind v4 + custom CSS in `src/app/globals.css`
- **Fonts**: Playfair Display (serif headings) + DM Sans (body)
- **Comments**: Giscus (GitHub Discussions) — theme follows `document.documentElement.dataset.theme`
- **Newsletter**: Beehiiv embed (`src/components/NewsletterSignup.tsx`)
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
| `src/components/NewsletterSignup.tsx` | Beehiiv subscribe form |
| `.github/workflows/beehiiv-draft.yml` | Auto-creates Beehiiv draft on new post |
| `.github/scripts/create-beehiiv-draft.mjs` | Script called by the action |
