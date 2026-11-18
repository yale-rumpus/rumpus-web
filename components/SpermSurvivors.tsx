"use client";

import { useEffect, useRef, useState } from "react";
import { cameraFor, createSurvivorState, scoreFor, updateSurvivors, VIEW_HEIGHT, VIEW_WIDTH, WORLD,
    type SurvivorState } from "@/lib/spermSurvivors";
import styles from "./SpermSurvivors.module.css";

type Status = "ready" | "playing" | "paused" | "over";
const BEST_KEY = "rumpus-sperm-survivors-best";
const spriteFiles = {
    grass: "dark_grass_by_kruchone_d25st5w-fullview.jpg",
    player: "miancharacter.png", big: "bigbubba.png", small: "spermlet.png",
    B: "planb.png", C: "planC.png", health: "heal.png", projectile: "projectile.png",
} as const;
type Sprites = Record<keyof typeof spriteFiles, HTMLImageElement>;

function stamp(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, size: number) {
    if (!image.complete || !image.naturalWidth) return;
    const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
}
const movementKeys = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]);
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

function draw(ctx: CanvasRenderingContext2D, state: SurvivorState, sprites: Sprites) {
    const camera = cameraFor(state);
    const p = state.player;
    ctx.fillStyle = "#10180c";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    // World-anchored tiles scroll with the camera rather than following the player.
    if (sprites.grass.complete && sprites.grass.naturalWidth) {
        const tile = 512;
        for (let x = Math.floor(camera.x / tile) * tile; x < camera.x + VIEW_WIDTH; x += tile) {
            for (let y = Math.floor(camera.y / tile) * tile; y < camera.y + VIEW_HEIGHT; y += tile) {
                ctx.drawImage(sprites.grass, x, y, tile, tile);
            }
        }
    }
    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, WORLD, WORLD);
    for (const pickup of state.pickups) {
        ctx.strokeStyle = pickup.kind === "B" ? "#0ff" : pickup.kind === "C" ? "#ff0" : "#ff8080";
        ctx.lineWidth = 2;
        ctx.strokeRect(pickup.x - 22, pickup.y - 22, 44, 44);
        stamp(ctx, sprites[pickup.kind], pickup.x, pickup.y, 56);
        ctx.fillStyle = "#000";
        ctx.fillRect(pickup.x - 9, pickup.y + 22, 18, 16);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(pickup.kind === "health" ? "+" : pickup.kind, pickup.x, pickup.y + 35);
    }
    for (const enemy of state.enemies) {
        if (enemy.x < camera.x - 50 || enemy.x > camera.x + VIEW_WIDTH + 50 ||
            enemy.y < camera.y - 50 || enemy.y > camera.y + VIEW_HEIGHT + 50) continue;
        const big = enemy.radius > 15;
        stamp(ctx, big ? sprites.big : sprites.small, enemy.x, enemy.y, big ? 96 : 48);
    }
    for (const shot of state.projectiles) {
        ctx.save();
        ctx.translate(shot.x, shot.y);
        ctx.rotate(Math.atan2(shot.vy, shot.vx));
        stamp(ctx, sprites.projectile, 0, 0, 30);
        ctx.restore();
    }
    if (state.slashLife > 0) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, 108, state.slashTop ? Math.PI : 0, state.slashTop ? Math.PI * 2 : Math.PI);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "#ff0";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    // Keep the portrait upright; mirror it when travelling left.
    ctx.scale(Math.cos(p.angle) < 0 ? -1 : 1, 1);
    ctx.globalAlpha = p.invincible > 0 && Math.floor(state.time * 15) % 2 ? 0.4 : 1;
    stamp(ctx, sprites.player, 0, 0, 72);
    ctx.restore();
    ctx.restore();
    if (state.flash > 0) {
        ctx.fillStyle = `rgba(255, 209, 102, ${state.flash})`;
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
    if (state.messageLife > 0) {
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillRect(170, VIEW_HEIGHT - 44, 460, 32);
        ctx.fillStyle = "#000";
        ctx.fillText(state.message, VIEW_WIDTH / 2, VIEW_HEIGHT - 22);
    }
}

