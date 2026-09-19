"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import styles from "./ConfettiAgainButton.module.css";
import {
    CELEBRATED_EVENT,
    ensureGlobalFire,
    fireConfetti,
    hasCelebrated,
} from "@/lib/confetti";

function subscribe(onChange: () => void): () => void {
    window.addEventListener(CELEBRATED_EVENT, onChange);
    return () => window.removeEventListener(CELEBRATED_EVENT, onChange);
}

/* Each click makes the button increasingly unhinged. */
const LABELS = [
    "confetti again",
    "again!!",
    "MORE",
    "keep going",
    "never stop",
    "ok last one",
    "lol jk again",
];

const BIT_COUNT = 6;

/* "Confetti again" button. Hidden (via CSS) until the splash birthday
   explosion has fired at least once this session, then revealed. */
export default function ConfettiAgainButton() {
    const revealed = useSyncExternalStore(subscribe, hasCelebrated, () => false);
    const [labelIndex, setLabelIndex] = useState(0);

    useEffect(() => {
        ensureGlobalFire();
    }, []);

    const handleClick = useCallback(() => {
        fireConfetti();
        setLabelIndex((i) => (i + 1) % LABELS.length);
    }, []);

    return (
        <button
            type="button"
            className={styles.party}
            id="confetti-again-btn"
            data-revealed={revealed || undefined}
            onClick={handleClick}
            disabled={!revealed}
            aria-hidden={!revealed}
            tabIndex={revealed ? 0 : -1}
        >
            <span className={styles.label}>{LABELS[labelIndex]}</span>
            <span className={styles.bits} aria-hidden="true">
                {Array.from({ length: BIT_COUNT }, (_, i) => (
                    <span key={i} />
                ))}
            </span>
        </button>
    );
}
