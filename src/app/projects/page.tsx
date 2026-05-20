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
      </div>
    </>
  );
}
