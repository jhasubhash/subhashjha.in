import Nav from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps",
  description: "Side projects and apps by Subhash Jha.",
};

type App = {
  name: string;
  description: string;
  url: string;
  tag: string;
};

const apps: App[] = [
  {
    name: "Links",
    description: "A native macOS bookmark manager with lightning-fast fuzzy search, one-shortcut save from any browser, menu bar access, and iCloud sync. Supports folders, tags, smart filters, and favorites. Free — requires macOS 14+ on Apple Silicon.",
    url: "https://links.onesyntax.in/",
    tag: "macOS App",
  },
  {
    name: "Collective",
    description: "An offline-first macOS app for AI-powered collaborative knowledge. Share documents, chat with AI, and collaborate peer-to-peer — all without a server.",
    url: "https://collective.onesyntax.in/",
    tag: "macOS App",
  },
];

export default function AppsPage() {
  return (
    <>
      <Nav />

      <div className="apps-page">
        <div className="apps-header">
          <div className="apps-header-label">Apps</div>
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
          {apps.map((app) => (
            <a
              key={app.url}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="app-card"
            >
              <div className="app-card-tag">{app.tag}</div>
              <div className="app-card-name">{app.name}</div>
              <p className="app-card-desc">{app.description}</p>
              <span className="app-card-link">Visit ↗</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
