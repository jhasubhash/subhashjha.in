import Link from "next/link";

export default function Nav() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-nav-brand">
        Subhash Jha
      </Link>
      <ul className="site-nav-links">
        <li>
          <Link href="/">Blog</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <a href="https://github.com/jhasubhash" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a href="https://x.com/subhashjha333" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
        </li>
      </ul>
    </nav>
  );
}
