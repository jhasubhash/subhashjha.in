#!/bin/bash

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$REPO_DIR/content/posts/manifest.json"
TODAY=$(date +%Y-%m-%d)

echo "Today: $TODAY"
echo "Checking for drafts ready to publish..."

# Update manifest in-place, print published slugs to stdout
CHANGED=$(TODAY="$TODAY" MANIFEST="$MANIFEST" python3 << 'PYEOF'
import json, os

today = os.environ["TODAY"]
manifest_path = os.environ["MANIFEST"]

with open(manifest_path) as f:
    posts = json.load(f)

changed = []
for post in posts:
    if post.get("status") == "draft" and post.get("date") and post["date"] <= today:
        post["status"] = "published"
        changed.append(post["slug"])

with open(manifest_path, "w") as f:
    json.dump(posts, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("\n".join(changed))
PYEOF
)

if [ -z "$CHANGED" ]; then
  echo "Nothing to publish."
  exit 0
fi

echo "Publishing:"
while IFS= read -r slug; do
  echo "  - $slug"
done <<< "$CHANGED"

SLUGS_INLINE=$(echo "$CHANGED" | tr '\n' ',' | sed 's/,$//')

cd "$REPO_DIR"
git add content/posts/manifest.json
git commit -m "publish: $SLUGS_INLINE ($TODAY)"
git push git@github-personal:jhasubhash/subhashjha.in.git main

echo "Done."
