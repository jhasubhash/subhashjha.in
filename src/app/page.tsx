import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getAllPosts } from "@/lib/posts";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <>
      <Nav />

      <div className="home-header">
        <div className="home-header-avatar">
          <Image
            src="/images/profile.png"
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
      </div>

      <footer className="site-footer">
        <p>© 2026 Subhash Jha</p>
      </footer>
    </>
  );
}
