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
          <Link href="/projects">Projects</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
      </ul>
    </nav>
  );
}
