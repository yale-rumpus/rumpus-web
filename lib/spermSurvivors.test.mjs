import test from "node:test";
import assert from "node:assert/strict";
import { createSurvivorState, updateSurvivors, cameraFor, scoreFor, WORLD } from "./spermSurvivors.ts";

const still = { x: 0, y: 0 };
const enemy = (x, y, hp = 1) => ({ x, y, hp, radius: 15, speed: 0 });

test("diagonal movement is normalized and the player/camera respect world bounds", () => {
    const s = createSurvivorState();
    updateSurvivors(s, 0.05, { x: 1, y: 1 });
    assert.ok(Math.abs(Math.hypot(s.player.x - 1200, s.player.y - 1200) - 10.5) < 0.001);
    s.player.x = WORLD; s.player.y = 0;
    updateSurvivors(s, 0.05, { x: 1, y: -1 });
    assert.equal(s.player.x, WORLD - 18);
    assert.equal(s.player.y, 18);
    assert.deepEqual(cameraFor(s), { x: WORLD - 800, y: 0 });
});

test("automatic slashes alternate hemispheres and score kills plus survival", () => {
    const s = createSurvivorState();
    s.enemies = [enemy(1200, 1140), enemy(1200, 1260)];
    s.slashTimer = 0;
    updateSurvivors(s, 0.01, still);
    assert.equal(s.kills, 1);
    assert.equal(s.enemies[0].y, 1260);
    s.slashTimer = 0;
    updateSurvivors(s, 0.01, still);
    assert.equal(s.kills, 2);
    s.time = 12.9;
    assert.equal(scoreFor(s), 320);
});

test("Plan B persists, fires in four directions, and stacks shorten its cooldown", () => {
    const s = createSurvivorState();
    s.pickups = [{ x: 1200, y: 1200, kind: "B", life: 10 }];
    updateSurvivors(s, 0.01, still);
    updateSurvivors(s, 0.01, still);
    assert.equal(s.stacks, 1);
    assert.equal(s.projectiles.length, 4);
    const cooldown = s.shotTimer;
    s.pickups.push({ x: 1200, y: 1200, kind: "B", life: 10 });
    updateSurvivors(s, 0.01, still);
    updateSurvivors(s, 0.01, still);
    assert.equal(s.stacks, 2);
    assert.ok(s.shotTimer < cooldown);
});

test("Plan C kills only visible enemies and credits them once", () => {
    const s = createSurvivorState();
    s.enemies = [enemy(1400, 1200, 20), enemy(1800, 1200, 20)];
    s.pickups = [{ x: 1200, y: 1200, kind: "C", life: 10 }];
    updateSurvivors(s, 0.01, still);
    assert.equal(s.kills, 1);
    assert.equal(s.enemies.length, 1);
    assert.equal(s.enemies[0].x, 1800);
    updateSurvivors(s, 0.01, still);
    assert.equal(s.kills, 1);
});

test("contact damage has a grace period, healing caps at 100, and death freezes the run", () => {
    const s = createSurvivorState();
    s.enemies = [enemy(1200, 1200, 50), enemy(1200, 1200, 50)];
    updateSurvivors(s, 0.01, still);
    assert.equal(s.player.hp, 90);
    updateSurvivors(s, 0.01, still);
    assert.equal(s.player.hp, 90);
    s.pickups = [{ x: 1200, y: 1200, kind: "health", life: 10 }];
    updateSurvivors(s, 0.01, still);
    assert.equal(s.player.hp, 100);
    s.player.hp = 0;
    const time = s.time;
    updateSurvivors(s, 0.05, { x: 1, y: 0 });
    assert.equal(s.time, time);
    assert.equal(s.player.x, 1200);
    const fresh = createSurvivorState();
    assert.equal(fresh.kills, 0);
    assert.equal(fresh.stacks, 0);
    assert.equal(fresh.player.hp, 100);
});

test("extended runs keep entity counts bounded and continue spawning", () => {
    const s = createSurvivorState();
    s.time = 3600;
    for (let i = 0; i < 12000; i++) {
        s.player.invincible = 1;
        updateSurvivors(s, 0.05, still);
    }
    assert.ok(s.time > 4199);
    assert.ok(s.enemies.length > 0 && s.enemies.length <= 220);
    assert.ok(s.pickups.length <= 54);
    assert.ok(s.projectiles.length <= 52);
});
