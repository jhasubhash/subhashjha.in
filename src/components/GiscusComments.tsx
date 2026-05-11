"use client";

import Giscus from "@giscus/react";
import { useEffect, useState } from "react";

export default function GiscusComments() {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}`;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? "";
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? "Comments";
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? "";

  // Reads data-theme attribute from <html> — defaults to "light" until dark mode is added.
  // When a theme toggle sets document.documentElement.dataset.theme = "dark",
  // Giscus will update automatically via the MutationObserver.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const getTheme = () =>
      (document.documentElement.dataset.theme as "light" | "dark") ?? "light";

    setTheme(getTheme());

    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  if (!repoId || repoId === "REPLACE_WITH_REPO_ID") {
    return (
      <div className="giscus-placeholder">
        <p>
          Comments coming soon.{" "}
          <a href="https://giscus.app" target="_blank" rel="noopener noreferrer">
            Set up Giscus
          </a>{" "}
          to enable GitHub-powered comments.
        </p>
      </div>
    );
  }

  return (
    <Giscus
      repo={repo}
      repoId={repoId}
      category={category}
      categoryId={categoryId}
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme={theme}
      lang="en"
      loading="lazy"
    />
  );
}
