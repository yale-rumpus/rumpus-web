/* Shared canvas-confetti helper (loaded via CDN in app/layout.tsx).
   Keeps the global library access in one place so both the splash
   explosion and the "confetti again" button fire identical bursts. */

export const CELEBRATED_EVENT = "rumpus:celebrated";
export const CELEBRATED_KEY = "rumpus-celebrated";

type ConfettiFn = (options?: Record<string, unknown>) => void;

function getConfetti(): ConfettiFn | null {
    if (typeof window === "undefined") return null;
    const fn = (window as unknown as Record<string, unknown>).confetti;
    return typeof fn === "function" ? (fn as ConfettiFn) : null;
}

export function isConfettiReady(): boolean {
    return getConfetti() !== null;
}

export function fireConfetti(): boolean {
    const confetti = getConfetti();
    if (!confetti) return false;

    confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
    // Side-cannon bursts for extra birthday energy. Delayed so they
    // layer on top of the main pop instead of competing with it.
    window.setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } });
        confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } });
    }, 250);
    return true;
}

/* Back-compat for the old inline `onClick="fire()"` handler: expose a
   global fire() so any lingering string handler still works. */
export function ensureGlobalFire(): void {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    if (typeof w.fire !== "function") {
        w.fire = () => {
            fireConfetti();
        };
    }
}

export function markCelebrated(): void {
    try {
        sessionStorage.setItem(CELEBRATED_KEY, "true");
    } catch {
        /* sessionStorage unavailable (SSR/private mode): event still works */
    }
    window.dispatchEvent(new Event(CELEBRATED_EVENT));
}

export function hasCelebrated(): boolean {
    try {
        return sessionStorage.getItem(CELEBRATED_KEY) === "true";
    } catch {
        return false;
    }
}
