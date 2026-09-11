"use client";

import { useEffect, useState } from "react";
import styles from "./splash.module.css";

export default function splash() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("intro-seen");
    if (seen) return;

    setVisible(true);
    sessionStorage.setItem("intro-seen", "true");

    const startHide = setTimeout(() => setHiding(true), 1600); // when fade-out starts
    const unmount = setTimeout(() => setVisible(false), 2000);  // after fade-out finishes

    return () => {
      clearTimeout(startHide);
      clearTimeout(unmount);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${hiding ? styles.hide : ""}`}>
      <div className={styles.logo}>YourLogo</div>
    </div>
  );
}