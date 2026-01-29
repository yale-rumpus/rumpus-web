"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './BlobButton.module.scss';

interface BlobButtonProps {
  children: React.ReactNode;
  href?: string;
  target?: string;
  onClick?: () => void;
}

const BlobButton = ({ children, href, target, onClick }: BlobButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const handleInteraction = (e: React.MouseEvent) => {
    // 1. Prevent default immediately so we can handle the delay
    if (href) e.preventDefault();
    
    // 2. Trigger Animation
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 10);
    
    // 3. Reset Animation state (cleanup)
    setTimeout(() => setIsAnimating(false), 750);

    // 4. Handle the Delay (500ms)
    setTimeout(() => {
      // If it's a link
      if (href) {
        if (target === '_blank') {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          router.push(href);
        }
      }
      
      // If there is an onClick prop, fire it
      if (onClick) {
        onClick();
      }
    }, 700); // 500ms delay here
  };

  const buttonClass = `${styles.blobBtn} ${isAnimating ? styles.animate : ''}`;

  return (
    <>
      <button 
        className={buttonClass} 
        onClick={handleInteraction}
        // If it's a link, we add role="link" for accessibility since it's technically a button tag now
        role={href ? "link" : "button"}
      >
        {children}
        
        {/* The swimming blobs container */}
        <span className={styles.inner}>
          <span className={styles.blobsContainer}>
            <span className={styles.blob}></span>
            <span className={styles.blob}></span>
            <span className={styles.blob}></span>
            <span className={styles.blob}></span>
          </span>
        </span>
        
        {/* The bubbly particles container (Moved here to avoid conflict) */}
        <span className={styles.bubbles}></span>
      </button>

      {/* SVG Gooey Filter */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
            <filter id="goo">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo"></feColorMatrix>
            <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
            </filter>
        </defs>
        </svg>
    </>
  );
};

export default BlobButton;



  