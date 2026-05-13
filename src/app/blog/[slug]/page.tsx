import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import GiscusComments from "@/components/GiscusComments";
import { getAllPosts, getPost, getPostContent } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const content = getPostContent(slug);

  return (
    <>
      <Nav />

      <div className="post-back">
        <Link href="/">← All posts</Link>
      </div>

      <div className="masthead">
        Personal Blog &nbsp;·&nbsp; {post.category}
      </div>

      <div className="hero">
        <div className="hero-kicker">{post.category}</div>
        {post.htmlTitle ? (
          <h1 dangerouslySetInnerHTML={{ __html: post.htmlTitle }} />
        ) : (
          <h1>{post.title}</h1>
        )}
        <p className="hero-dek">{post.description}</p>
        <div className="byline">
          <span>
            <strong>Subhash Jha</strong> &nbsp;·&nbsp; {formatDate(post.date)}
          </span>
          <span>{post.readTime}</span>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: content }} />

      <div className="comments-section">
        <h2 className="comments-heading">Comments</h2>
        <GiscusComments />
      </div>

    </>
  );
}
