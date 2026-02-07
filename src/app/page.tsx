"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ── Pixel-art star field (canvas) ── */
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      phase: number;
    }
    const stars: Star[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() > 0.85 ? 3 : Math.random() > 0.5 ? 2 : 1,
      speed: 0.1 + Math.random() * 0.3,
      opacity: Math.random(),
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.opacity = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.001 + s.phase));
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      }
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ── XP / Skill bar ── */
function SkillBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1" style={{ fontSize: "8px" }}>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="w-full h-4 pixel-border"
        style={{ background: "#0a0a0a", borderColor: "#333", boxShadow: "none" }}
      >
        <div
          className="h-full xp-bar-fill"
          style={{ width: `${pct}%`, background: color, imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({
  id,
  title,
  children,
  delay = 0,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      id={id}
      className="fade-in-up relative mx-auto max-w-4xl px-4 py-16"
      style={{ animationDelay: `${delay}s` }}
    >
      <h2
        className="glitch-text mb-8 text-center"
        style={{
          fontSize: "16px",
          color: "var(--accent-alt)",
          letterSpacing: "2px",
        }}
      >
        {">> "}{title}{" <<"}
      </h2>
      {children}
    </section>
  );
}

/* ── Social icon (pixel-style SVG inlined) ── */
function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group relative inline-flex items-center justify-center w-12 h-12 pixel-border transition-transform hover:scale-110"
      style={{
        background: "var(--bg-mid)",
        borderColor: "var(--accent)",
      }}
    >
      {icon}
    </a>
  );
}

