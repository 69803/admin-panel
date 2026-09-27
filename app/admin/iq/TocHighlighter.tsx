"use client";

import { useEffect } from "react";

// Resalta en el índice la sección visible (solo visual, no carga texto)
export default function TocHighlighter() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("#toc-list a"));
    const sections = links.map((a) => document.querySelector<HTMLElement>(a.getAttribute("href")!));
    function onScroll() {
      const pos = window.scrollY + 120;
      let activeIdx = 0;
      sections.forEach((sec, i) => { if (sec && sec.offsetTop <= pos) activeIdx = i; });
      links.forEach((a, i) => a.classList.toggle("active", i === activeIdx));
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
