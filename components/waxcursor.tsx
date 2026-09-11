
"use client";

import { useEffect, useRef } from "react";

type Drip = {
  x: number;
  y: number;
  width: number;
  length: number;
  velocity: number;
  age: number;
  maxAge: number;
  attached: boolean;
};

export default function WaxCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame: number;

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      vx: 0,
      vy: 0,
      speed: 0,
    };

    const cursor = {
      radius: 25,
      wobble: 0,
    };

    const drips: Drip[] = [];

    let lastDrip = 0;
    let nextDripDelay = random(800, 2800);

    function random(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    }

    function createDrip() {
      /*
       * Pick a point along the bottom half of the wax.
       * This makes the drip appear to grow directly from the blob.
       */
      const angle = random(0.25, Math.PI - 0.25);

      const x =
        mouse.x +
        Math.cos(angle) * cursor.radius * random(0.4, 0.9);

      const y =
        mouse.y +
        Math.sin(angle) * cursor.radius * random(0.75, 1);

      drips.push({
        x,
        y,
        width: random(4, 9),
        length: random(8, 25),
        velocity: random(0.15, 0.45),
        age: 0,
        maxAge: random(500, 1300),
        attached: true,
      });
    }

    function updateDrips(delta: number) {
      for (let i = drips.length - 1; i >= 0; i--) {
        const drip = drips[i];

        drip.age += delta;

        if (drip.attached) {
          /*
           * While attached, the drip slowly stretches.
           */
          drip.length += drip.velocity * delta * 0.035;

          /*
           * Once it gets long enough, gravity takes over.
           */
          if (drip.length > 35) {
            drip.attached = false;
          }
        } else {
          /*
           * Detached wax falls.
           */
          drip.y += drip.velocity * delta * 0.08;
          drip.velocity += 0.002 * delta;
        }

        if (drip.age > drip.maxAge) {
          drips.splice(i, 1);
        }
      }
    }

    function drawWaxBlob() {
      const r = cursor.radius;

      /*
       * Subtle organic wobble.
       */
      cursor.wobble += 0.025;

      ctx.save();

      ctx.translate(mouse.x, mouse.y);

      /*
       * Gooey glow.
       */
      ctx.shadowColor = "rgba(255, 70, 0, 0.65)";
      ctx.shadowBlur = 18;

      /*
       * Main wax blob.
       */
      const gradient = ctx.createRadialGradient(
        -r * 0.3,
        -r * 0.35,
        r * 0.1,
        0,
        0,
        r * 1.2
      );

      gradient.addColorStop(0, "#ff9a3d");
      gradient.addColorStop(0.35, "#ff5a00");
      gradient.addColorStop(1, "#d82d00");

      ctx.fillStyle = gradient;

      ctx.beginPath();

      const points = 48;

      for (let i = 0; i <= points; i++) {
        const angle = (Math.PI * 2 * i) / points;

        /*
         * Several overlapping sine waves give the edge
         * a slightly melted/wobbly shape.
         */
        const wobble =
          Math.sin(angle * 3 + cursor.wobble) * 1.5 +
          Math.sin(angle * 7 - cursor.wobble * 1.4) * 0.8;

        const radius = r + wobble;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawDrips() {
      ctx.save();

      ctx.shadowColor = "rgba(255, 70, 0, 0.5)";
      ctx.shadowBlur = 10;

      for (const drip of drips) {
        /*
         * Fade out near the end of the drip's life.
         */
        const life = drip.age / drip.maxAge;

        let alpha = 1;

        if (life > 0.75) {
          alpha = 1 - (life - 0.75) / 0.25;
        }

        ctx.globalAlpha = Math.max(0, alpha);

        /*
         * Attached drips begin at the blob.
         * Detached drips simply fall.
         */
        ctx.fillStyle = "#ef4700";

        ctx.beginPath();

        const top = drip.y;
        const bottom = drip.y + drip.length;

        ctx.moveTo(drip.x - drip.width / 2, top);

        /*
         * Left side.
         */
        ctx.bezierCurveTo(
          drip.x - drip.width / 2,
          top + drip.length * 0.3,
          drip.x - drip.width * 0.7,
          bottom - drip.length * 0.15,
          drip.x,
          bottom
        );

        /*
         * Right side.
         */
        ctx.bezierCurveTo(
          drip.x + drip.width * 0.7,
          bottom - drip.length * 0.15,
          drip.x + drip.width / 2,
          top + drip.length * 0.3,
          drip.x + drip.width / 2,
          top
        );

        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function maybeCreateDrip(timestamp: number) {
      if (timestamp - lastDrip > nextDripDelay) {
        /*
         * Don't constantly drip while moving very fast.
         * It looks more natural if the wax settles slightly.
         */
        if (mouse.speed < 15) {
          createDrip();
        }

        lastDrip = timestamp;
        nextDripDelay = random(900, 3200);
      }
    }

    let previousTime = performance.now();

    function animate(timestamp: number) {
      const delta = Math.min(timestamp - previousTime, 32);
      previousTime = timestamp;

      /*
       * Smoothly follow the mouse.
       */
      const oldX = mouse.x;
      const oldY = mouse.y;

      mouse.x += (mouse.targetX - mouse.x) * 0.18;
      mouse.y += (mouse.targetY - mouse.y) * 0.18;

      mouse.vx = mouse.x - oldX;
      mouse.vy = mouse.y - oldY;

      mouse.speed = Math.sqrt(
        mouse.vx * mouse.vx + mouse.vy * mouse.vy
      );

      /*
       * Slightly enlarge the wax while moving.
       */
      const targetRadius = mouse.speed > 8 ? 28 : 25;

      cursor.radius +=
        (targetRadius - cursor.radius) * 0.08;

      updateDrips(delta);
      maybeCreateDrip(timestamp);

      /*
       * Clear.
       */
      ctx.clearRect(0, 0, width, height);

      /*
       * Draw drips first so the main blob sits on top.
       */
      drawDrips();
      drawWaxBlob();

      animationFrame = requestAnimationFrame(animate);
    }

    /*
     * Hide the normal cursor.
     */
    document.body.style.cursor = "none";

    /*
     * Don't let the canvas block clicks.
     */
    canvas.style.pointerEvents = "none";

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    resize();

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);

      document.body.style.cursor = "";
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 999999,
      }}
    />
  );
}


// import WaxCursor from "@/components/WaxCursor";

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body>
//         <WaxCursor />

//         {children}
//       </body>
//     </html>
//   );
// }