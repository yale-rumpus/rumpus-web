"use client";

import { useEffect, useState } from "react";
import styles from "./splash.module.css";


export default function Splash() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("intro-seen");
    if (seen) return;

    setVisible(true);
    sessionStorage.setItem("intro-seen", "true");
  }, []);

  const dismiss = () => {
    if (hiding) return; // prevent double-triggering
    setHiding(true);
    setTimeout(() => setVisible(false), 400); // matches CSS fade duration
  };

  if (!visible) return null;

  return (
    
    <div
      className={`${styles.overlay} ${hiding ? styles.hide : ""}`}
      onClick={dismiss}
    >
      <div className={styles.logo}>YourLogo</div>
    </div>
  );
}