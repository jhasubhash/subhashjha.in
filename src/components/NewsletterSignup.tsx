"use client";

import { useEffect, useRef } from "react";

export default function NewsletterSignup() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement("script");
    script.src = "https://subscribe-forms.beehiiv.com/v3/loader.js";
    script.async = true;
    script.dataset.beehiivForm = "22c10230-997b-4e43-be17-499280a82016";
    ref.current.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <div className="newsletter-section">
      <div ref={ref} />
    </div>
  );
}
