import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getAllPosts, getAllTags } from "@/lib/posts";

const POSTS_PER_PAGE = 10;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { page: pageParam, tag: tagParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));

  const allTags = getAllTags();
  const activeTag =
    tagParam && allTags.includes(tagParam) ? tagParam : undefined;

  const allPosts = getAllPosts().filter(
    (p) => !activeTag || (p.tags ?? []).includes(activeTag)
  );
  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const posts = allPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const pageHref = (n: number) =>
    activeTag
      ? `/?tag=${encodeURIComponent(activeTag)}&page=${n}`
      : `/?page=${n}`;

  return (
    <>
      <Nav />

      <div className="home-header">
        <div className="home-header-avatar">
          <Image
            src="/images/profile.jpg"
            alt="Subhash Jha"
            width={72}
            height={72}
            priority
          />
        </div>
        <div className="home-header-text">
          <h1>Subhash Jha</h1>
          <p>
            Software Developer at Adobe building Photoshop. Writing about macOS
            tools, systems programming, and creative software.
          </p>
        </div>
      </div>

      <div className="home-section">
        <div className="home-section-label">
          {activeTag ? `Tagged “${activeTag}”` : "Latest Writing"}
        </div>

        {allTags.length > 0 && (
          <nav className="tag-filter" aria-label="Filter posts by tag">
            <Link
              href="/"
              className={`tag-chip${activeTag ? "" : " tag-chip-active"}`}
            >
              All
            </Link>
            {allTags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className={`tag-chip${
                  activeTag === tag ? " tag-chip-active" : ""
                }`}
              >
                {tag}
              </Link>
            ))}
          </nav>
        )}

        {posts.map((post) => (
          <article key={post.slug} className="post-card">
            <div className="post-card-meta">
              <span className="post-card-category">{post.category}</span>
              <span>·</span>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
            <Link href={`/blog/${post.slug}`} className="post-card-title">
              {post.title}
            </Link>
            <p className="post-card-desc">{post.description}</p>
            <div className="post-card-footer">
              <Link href={`/blog/${post.slug}`} className="read-more">
                Read →
              </Link>
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <p className="tag-empty">No posts tagged “{activeTag}” yet.</p>
        )}

        {totalPages > 1 && (
          <nav className="pagination">
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)} className="pagination-link">
                ← Newer
              </Link>
            ) : (
              <span className="pagination-link pagination-disabled">← Newer</span>
            )}
            <span className="pagination-info">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link href={pageHref(currentPage + 1)} className="pagination-link">
                Older →
              </Link>
            ) : (
              <span className="pagination-link pagination-disabled">Older →</span>
            )}
          </nav>
        )}
      </div>

    </>
  );
}