export default function SpermGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef(createSurvivorState());
    const statusRef = useRef<Status>("ready");
    const keys = useRef(new Set<string>());
    const pointer = useRef<{ id: number; x: number; y: number; dx: number; dy: number } | null>(null);
    const [status, setStatus] = useState<Status>("ready");
    const [hud, setHud] = useState({ hp: 100, time: 0, kills: 0, score: 0, stacks: 0, hurt: false });
    const [best, setBest] = useState(0);
    const [canvasError, setCanvasError] = useState(false);
    const [assets, setAssets] = useState<"loading" | "ready" | "error">("loading");

    function changeStatus(next: Status) {
        statusRef.current = next;
        keys.current.clear();
        pointer.current = null;
        setStatus(next);
    }

    function start() {
        if (assets !== "ready") return;
        stateRef.current = createSurvivorState();
        setHud({ hp: 100, time: 0, kills: 0, score: 0, stacks: 0, hurt: false });
        changeStatus("playing");
        canvasRef.current?.focus({ preventScroll: true });
    }

    function resume() {
        changeStatus("playing");
        canvasRef.current?.focus({ preventScroll: true });
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const initialization = requestAnimationFrame(() => {
            if (!canvas || !ctx) setCanvasError(true);
            try {
                const saved = Number(localStorage.getItem(BEST_KEY));
                if (Number.isFinite(saved) && saved > 0) setBest(saved);
            } catch { /* Storage is optional (e.g. private browsing). */ }
        });
        if (!canvas || !ctx) return () => cancelAnimationFrame(initialization);
        let disposed = false;
        const sprites = {} as Sprites;
        Promise.all(Object.entries(spriteFiles).map(([key, file]) => new Promise<void>((resolve, reject) => {
            const image = new Image();
            sprites[key as keyof Sprites] = image;
            image.onload = () => resolve();
            image.onerror = () => reject(new Error(`Could not load ${file}`));
            image.src = `/spum/${file}`;
        }))).then(() => { if (!disposed) setAssets("ready"); })
            .catch(() => { if (!disposed) setAssets("error"); });
        let frame = 0, last = 0, hudTimer = 0;
        function pause() {
            if (statusRef.current === "playing") changeStatus("paused");
        }
        function onVisibility() { if (document.hidden) pause(); }
        function loop(now: number) {
            if (!canvas || !ctx) return;
            const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
            last = now;
            const s = stateRef.current;
            if (statusRef.current === "playing") {
                const held = keys.current;
                const touch = pointer.current;
                const movement = {
                    x: Number(held.has("KeyD") || held.has("ArrowRight")) - Number(held.has("KeyA") || held.has("ArrowLeft")) + (touch?.dx ?? 0),
                    y: Number(held.has("KeyS") || held.has("ArrowDown")) - Number(held.has("KeyW") || held.has("ArrowUp")) + (touch?.dy ?? 0),
                };
                // Small physics steps prevent projectiles tunnelling on slower devices.
                for (let remaining = dt; remaining > 0; remaining -= 1 / 120) {
                    updateSurvivors(s, Math.min(remaining, 1 / 120), movement);
                }
                hudTimer += dt;
                if (hudTimer >= 0.1 || s.player.hp <= 0) {
                    hudTimer = 0;
                    setHud({ hp: s.player.hp, time: s.time, kills: s.kills, score: scoreFor(s), stacks: s.stacks, hurt: s.player.invincible > 0.4 });
                }
                if (s.player.hp <= 0) {
                    changeStatus("over");
                    const score = scoreFor(s);
                    setBest(previous => Math.max(previous, score));
                    try {
                        const saved = Number(localStorage.getItem(BEST_KEY)) || 0;
                        localStorage.setItem(BEST_KEY, String(Math.max(saved, score)));
                    } catch { /* The run still works without persistent storage. */ }
                }
            }
            draw(ctx, s, sprites);
            const touch = pointer.current;
            if (touch) {
                const rect = canvas.getBoundingClientRect();
                const x = (touch.x - rect.left) * VIEW_WIDTH / rect.width;
                const y = (touch.y - rect.top) * VIEW_HEIGHT / rect.height;
                ctx.strokeStyle = "#ffffff88"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = "#ffffff88";
                ctx.beginPath(); ctx.arc(x + touch.dx * 30, y + touch.dy * 30, 12, 0, Math.PI * 2); ctx.fill();
            }
            frame = requestAnimationFrame(loop);
        }
        frame = requestAnimationFrame(loop);
        window.addEventListener("blur", pause);
        document.addEventListener("visibilitychange", onVisibility);
        const observer = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) pause();
        });
        observer.observe(canvas);
        return () => {
            disposed = true;
            cancelAnimationFrame(initialization);
            cancelAnimationFrame(frame);
            window.removeEventListener("blur", pause);
            document.removeEventListener("visibilitychange", onVisibility);
            observer.disconnect();
        };
    }, []);

    // Three idle looks per damage row, then five damage-tier pain faces.
    // Crop the blue gutters and enlarge each 24 × 30 portrait threefold.
    const damageTier = Math.min(4, Math.floor((100 - hud.hp) / 20));
    const look = [0, 1, 0, 2][Math.floor(hud.time * 1.5) % 4];
    const faceX = hud.hp <= 0 ? 14 : 14 + (hud.hurt ? damageTier : look) * 26;
    const faceY = hud.hp <= 0 ? 333 : hud.hurt ? 173 : 13 + damageTier * 32;

    return (
        <section className={styles.game} aria-labelledby="sperm-survivors-title">
            <h1 id="sperm-survivors-title" className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4 text-center">Sperm Survivors</h1>
            <p className="text-xs sm:text-sm text-center font-normal mb-2">vampire survivors but sperm</p>
            <div className={styles.shell}>
                <div className={styles.hud}>
                    <span>Time <strong>{clock(hud.time)}</strong></span>
                    <span>Score <strong>{hud.score.toLocaleString()}</strong></span>
                    <button type="button" disabled={status !== "playing" && status !== "paused"}
                        onClick={() => status === "paused" ? resume() : changeStatus("paused")}>
                        {status === "paused" ? "Resume" : "Pause"}
                    </button>
                </div>
                <div className={styles.viewport}>
                    <canvas ref={canvasRef} width={VIEW_WIDTH} height={VIEW_HEIGHT} tabIndex={0}
                        aria-label="Sperm Survivors arena. Move with WASD or arrow keys. Press P to pause. On touch screens, drag to move."
                        onKeyDown={event => {
                            if (movementKeys.has(event.code)) {
                                event.preventDefault(); event.stopPropagation();
                                if (statusRef.current === "playing") keys.current.add(event.code);
                            } else if (event.code === "KeyP" || event.code === "Escape") {
                                event.preventDefault(); event.stopPropagation();
                                if (!event.repeat) {
                                    if (statusRef.current === "playing") changeStatus("paused");
                                    else if (statusRef.current === "paused") resume();
                                }
                            } else if (event.code === "Space") { event.preventDefault(); event.stopPropagation(); }
                        }}
                        onKeyUp={event => { keys.current.delete(event.code); }}
                        onBlur={event => {
                            keys.current.clear();
                            pointer.current = null;
                            if (!event.currentTarget.closest("section")?.contains(event.relatedTarget) && statusRef.current === "playing") changeStatus("paused");
                        }}
                        onPointerDown={event => {
                            if (statusRef.current !== "playing" || pointer.current || event.button !== 0) return;
                            event.currentTarget.focus({ preventScroll: true });
                            event.currentTarget.setPointerCapture(event.pointerId);
                            pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0 };
                        }}
                        onPointerMove={event => {
                            const touch = pointer.current;
                            if (!touch || touch.id !== event.pointerId) return;
                            const dx = (event.clientX - touch.x) / 40, dy = (event.clientY - touch.y) / 40;
                            const length = Math.max(1, Math.hypot(dx, dy));
                            touch.dx = dx / length; touch.dy = dy / length;
                        }}
                        onPointerUp={event => { if (pointer.current?.id === event.pointerId) pointer.current = null; }}
                        onPointerCancel={() => { pointer.current = null; }}
                        onLostPointerCapture={() => { pointer.current = null; }}
                    >Your browser needs canvas support to play Sperm Survivors.</canvas>
                    {(status !== "playing" || canvasError) && (
                        <div className={styles.overlay}>
                            <div className={styles.panel} aria-live="polite">
                                <div className={styles.portrait} aria-hidden="true" />
                                <h2>{canvasError ? "Canvas unavailable" : status === "ready" ? "YOU ARE ON THE LAWN" : status === "paused" ? "Grandpa rests" : "EXECUTION DATE: DECEMBER 33nd, 2199"}</h2>
                                {canvasError ? <p>Your browser could not start the game canvas.</p> : <>
                                    {status === "ready" && <p>Swim, dodge, collect. Automatic slashes above and below. Eat your broccoli. The visitors never stop.</p>}
                                    {status === "paused" && <p>Your run is frozen. Resume when you’re ready.</p>}
                                    {status === "over" && <p>{clock(hud.time)} survived · {hud.kills} kills<br /><strong>{hud.score.toLocaleString()} points</strong></p>}
                                    {assets === "error" && <p role="alert">The lawn photos failed to load. Reload the page to try again.</p>}
                                    <button type="button" disabled={assets !== "ready"} onClick={status === "paused" ? resume : start}>
                                        {assets === "loading" ? "Downloading lawn…" : assets === "error" ? "Photos unavailable" : status === "ready" ? ">> ENTER THE LAWN <<" : status === "paused" ? "Keep swimming" : "Try again"}
                                    </button>
                                    <p className={styles.best}>Personal best: {best.toLocaleString()}</p>
                                </>}
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.doomHud} aria-label="Player status">
                    <div className={styles.doomStat}><strong>{hud.hp}%</strong><span>HEALTH</span></div>
                    <div className={styles.doomFaceFrame} data-hurt={hud.hurt && hud.hp > 0}>
                        <div className={styles.doomFace} role="img"
                            aria-label={hud.hp <= 0 ? "Doom guy: dead" : hud.hurt ? "Doom guy: ouch" : `Doom guy: ${hud.hp}% health`}
                            style={{ backgroundPosition: `${-faceX * 3}px ${-faceY * 3}px` }} />
                    </div>
                    <div className={styles.doomStat}><strong>{hud.kills}</strong><span>KILLS</span></div>
                    <div className={styles.doomStat}><strong>×{hud.stacks}</strong><span>PLAN B</span></div>
                </div>
            </div>
        </section>
    );
}
