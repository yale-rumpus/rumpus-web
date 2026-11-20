// Logical coordinates stay independent of the canvas's CSS size.
export const WORLD = 2400;
export const VIEW_WIDTH = 800;
export const VIEW_HEIGHT = 500;
export type Point = { x: number; y: number };
export type Pickup = Point & { kind: "B" | "C" | "health"; life: number };
export type Enemy = Point & { hp: number; radius: number; speed: number };
export type SurvivorState = ReturnType<typeof createSurvivorState>;

export function createSurvivorState() {
    return {
        player: { x: WORLD / 2, y: WORLD / 2, hp: 100, invincible: 0, angle: 0 },
        enemies: [] as Enemy[],
        projectiles: [] as (Point & { vx: number; vy: number; life: number })[],
        pickups: [{ x: WORLD / 2 + 130, y: WORLD / 2, kind: "B", life: 60 }] as Pickup[],
        time: 0, kills: 0, stacks: 0, spawnTimer: 1, pickupTimer: 12,
        slashTimer: 0.4, slashLife: 0, slashTop: false, shotTimer: 0,
        flash: 0, message: "Collect B to unlock crossfire!", messageLife: 5,
    };
}

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const scoreFor = (state: SurvivorState) => Math.floor(state.time) * 10 + state.kills * 100;
export const cameraFor = (state: SurvivorState) => ({
    x: clamp(state.player.x - VIEW_WIDTH / 2, 0, WORLD - VIEW_WIDTH),
    y: clamp(state.player.y - VIEW_HEIGHT / 2, 0, WORLD - VIEW_HEIGHT),
});

function killEnemies(state: SurvivorState) {
    state.enemies = state.enemies.filter(enemy => {
        if (enemy.hp > 0) return true;
        state.kills++;
        if (Math.random() < 0.06 && state.pickups.length < 50) {
            state.pickups.push({ x: enemy.x, y: enemy.y, kind: "health", life: 25 });
        }
        return false;
    });
}

export function updateSurvivors(state: SurvivorState, dt: number, movement: Point) {
    if (state.player.hp <= 0) return;
    const p = state.player;
    state.time += dt;
    p.invincible = Math.max(0, p.invincible - dt);
    state.slashLife = Math.max(0, state.slashLife - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.messageLife = Math.max(0, state.messageLife - dt);
    const length = Math.hypot(movement.x, movement.y);
    if (length > 0) {
        const divisor = Math.max(1, length);
        p.x = clamp(p.x + movement.x / divisor * 210 * dt, 18, WORLD - 18);
        p.y = clamp(p.y + movement.y / divisor * 210 * dt, 18, WORLD - 18);
        p.angle = Math.atan2(movement.y, movement.x);
    }
    const camera = cameraFor(state);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
        // Bound entity counts for long runs; difficulty continues through enemy stats.
        state.spawnTimer = Math.max(0.09, 1 / (1.2 + state.time / 22));
        if (state.enemies.length < 220) {
            const angle = Math.random() * Math.PI * 2;
            const x = clamp(p.x + Math.cos(angle) * 540, 20, WORLD - 20);
            const y = clamp(p.y + Math.sin(angle) * 540, 20, WORLD - 20);
            // Near world edges, clamping must not spawn an enemy on the player.
            if (Math.hypot(x - p.x, y - p.y) > 280) {
                const tank = Math.random() < Math.min(0.35, state.time / 300);
                state.enemies.push({ x, y, radius: tank ? 23 : 15,
                    hp: (tank ? 3 : 1) + Math.floor(state.time / 90),
                    speed: (tank ? 38 : 58) + Math.min(125, state.time * 0.25) });
            }
        }
    }
    state.pickupTimer -= dt;
    if (state.pickupTimer <= 0) {
        state.pickupTimer = 12;
        const angle = Math.random() * Math.PI * 2;
        state.pickups.push({ x: clamp(p.x + Math.cos(angle) * 180, 30, WORLD - 30),
            y: clamp(p.y + Math.sin(angle) * 180, 30, WORLD - 30),
            kind: Math.random() < 0.65 ? "B" : "C", life: 40 });
    }

    state.slashTimer -= dt;
    if (state.slashTimer <= 0) {
        state.slashTimer = 0.65;
        state.slashLife = 0.22;
        state.slashTop = !state.slashTop;
        for (const enemy of state.enemies) {
            if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < 108 + enemy.radius &&
                (state.slashTop ? enemy.y <= p.y + enemy.radius : enemy.y >= p.y - enemy.radius)) {
                enemy.hp -= 1 + Math.floor(state.stacks / 3);
                const distance = Math.max(1, Math.hypot(enemy.x - p.x, enemy.y - p.y));
                enemy.x = clamp(enemy.x + (enemy.x - p.x) / distance * 24, 15, WORLD - 15);
                enemy.y = clamp(enemy.y + (enemy.y - p.y) / distance * 24, 15, WORLD - 15);
            }
        }
    }
    state.shotTimer -= dt;
    if (state.stacks > 0 && state.shotTimer <= 0) {
        state.shotTimer = Math.max(0.15, 1.8 / (1 + state.stacks * 0.35));
        for (const [vx, vy] of [[440, 0], [-440, 0], [0, 440], [0, -440]]) {
            state.projectiles.push({ x: p.x, y: p.y, vx, vy, life: 1.8 });
        }
    }
    for (const shot of state.projectiles) {
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.life -= dt;
        for (const enemy of state.enemies) {
            if (enemy.hp > 0 && Math.hypot(enemy.x - shot.x, enemy.y - shot.y) < enemy.radius + 7) {
                enemy.hp -= 1 + Math.floor(state.stacks / 3);
                shot.life = 0;
                break;
            }
        }
    }
    state.projectiles = state.projectiles.filter(shot => shot.life > 0);
    killEnemies(state);

    state.pickups = state.pickups.filter(pickup => {
        pickup.life -= dt;
        if (pickup.life <= 0) return false;
        if (Math.hypot(pickup.x - p.x, pickup.y - p.y) > 34) return true;
        if (pickup.kind === "B") {
            state.stacks++;
            state.shotTimer = 0;
            state.message = `Plan B ×${state.stacks}: faster crossfire!`;
        } else if (pickup.kind === "C") {
            for (const enemy of state.enemies) {
                if (enemy.x + enemy.radius >= camera.x && enemy.x - enemy.radius <= camera.x + VIEW_WIDTH &&
                    enemy.y + enemy.radius >= camera.y && enemy.y - enemy.radius <= camera.y + VIEW_HEIGHT) enemy.hp = 0;
            }
            state.flash = 0.35;
            state.message = "Plan C: screen cleared!";
        } else {
            p.hp = Math.min(100, p.hp + 20);
            state.message = "+20 health";
        }
        state.messageLife = 2.5;
        return false;
    });
    killEnemies(state);
    for (const enemy of state.enemies) {
        const dx = p.x - enemy.x, dy = p.y - enemy.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        enemy.x += dx / distance * enemy.speed * dt;
        enemy.y += dy / distance * enemy.speed * dt;
        if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < enemy.radius + 14 && p.invincible <= 0) {
            p.hp = Math.max(0, p.hp - 10);
            p.invincible = 0.8;
        }
    }
}
