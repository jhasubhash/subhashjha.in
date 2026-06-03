import Image from "next/image";
import Nav from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Senior software engineer at Adobe with 10+ years building Photoshop, Illustrator, XD, and Dreamweaver.",
};

type Role = {
  title: string;
  company: string;
  period: string;
  bullets: string[];
  stack: string;
};

const roles: Role[] = [
  {
    title: "Senior Computer Scientist",
    company: "Adobe Systems",
    period: "Jul 2023 – Present",
    bullets: [
      "Integrated Content Authenticity Initiative (CAI) into Photoshop desktop, enabling provenance tracking for millions of creative assets.",
      "Built and shipped generative AI workflows in Photoshop, putting GenAI directly into the creative process.",
      "Wrote high-performance image filters in Halide, optimizing pixel-level operations for real-time preview.",
    ],
    stack: "C++ · JavaScript · Halide",
  },
  {
    title: "Computer Scientist",
    company: "Adobe Systems",
    period: "Jan 2019 – Jun 2023",
    bullets: [
      "Implemented vector tooling for Creative Cloud Web (CCWeb), bringing desktop-grade drawing to the browser.",
      "Engineered cloud document sync for Photoshop desktop, enabling seamless save and retrieval of PSDs across devices.",
      "Prototyped Adobe XD as a web app by porting the C++ codebase to WebAssembly via Emscripten/Embind.",
      "Prototyped Language Server Protocol integration for the Brackets code editor.",
    ],
    stack: "C++ · JavaScript · WebAssembly · Emscripten",
  },
  {
    title: "Member of Technical Staff",
    company: "Adobe Systems",
    period: "Mar 2016 – Jan 2019",
    bullets: [
      "Shipped Bootstrap 4 support in Adobe Dreamweaver, enabling modern responsive web design workflows.",
      "Containerized Dreamweaver microservices with Docker, improving deployment reliability.",
      "Migrated Adobe Illustrator's legacy C++ UI framework to the ES6-based Torq framework.",
      "Built the multi-RIP architecture for Adobe Print Engine for concurrent print job processing.",
    ],
    stack: "C · C++ · JavaScript · PostScript · PDF · Docker",
  },
  {
    title: "Firmware Engineer — LTE Physical Layer",
    company: "Intel Corporation",
    period: "Jun 2015 – Mar 2016",
    bullets: [
      "Wrote drivers for the LTE/4G modem measurement module, supporting physical-layer signal processing and diagnostics.",
    ],
    stack: "C++",
  },
];

const patents = [
  {
    title: "Quantifying Generative AI Usage in Digital Content",
    desc: "Pixel-level tracking of AI-generated vs. human-created content. A Source Info Mask (SIM) traces pixel origins across layers and operations, computing a Generative AI Pixel Ratio at export for transparent provenance.",
  },
  {
    title: "Light-Aware Dynamic Color Palette Generation",
    desc: "Automatically adjusts color palettes to scene lighting. Designers work with a single palette that adapts shades and hues to configurable light sources, keeping color consistent across varying illumination.",
  },
];

const skillGroups: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["C", "C++", "JavaScript", "TypeScript", "PostScript"] },
  { label: "Technologies", items: ["WebAssembly", "Emscripten / Embind", "Halide", "Docker", "React", "Next.js"] },
  { label: "Domains", items: ["Image Processing", "Generative AI", "Desktop Apps", "Web Apps", "Print Engines"] },
];

export default function AboutPage() {
  return (
    <>
      <Nav />

      <div className="about-page">
        <div className="about-hero">
          <div className="about-avatar">
            <Image
              src="/images/profile.jpg"
              alt="Subhash Jha"
              width={240}
              height={240}
              priority
            />
          </div>
          <div className="about-hero-text">
            <h1 className="about-name">Subhash Jha</h1>
            <p className="about-tagline">
              Senior software engineer building Adobe Photoshop. Bangalore, India.
            </p>
            <div className="about-hero-links">
              <a href="https://www.linkedin.com/in/scjha/" target="_blank" rel="noopener noreferrer" className="about-link">LinkedIn</a>
              <span className="about-link-sep">·</span>
              <a href="https://github.com/jhasubhash" target="_blank" rel="noopener noreferrer" className="about-link">GitHub</a>
              <span className="about-link-sep">·</span>
              <a href="https://x.com/subhashjha333" target="_blank" rel="noopener noreferrer" className="about-link">Twitter</a>
              <span className="about-link-sep">·</span>
              <a href="mailto:contact@subhashjha.in" className="about-link">Email</a>
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">About</div>
          <p>
            I&apos;m a senior software engineer with 10+ years at{" "}
            <strong style={{ color: "var(--ink)" }}>Adobe</strong>, building
            creative tools used by millions. Deep expertise in C++ systems
            programming, image processing, and WebAssembly. Recent focus:
            generative AI workflows and content authenticity in{" "}
            <strong style={{ color: "var(--ink)" }}>Photoshop</strong>.
          </p>
          <p>
            Across my career I&apos;ve shipped features in Photoshop,
            Illustrator, XD, Dreamweaver, and the Adobe Print Engine. I love
            problems that sit close to the metal: pixels, performance, and the
            quiet craft of making creative software feel alive.
          </p>
        </div>

        <div className="about-section">
          <div className="about-section-title">Now</div>
          <p>
            Shipping generative AI features in Photoshop and writing about
            craft, tools, and the small things that make software feel
            considered. Tinkering with macOS automation, GPU programming, and
            the occasional weekend web app.
          </p>
        </div>

        <div className="about-section">
          <div className="about-section-title">Work</div>
          <ol className="timeline">
            {roles.map((r) => (
              <li key={r.title + r.period} className="timeline-item">
                <div className="timeline-dot" aria-hidden />
                <div className="timeline-period">{r.period}</div>
                <div className="timeline-role">{r.title}</div>
                <div className="timeline-company">{r.company}</div>
                <ul className="timeline-bullets">
                  {r.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <div className="timeline-stack">{r.stack}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="about-section">
          <div className="about-section-title">Patents (filed)</div>
          {patents.map((p) => (
            <div key={p.title} className="about-patent">
              <div className="about-patent-title">{p.title}</div>
              <div className="about-patent-desc">{p.desc}</div>
            </div>
          ))}
        </div>

        <div className="about-section">
          <div className="about-section-title">Skills</div>
          <div className="about-skill-groups">
            {skillGroups.map((g) => (
              <div key={g.label} className="about-skill-group">
                <div className="about-skill-group-label">{g.label}</div>
                <div className="about-skills">
                  {g.items.map((s) => (
                    <span key={s} className="about-skill">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">Education</div>
          <div className="about-edu">
            <div className="about-edu-degree">M.Tech, Computer Science — IIT Madras</div>
            <div className="about-edu-meta">2015 · CGPA 8.66 · Graph Theory (Strong Rainbow Connectivity)</div>
          </div>
          <div className="about-edu-note">
            GATE 2013 — All India Rank 124, Computer Science.
          </div>
        </div>
      </div>
    </>
  );
}
