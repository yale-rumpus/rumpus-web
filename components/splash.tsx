"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./splash.module.css";
import FlameCursor from "@/components/FlameCursor";

const CANDLE_SPACING = 150;
const CAKE_RADIUS = 190;

/* One candle per evenly spaced grid cell, scaled to the viewport.
   Cells that would land underneath the cake are skipped so every
   candle stays reachable. */

const computeCandles = (w: number, h: number) => {
  const cols = Math.max(1, Math.round(w / CANDLE_SPACING));
  const rows = Math.max(1, Math.round(h / CANDLE_SPACING));
  const out: { id: number; x: number; y: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) / cols) * 100;
      const y = ((r + 0.5) / rows) * 100;

      const px = (x / 100) * w;
      const py = (y / 100) * h;

      if (Math.hypot(px - w / 2, py - h / 2) < CAKE_RADIUS) continue;

      out.push({ id: out.length, x, y });
    }
  }

  return out;
};

export default function Splash() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [litCandles, setLitCandles] = useState<Set<number>>(new Set());
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [hoveringCake, setHoveringCake] = useState(false);
  const [blowPressure, setBlowPressure] = useState(0);
  const [exploding, setExploding] = useState(false);
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(orientation: portrait)").matches;
  });
  const [grid, setGrid] = useState(() => {
    if (typeof window === "undefined") return computeCandles(1600, 900);
    return computeCandles(window.innerWidth, window.innerHeight);
  });
  const blowPressureRef = useRef(0);

  const candles = isMobile ? [] : grid;

  const allCandlesLit =
    isMobile || litCandles.size === candles.length;

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

  useEffect(() => {
    const onResize = () => {
      setGrid(computeCandles(window.innerWidth, window.innerHeight));
    };

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const dismiss = () => {
    if (hiding) return;

    setHiding(true);

    setTimeout(() => setVisible(false), 400);
  };

  const handleOverlayClick = () => {
    if (isMobile) {
      if (exploding || hiding) return;
      setExploding(true);
      return;
    }

    dismiss();
  };

  const onOverlayMouseMove = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;

    setCursorPos({ x, y });

    /* The cake sits at screen center; detect "hovering" by distance so
       the logo never has to swallow pointer events (candles under the
       cake stay reachable). */
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    setHoveringCake(Math.hypot(x - cx, y - cy) < 180);
  };

  /* Blow-out: once every candle is lit, space adds +10 pressure, which
     decays by 5/sec (floor 0). 70 pressure → boom, then exit overlay. */

  useEffect(() => {
    if (!allCandlesLit || exploding || isMobile) return;

    const onSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;

      e.preventDefault();

      blowPressureRef.current = Math.min(70, blowPressureRef.current + 10);
      setBlowPressure(blowPressureRef.current);

      if (blowPressureRef.current >= 70) {
        setExploding(true);
      }
    };

    window.addEventListener("keydown", onSpace);

    return () => window.removeEventListener("keydown", onSpace);
  }, [allCandlesLit, exploding, isMobile]);

  useEffect(() => {
    if (!allCandlesLit || exploding || isMobile) return;

    const tick = setInterval(() => {
      blowPressureRef.current = Math.max(0, blowPressureRef.current - 5);
      setBlowPressure(blowPressureRef.current);
    }, 1000);

    return () => clearInterval(tick);
  }, [allCandlesLit, exploding, isMobile]);

  useEffect(() => {
    if (!exploding) return;

    const t = setTimeout(() => {
      setHiding(true);
      setTimeout(() => setVisible(false), 400);
    }, 1600);

    return () => clearTimeout(t);
  }, [exploding]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.overlay} ${hiding ? styles.hide : ""}`}
      onClick={handleOverlayClick}
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
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`${styles.cake} ${exploding ? styles.boom : ""}`}
          src={exploding ? "/explode.gif" : "/portal cake.png"}
          alt=""
          draggable={false}
        />
        <span className={styles.cakeTitle}>
          Rumpus is celebrating our 50th birthday
        </span>
        <span className={styles.cakeCaption}>
          {isMobile
            ? "click to continue"
            : allCandlesLit
              ? "holy unc"
              : "click to skip"}
        </span>
        {!isMobile && allCandlesLit && !exploding && (
          <div className={styles.blowWrap}>
            <span className={styles.blowPrompt}>
              rapidly press space to blow out all candles
            </span>
            <div className={styles.blowMeter}>
              <div
                className={styles.blowFill}
                style={{
                  width: `${Math.min(100, (blowPressure / 70) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
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