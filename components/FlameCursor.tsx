"use client";

import { useEffect, useRef } from "react";
import styles from "./FlameCursor.module.css";

export default function FlameCursor() {
  const flameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!flameRef.current) return;

      flameRef.current.style.left = `${e.clientX}px`;
      flameRef.current.style.top = `${e.clientY}px`;

      const particle = document.createElement("div");

      particle.className = styles.flameParticle;

      particle.style.left = `${e.clientX}px`;
      particle.style.top = `${e.clientY + 10}px`;

      particle.style.setProperty(
        "--drift",
        `${Math.random() * 30 - 15}px`
      );

      particle.style.setProperty(
        "--rise",
        `${Math.random() * 30 + 20}px`
      );

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 600);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <div ref={flameRef} className={styles.flameCursor} />;
}