import { execSync } from "child_process";
import { readFileSync } from "fs";

const { BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID, FORCE_SLUG } = process.env;

if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
  console.error("Missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID");
  process.exit(1);
}

// Read current manifest
const currentManifest = JSON.parse(
  readFileSync("content/posts/manifest.json", "utf8")
);

let newPosts;

if (FORCE_SLUG) {
  // Manual run: create draft for the specified slug
  const post = currentManifest.find((p) => p.slug === FORCE_SLUG);
  if (!post) {
    console.error(`Slug "${FORCE_SLUG}" not found in manifest.`);
    process.exit(1);
  }
  newPosts = [post];
} else {
  // Automatic run: diff against previous commit
  let prevManifest = [];
  try {
    const prevJson = execSync("git show HEAD~1:content/posts/manifest.json").toString();
    prevManifest = JSON.parse(prevJson);
  } catch {
    // First commit — all posts are new
  }
  const prevSlugs = new Set(prevManifest.map((p) => p.slug));
  newPosts = currentManifest.filter((p) => !prevSlugs.has(p.slug));
}

if (newPosts.length === 0) {
  console.log("No new posts detected, skipping.");
  process.exit(0);
}

for (const post of newPosts) {
  console.log(`Creating Beehiiv draft for: ${post.title}`);

  const htmlContent = readFileSync(`content/posts/${post.slug}.html`, "utf8");

  const payload = {
    title: post.title,
    subtitle: post.description,
    content: {
      free: {
        web: htmlContent,
        email: htmlContent,
      },
    },
    status: "draft",
    channel: "email",
  };

  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/posts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BEEHIIV_API_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Beehiiv API error:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`Draft created: ${data.data?.id ?? JSON.stringify(data)}`);
}
