"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./splash.module.css";
import FlameCursor from "@/components/FlameCursor";

export default function Splash() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [litCandles, setLitCandles] = useState<Set<number>>(new Set());
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [hoveringCake, setHoveringCake] = useState(false);
  const [blowPressure, setBlowPressure] = useState(0);
  const [exploding, setExploding] = useState(false);
  const blowPressureRef = useRef(0);

  const candles = Array.from({ length: 50 }, (_, i) => {
    const angle = (i / 50) * Math.PI * 2;

    return {
      id: i,
      x: 50 + Math.cos(angle) * 42,
      y: 50 + Math.sin(angle) * 42,
    };
  });

  const allCandlesLit = litCandles.size === candles.length;

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

  /* Blow-out: once every candle is lit, space adds +10 pressure, which
     decays by 5/sec (floor 0). 70 pressure → boom, then exit overlay. */

  useEffect(() => {
    if (!allCandlesLit || exploding) return;

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
  }, [allCandlesLit, exploding]);

  useEffect(() => {
    if (!allCandlesLit || exploding) return;

    const tick = setInterval(() => {
      blowPressureRef.current = Math.max(0, blowPressureRef.current - 5);
      setBlowPressure(blowPressureRef.current);
    }, 1000);

    return () => clearInterval(tick);
  }, [allCandlesLit, exploding]);

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
          className={`${styles.cake} ${exploding ? styles.boom : ""}`}
          src={exploding ? "/explode.gif" : "/portal cake.png"}
          alt=""
          draggable={false}
        />
        <span className={styles.cakeTitle}>
          Rumpus is celebrating our 50th birthday
        </span>
        <span className={styles.cakeCaption}>holy unc</span>
        {allCandlesLit && !exploding && (
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