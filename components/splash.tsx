"use client";

import { useEffect, useState } from "react";
import styles from "./splash.module.css";
import FlameCursor from "@/components/FlameCursor";

export default function Splash() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [litCandles, setLitCandles] = useState<Set<number>>(new Set());
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [hoveringCake, setHoveringCake] = useState(false);

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

  const onOverlayMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
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

  const allCandlesLit = litCandles.size === candles.length;

  return (
    <div
      className={`${styles.overlay} ${hiding ? styles.hide : ""}`}
      onClick={dismiss}
      onMouseMove={onOverlayMouseMove}
    >
      
      <FlameCursor />
      <div
        className={styles.spotlight}
        style={
          {
            "--mx": `${cursorPos.x}px`,
            "--my": `${cursorPos.y}px`,
            opacity: hoveringCake ? 1 : 0,
          } as React.CSSProperties
        }
      />
      <div
        className={`${styles.logo} ${
          hoveringCake ? styles.hoverCake : ""
        } ${allCandlesLit ? styles.litCake : ""}`}
        onMouseEnter={() => setHoveringCake(true)}
        onMouseLeave={() => setHoveringCake(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.cake}
          src="/portal cake.png"
          alt="Portal Cake"
          draggable={false}
        />
        <span className={styles.cakeTitle}>
          Rumpus is celebrating our 50th birthday
        </span>
        <span className={styles.cakeCaption}>holy unc</span>
      </div>
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

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.candleImage}
              src="/candle.png"
              alt=""
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}