/* ── MAIN PAGE ── */
export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const t = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(t);
  }, []);

  const skills = [
    { label: "C / C++", pct: 95, color: "#e94560" },
    { label: "Photoshop Core", pct: 90, color: "#f5c518" },
    { label: "TypeScript / JS / WASM", pct: 85, color: "#0ff" },
    { label: "GPU Programming (Halide, WebGPU)", pct: 80, color: "#6cf" },
    { label: "Rust", pct: 60, color: "#ff7043" },
  ];

  const projects = [
    {
      name: "Adobe Photoshop",
      desc: "Working on the world's leading image editing software — core rendering, performance, and new features.",
      tech: ["C++", "CEP", "UXP"],
    },
    {
      name: "Adobe Illustrator",
      desc: "Contributed to the industry-standard vector graphics editor — tooling, performance, and creative workflows.",
      tech: ["C++", "CEP", "UXP", "Scripting"],
    },
    {
      name: "Adobe Dreamweaver",
      desc: "Worked on the classic web design & development tool — editor features, preview engine, and front-end integrations.",
      tech: ["C++", "JavaScript", "HTML", "CSS"],
    },
  ];

  return (
    <>
      <StarField />

      {/* ── BOOT SCREEN ── */}
      <div
        className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-700"
        style={{
          zIndex: 100,
          background: "var(--bg-dark)",
          opacity: showContent ? 0 : 1,
          pointerEvents: showContent ? "none" : "auto",
        }}
      >
        <p style={{ fontSize: "10px", color: "var(--accent)" }} className="cursor-blink">
          LOADING PORTFOLIO...
        </p>
        <div className="mt-4 w-48 h-4 pixel-border" style={{ background: "#0a0a0a", borderColor: "#333", boxShadow: "none" }}>
          <div
            className="h-full"
            style={{
              width: loaded ? "100%" : "0%",
              background: "var(--accent)",
              transition: "width 0.5s ease-out",
            }}
          />
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        className="relative transition-opacity duration-700"
        style={{ zIndex: 1, opacity: showContent ? 1 : 0 }}
      >
        {/* ── NAV BAR ── */}
        <nav
          className="fixed top-0 left-0 right-0 flex items-center justify-center gap-6 py-3 px-4"
          style={{
            zIndex: 50,
            background: "rgba(26,26,46,0.92)",
            borderBottom: "2px solid var(--accent)",
            fontSize: "8px",
          }}
        >
          {["home", "about", "skills", "projects", "contact"].map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="uppercase tracking-widest transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--text-muted)" }}
            >
              {s}
            </a>
          ))}
        </nav>

        {/* ══════════════════════════ HERO ══════════════════════════ */}
        <header
          id="home"
          className="relative flex flex-col items-center justify-center overflow-hidden"
          style={{ minHeight: "100vh" }}
        >
          {/* Cover as parallax BG */}
          <div className="absolute inset-0">
            <Image
              src="/images/cover.png"
              alt="cover"
              fill
              priority
              className="object-cover"
              style={{ opacity: 0.25, filter: "blur(1px)" }}
            />
            {/* Gradient fade */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,26,46,0.5) 0%, var(--bg-dark) 100%)",
              }}
            />
          </div>

          <div className="relative flex flex-col items-center gap-6 text-center px-4 pt-24">
            {/* Profile image (pixel-border) */}
            <div className="float-anim">
              <div
                className="pixel-border-gold overflow-hidden flex items-center justify-center"
                style={{ width: 140, height: 180 }}
              >
                <Image
                  src="/images/profile.png"
                  alt="Subhash Jha"
                  width={180}
                  height={230}
                  priority
                  className="object-cover"
                  style={{ imageRendering: "pixelated", width: "130%", height: "130%", maxWidth: "none" }}
                />
              </div>
            </div>

            <h1
              className="glitch-text"
              style={{ fontSize: "22px", color: "var(--accent-alt)", lineHeight: 1.6 }}
            >
              SUBHASH JHA
            </h1>
            <p style={{ fontSize: "9px", color: "var(--text-muted)", maxWidth: 480, lineHeight: 2 }}>
              Software Developer @ <span style={{ color: "var(--accent)" }}>Adobe Systems</span>{" "}
              · Building{" "}
              <span style={{ color: "var(--accent-alt)" }}>Photoshop</span>{" "}
              · Bangalore, India 🇮🇳
            </p>

            {/* Social row */}
            <div className="flex gap-4 mt-2">
              <SocialLink
                href="https://www.linkedin.com/in/scjha/"
                label="LinkedIn"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text)">
                    <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm13.5 11.27h-3v-5.6c0-3.37-4-3.12-4 0v5.6h-3v-10h3v1.76c1.4-2.59 7-2.78 7 2.48v5.76z" />
                  </svg>
                }
              />
              <SocialLink
                href="https://github.com/jhasubhash"
                label="GitHub"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text)">
                    <path d="M12 .5c-6.63 0-12 5.37-12 12 0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58 4.77-1.59 8.21-6.09 8.21-11.39 0-6.63-5.37-12-12-12z" />
                  </svg>
                }
              />
              <SocialLink
                href="https://x.com/subhashjha333"
                label="Twitter / X"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text)">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                }
              />
              <SocialLink
                href="https://substack.com/@jhasubhash"
                label="Substack"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text)">
                    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24l9.6-5.55 9.48 5.55V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
                  </svg>
                }
              />
            </div>

            {/* Scroll hint */}
            <div className="mt-12 float-anim" style={{ fontSize: "8px", color: "var(--text-muted)" }}>
              ▼ SCROLL DOWN ▼
            </div>
          </div>

          {/* Ground / terrain strip */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: `repeating-linear-gradient(90deg, #2d6a4f 0px, #2d6a4f 8px, #1b4332 8px, #1b4332 16px)`,
              borderTop: "4px solid #52b788",
              animation: "scrollGround 4s linear infinite",
            }}
          />
        </header>

        {/* ══════════════════════════ ABOUT ══════════════════════════ */}
        <Section id="about" title="ABOUT ME" delay={0.1}>
          <div
            className="pixel-border mx-auto max-w-2xl p-6"
            style={{ background: "var(--bg-mid)" }}
          >
            <p style={{ fontSize: "9px", lineHeight: 2.4, color: "var(--text-muted)" }}>
              Hey there! I&apos;m <span style={{ color: "var(--accent)" }}>Subhash Jha</span>, a
              software developer based in Bangalore, India. I currently work at{" "}
              <span style={{ color: "var(--accent-alt)" }}>Adobe Systems</span> on the{" "}
              <span style={{ color: "var(--accent-alt)" }}>Adobe Photoshop</span> team — shipping
              features and performance improvements to millions of creatives
              around the world.
            </p>
            <p className="mt-4" style={{ fontSize: "9px", lineHeight: 2.4, color: "var(--text-muted)" }}>
              I&apos;m passionate about systems programming, creative tools,
              pixel art, and building things that spark joy. When I&apos;m not
              pushing commits, you can find me exploring new games on my PS5, tinkering
              with side projects, or writing on Substack.
            </p>
          </div>
        </Section>

        {/* ══════════════════════════ SKILLS ══════════════════════════ */}
        <Section id="skills" title="SKILL TREE" delay={0.2}>
          <div
            className="pixel-border mx-auto max-w-xl p-6"
            style={{ background: "var(--bg-mid)" }}
          >
            <p className="mb-6 text-center" style={{ fontSize: "8px", color: "var(--text-muted)" }}>
              ★ XP BARS ★
            </p>
            {skills.map((s) => (
              <SkillBar key={s.label} {...s} />
            ))}
          </div>
        </Section>

        {/* ══════════════════════════ PROJECTS ══════════════════════════ */}
        <Section id="projects" title="QUEST LOG" delay={0.3}>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {projects.map((p) => (
              <div
                key={p.name}
                className="pixel-border p-5 transition-transform hover:scale-105"
                style={{ background: "var(--bg-mid)" }}
              >
                <h3
                  className="mb-3"
                  style={{ fontSize: "10px", color: "var(--accent-alt)" }}
                >
                  {p.name}
                </h3>
                <p style={{ fontSize: "8px", lineHeight: 2.2, color: "var(--text-muted)" }}>
                  {p.desc}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tech.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: "7px",
                        padding: "2px 6px",
                        background: "var(--accent)",
                        color: "#fff",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════ CONTACT ══════════════════════════ */}
        <Section id="contact" title="SEND MESSAGE" delay={0.4}>
          <div
            className="pixel-border mx-auto max-w-md p-6 text-center"
            style={{ background: "var(--bg-mid)" }}
          >
            <p style={{ fontSize: "9px", lineHeight: 2.2, color: "var(--text-muted)" }}>
              Want to collaborate, chat about retro games, or just say hi?
              Find me on any of the platforms below.
            </p>
            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              <a
                href="mailto:contact@subhashjha.in"
                className="pixel-border px-4 py-2 transition-transform hover:scale-105"
                style={{
                  fontSize: "8px",
                  background: "#4caf50",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                ✉ EMAIL
              </a>
              <a
                href="https://www.linkedin.com/in/scjha/"
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-border px-4 py-2 transition-transform hover:scale-105"
                style={{
                  fontSize: "8px",
                  background: "var(--accent)",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                LINKEDIN
              </a>
              <a
                href="https://x.com/subhashjha333"
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-border px-4 py-2 transition-transform hover:scale-105"
                style={{
                  fontSize: "8px",
                  background: "var(--accent-alt)",
                  color: "#000",
                  textDecoration: "none",
                }}
              >
                TWITTER
              </a>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════ FOOTER ══════════════════════════ */}
        <footer
          className="py-8 text-center"
          style={{
            fontSize: "7px",
            color: "var(--text-muted)",
            borderTop: "2px solid var(--accent)",
          }}
        >
          <p>© 2026 SUBHASH JHA · BUILT WITH NEXT.JS & PIXELS</p>
          <p className="mt-1" style={{ color: "var(--accent)" }}>
            PRESS START TO CONTINUE ▶
          </p>
        </footer>
      </div>
    </>
  );
}
