import Image from "next/image";
import Nav from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Software Developer at Adobe Systems working on Photoshop.",
};

export default function AboutPage() {
  const skills = [
    "C / C++", "TypeScript", "JavaScript", "WebAssembly",
    "Rust", "GPU Programming", "Halide", "WebGPU",
    "React", "Next.js", "UXP", "CEP",
  ];

  return (
    <>
      <Nav />

      <div className="about-page">
        <div className="about-header">
          <div className="about-avatar">
            <Image
              src="/images/profile.png"
              alt="Subhash Jha"
              width={88}
              height={88}
              priority
            />
          </div>
          <div>
            <div className="about-name">Subhash Jha</div>
            <div className="about-tagline">
              Software Developer @ Adobe Systems · Bangalore, India
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">About</div>
          <p>
            I&apos;m a software developer based in Bangalore, India, currently
            building{" "}
            <strong style={{ color: "var(--ink)" }}>Adobe Photoshop</strong> —
            shipping features and performance improvements to millions of
            creatives around the world.
          </p>
          <p>
            I&apos;m passionate about systems programming, creative tools, and
            making software that sparks joy. When I&apos;m not pushing commits,
            you&apos;ll find me deep in macOS automation, playing on my PS5, or
            tinkering with side projects.
          </p>
        </div>

        <div className="about-section">
          <div className="about-section-title">Work</div>
          <div className="about-work-item">
            <div className="about-work-role">Adobe Photoshop</div>
            <div className="about-work-meta">Adobe Systems · 2019 – Present</div>
            <div className="about-work-desc">
              Core rendering, performance, and new features on the world&apos;s
              leading image editing software.
            </div>
          </div>
          <div className="about-work-item">
            <div className="about-work-role">Adobe Illustrator</div>
            <div className="about-work-meta">Adobe Systems</div>
            <div className="about-work-desc">
              Tooling, performance, and creative workflows on the
              industry-standard vector graphics editor.
            </div>
          </div>
          <div className="about-work-item">
            <div className="about-work-role">Adobe Dreamweaver</div>
            <div className="about-work-meta">Adobe Systems</div>
            <div className="about-work-desc">
              Editor features, preview engine, and front-end integrations for
              the classic web design tool.
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">Skills</div>
          <div className="about-skills">
            {skills.map((s) => (
              <span key={s} className="about-skill">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">Find me</div>
          <div className="about-links">
            <a
              href="https://www.linkedin.com/in/scjha/"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/jhasubhash"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              GitHub
            </a>
            <a
              href="https://x.com/subhashjha333"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              Twitter
            </a>
            <a
              href="https://substack.com/@jhasubhash"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              Substack
            </a>
            <a href="mailto:contact@subhashjha.in" className="about-link">
              Email
            </a>
          </div>
        </div>
      </div>

    </>
  );
}
