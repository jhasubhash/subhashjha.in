import Nav from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Side projects and apps by Subhash Jha.",
};

type Project = {
  name: string;
  description: string;
  url: string;
  tag: string;
  draft?: boolean;
};

const projects: Project[] = [
  {
    name: "Links",
    description: "A native macOS bookmark manager with lightning-fast fuzzy search, one-shortcut save from any browser, menu bar access, and iCloud sync. Supports folders, tags, smart filters, and favorites. Free — requires macOS 14+ on Apple Silicon.",
    url: "https://links.onesyntax.in/",
    tag: "macOS App",
    draft: true,
  },
  {
    name: "Collective",
    description: "An offline-first macOS app for AI-powered collaborative knowledge. Share documents, chat with AI, and collaborate peer-to-peer — all without a server.",
    url: "https://collective.onesyntax.in/",
    tag: "macOS App",
    draft: true,
  },
];

const published = projects.filter((p) => !p.draft);

export default function ProjectsPage() {
  return (
    <>
      <Nav />

      <div className="apps-page">
        <div className="apps-header">
          <div className="apps-header-label">Projects</div>
          <h1 className="apps-header-title">Things I&apos;ve built</h1>
          <p className="apps-header-desc">
            Side projects, tools, and experiments.{" "}
            Things that{" "}
            <em style={{ color: "#c4622d", fontStyle: "normal" }}>scratched an itch</em>{" "}
            or turned into{" "}
            <em style={{ color: "#c4622d", fontStyle: "normal" }}>something useful</em>.
          </p>
        </div>

        {published.length === 0 ? (
          <div className="apps-empty-card">
            <div className="apps-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
              </svg>
            </div>
            <div className="apps-empty-label">Workshop in progress</div>
            <p className="apps-empty-text">
              I&apos;ve built a handful of small utility apps that solve very specific problems of mine, but nothing polished enough to share publicly yet.{" "}
              <em className="apps-empty-em">Keep watching this space</em>{" "}
              for something cool.
            </p>
            <div className="apps-empty-rule" aria-hidden="true">❖</div>
          </div>
        ) : (
          <div className="apps-grid">
            {published.map((project) => (
              <a
                key={project.url}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-card"
              >
                <div className="app-card-tag">{project.tag}</div>
                <div className="app-card-name">{project.name}</div>
                <p className="app-card-desc">{project.description}</p>
                <span className="app-card-link">Visit ↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
