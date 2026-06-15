import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-nav-brand">
        Subhash Jha
      </Link>
      <ul className="site-nav-links">
        <li>
          <Link href="/projects">Projects</Link>
        </li>
        <li>
          <Link href="/gallery">Gallery</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <ThemeToggle />
        </li>
      </ul>
    </nav>
  );
}
