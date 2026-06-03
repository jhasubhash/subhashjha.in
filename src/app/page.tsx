import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getAllPosts } from "@/lib/posts";

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
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const allPosts = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const posts = allPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

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
        <div className="home-section-label">Latest Writing</div>

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
            <Link href={`/blog/${post.slug}`} className="read-more">
              Read →
            </Link>
          </article>
        ))}

        {totalPages > 1 && (
          <nav className="pagination">
            {currentPage > 1 ? (
              <Link href={`/?page=${currentPage - 1}`} className="pagination-link">
                ← Newer
              </Link>
            ) : (
              <span className="pagination-link pagination-disabled">← Newer</span>
            )}
            <span className="pagination-info">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link href={`/?page=${currentPage + 1}`} className="pagination-link">
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
