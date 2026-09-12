"use client";

import { useEffect, useState } from "react";
import styles from "./splash.module.css";
import FlameCursor from "@/components/FlameCursor";

export default function Splash() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [litCandles, setLitCandles] = useState<Set<number>>(new Set());

  const igniteCandle = (id: number) => {
    setLitCandles((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const seen = sessionStorage.getItem("intro-seen");
    if (seen) return;

    setVisible(true);
    sessionStorage.setItem("intro-seen", "true");
  }, []);

  const dismiss = () => {
    if (hiding) return;

    setHiding(true);

    setTimeout(() => setVisible(false), 400);
  };

  const candles = Array.from({ length: 50 }, (_, i) => {
    const angle = (i / 50) * Math.PI * 2;

    return {
      id: i,
      x: 50 + Math.cos(angle) * 42,
      y: 50 + Math.sin(angle) * 42,
    };
  });

  if (!visible) return null;

  return (
    <div
      className={`${styles.overlay} ${hiding ? styles.hide : ""}`}
      onClick={dismiss}
    >
      
      <FlameCursor />
      <div className={styles.candleCircle}>
        {candles.map((candle) => (
          <div
            key={candle.id}
            className={`${styles.candle} ${
              litCandles.has(candle.id) ? styles.lit : ""
            }`}
            style={{
              left: `${candle.x}%`,
              top: `${candle.y}%`,
            }}
            onMouseEnter={() => igniteCandle(candle.id)}
          >
            <div className={styles.flame}>
              <div className={styles.flameInner} />
            </div>

            <div className={styles.wick} />

            <div className={styles.candleBody}>
              <div className={styles.waxDrip} />
            </div>

            <div className={styles.candleBase} />
          </div>
        ))}
      </div>

      <div className={styles.logo}>YourLogo</div>
    </div>
  );
}