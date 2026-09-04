/**
 * THE TEACHER - Complete Horror Game Engine
 * Features: Raycasting Engine, Baldi's Basics Map Grid, Advanced AI with dynamic sound hearing,
 * Web Audio API synthesized audio, Stamina, Dynamic difficulty, Full GUI.
 */

// --- AUDIO SYSTEM (Web Audio API) ---
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.8;
        this.sfxVolume = 1.0;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.isInitialized = true;
    }

    playFootstep(isRunning) {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isRunning ? 120 : 80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

        filter.type = 'lowpass';
        filter.frequency.value = 300;

        const vol = (isRunning ? 0.4 : 0.2) * this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playSlapSound(distanceRatio) {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

        const vol = Math.max(0, 1 - distanceRatio) * 0.6 * this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playCollectSound() {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5

        const vol = 0.5 * this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playJumpscare() {
        if (!this.isInitialized) return;
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        const vol = 0.8 * this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

        noise.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }
}

const soundEngine = new SoundEngine();

// --- MAP DEFINITION (Based on Baldi's Basics School Layout) ---
// 0: Empty, 1: Wall, 2: Yellow Swing Door, 3: Normal Door, 4: Exit Door, 8: Notebook, 9: Start
const MAP_WIDTH = 22;
const MAP_HEIGHT = 22;
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,4,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,8,0,1,0,1,0,8,0,0,1,0,8,0,1,0,0,8,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,3,1,1,0,1,1,1,3,1,1,1,3,1,1,1,1,3,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1],
    [1,0,1,8,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,8,0,1],
    [1,0,1,0,1,0,1,0,8,0,1,0,1,0,8,0,1,0,1,0,0,1],
    [1,0,1,3,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,3,1,1],
    [1,0,0,0,0,0,1,1,3,1,1,0,1,1,3,1,1,0,0,0,0,1],
    [1,4,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,4,1],
    [1,0,1,1,0,0,1,1,2,1,1,0,1,1,2,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,8,0,1,0,1,0,8,0,1,0,1,1,0,1],
    [1,0,1,8,1,0,1,1,3,1,1,0,1,1,3,1,1,0,1,8,0,1],
    [1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,1,3,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,3,1,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,1,0,9,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// --- GAME STATE ---
const state = {
    inGame: false,
    notebooksCollected: 0,
    totalNotebooks: 7,
    exitUnlocked: false,
    mouseSensitivity: 0.003,
    interactableTarget: null,
    statusTextTimer: null
};

// --- PLAYER SYSTEM ---
const player = {
    x: 10.5,
    y: 19.5,
    dirX: 0,
    dirY: -1,
    planeX: 0.66,
    planeY: 0,
    moveSpeed: 3.0,
    rotSpeed: 2.0,
    stamina: 100,
    maxStamina: 100,
    isExhausted: false,
    footstepTimer: 0
};

// --- TEACHER AI SYSTEM ---
const teacher = {
    x: 10.5,
    y: 5.5,
    speed: 1.2,
    baseSpeed: 1.2,
    slapInterval: 1.2,
    slapTimer: 0,
    targetX: 10.5,
    targetY: 5.5,
    state: 'PATROL', // PATROL, INVESTIGATE, CHASE
    path: [],
    pathUpdateTimer: 0
};

// --- ITEM & OBJECT TRACKING ---
let notebooks = [];
let exits = [];

function parseMapObjects() {
    notebooks = [];
    exits = [];
    for (let r = 0; r < MAP_HEIGHT; r++) {
        for (let c = 0; c < MAP_WIDTH; c++) {
            if (MAP[r][c] === 8) {
                notebooks.push({ x: c + 0.5, y: r + 0.5, collected: false });
            } else if (MAP[r][c] === 4) {
                exits.push({ x: c, y: r });
            } else if (MAP[r][c] === 9) {
                player.x = c + 0.5;
                player.y = r + 0.5;
                MAP[r][c] = 0; // Clear start point
            }
        }
    }
}

// --- RAYCASTING ENGINE ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function render() {
    const w = canvas.width;
    const h = canvas.height;

    // Ceiling and Floor
    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = '#222225';
    ctx.fillRect(0, h / 2, w, h / 2);

    const zBuffer = new Array(w);

    // Wall Rendering
    for (let x = 0; x < w; x++) {
        const cameraX = 2 * x / w - 1;
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        let sideDistX, sideDistY;
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        let perpWallDist;

        let stepX, stepY;
        let hit = 0;
        let side = 0;

        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (player.x - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (player.y - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }

        while (hit === 0) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }

            if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT) {
                if (MAP[mapY][mapX] > 0 && MAP[mapY][mapX] !== 8 && MAP[mapY][mapX] !== 9) hit = 1;
            } else {
                hit = 1;
            }
        }

        if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
        else perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;

        zBuffer[x] = perpWallDist;

        const lineHeight = Math.floor(h / perpWallDist);
        let drawStart = -lineHeight / 2 + h / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + h / 2;
        if (drawEnd >= h) drawEnd = h - 1;

        // Color based on wall type & side
        const wallType = MAP[mapY]?.[mapX] || 1;
        let baseColor = { r: 180, g: 180, b: 180 };
        if (wallType === 2) baseColor = { r: 200, g: 200, b: 50 }; // Yellow Swing Door
        if (wallType === 3) baseColor = { r: 100, g: 50, b: 20 };  // Normal Door
        if (wallType === 4) baseColor = { r: 200, g: 30, b: 30 };  // Exit Door

        if (side === 1) {
            baseColor.r = Math.floor(baseColor.r * 0.7);
            baseColor.g = Math.floor(baseColor.g * 0.7);
            baseColor.b = Math.floor(baseColor.b * 0.7);
        }

        // Distance Fog
        const fog = Math.min(1, Math.max(0, 1 - (perpWallDist / 12)));
        const r = Math.floor(baseColor.r * fog);
        const g = Math.floor(baseColor.g * fog);
        const b = Math.floor(baseColor.b * fog);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
    }

    // Render Sprites (Notebooks & Teacher)
    const sprites = [];
    notebooks.forEach(nb => {
        if (!nb.collected) sprites.push({ x: nb.x, y: nb.y, type: 'notebook' });
    });
    sprites.push({ x: teacher.x, y: teacher.y, type: 'teacher' });

    sprites.sort((a, b) => {
        const distA = Math.hypot(player.x - a.x, player.y - a.y);
        const distB = Math.hypot(player.x - b.x, player.y - b.y);
        return distB - distA;
    });

    sprites.forEach(sprite => {
        const spriteX = sprite.x - player.x;
        const spriteY = sprite.y - player.y;

        const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

        if (transformY > 0.1) {
            const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(h / transformY));
            const spriteWidth = Math.abs(Math.floor(h / transformY));

            let drawStartY = -spriteHeight / 2 + h / 2;
            if (drawStartY < 0) drawStartY = 0;
            let drawEndY = spriteHeight / 2 + h / 2;
            if (drawEndY >= h) drawEndY = h - 1;

            let drawStartX = -spriteWidth / 2 + spriteScreenX;
            if (drawStartX < 0) drawStartX = 0;
            let drawEndX = spriteWidth / 2 + spriteScreenX;
            if (drawEndX >= w) drawEndX = w - 1;

            const fog = Math.min(1, Math.max(0, 1 - (transformY / 12)));

            for (let stripe = Math.floor(drawStartX); stripe < drawEndX; stripe++) {
                if (transformY < zBuffer[stripe]) {
                    if (sprite.type === 'notebook') {
                        ctx.fillStyle = `rgba(${Math.floor(255*fog)}, ${Math.floor(50*fog)}, ${Math.floor(50*fog)}, 0.9)`;
                        ctx.fillRect(stripe, drawStartY + spriteHeight * 0.3, 1, spriteHeight * 0.4);
                    } else if (sprite.type === 'teacher') {
                        ctx.fillStyle = `rgba(${Math.floor(20*fog)}, ${Math.floor(200*fog)}, ${Math.floor(50*fog)}, 1.0)`;
                        ctx.fillRect(stripe, drawStartY, 1, drawEndY - drawStartY);
                    }
                }
            }
        }
    });
}

// --- CONTROLS & INPUT SYSTEM ---
const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup', e => { keys[e.code] = false; });

document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas && state.inGame) {
        const rot = -e.movementX * state.mouseSensitivity;
        const oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(rot) - player.dirY * Math.sin(rot);
        player.dirY = oldDirX * Math.sin(rot) + player.dirY * Math.cos(rot);
        const oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(rot) - player.planeY * Math.sin(rot);
        player.planeY = oldPlaneX * Math.sin(rot) + player.planeY * Math.cos(rot);
    }
});

// --- COLLISION DETECTION ---
function canMoveTo(x, y) {
    const margin = 0.25;
    const checkPoints = [
        { x: x - margin, y: y - margin },
        { x: x + margin, y: y - margin },
        { x: x - margin, y: y + margin },
        { x: x + margin, y: y + margin }
    ];

    for (let p of checkPoints) {
        const cellX = Math.floor(p.x);
        const cellY = Math.floor(p.y);
        if (cellX < 0 || cellX >= MAP_WIDTH || cellY < 0 || cellY >= MAP_HEIGHT) return false;
        const tile = MAP[cellY][cellX];
        if (tile === 1 || tile === 3) return false; // Walls & locked doors block physics
    }
    return true;
}

// --- PATHFINDING (A* AI) ---
function getPath(startX, startY, targetX, targetY) {
    const sX = Math.floor(startX);
    const sY = Math.floor(startY);
    const tX = Math.floor(targetX);
    const tY = Math.floor(targetY);

    if (sX === tX && sY === tY) return [];

    const openList = [];
    const closedSet = new Set();
    const startNode = { x: sX, y: sY, g: 0, h: Math.hypot(tX - sX, tY - sY), parent: null };
    openList.push(startNode);

    while (openList.length > 0) {
        openList.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const current = openList.shift();

        if (current.x === tX && current.y === tY) {
            const path = [];
            let curr = current;
            while (curr.parent) {
                path.push({ x: curr.x + 0.5, y: curr.y + 0.5 });
                curr = curr.parent;
            }
            return path.reverse();
        }

        closedSet.add(`${current.x},${current.y}`);

        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (let n of neighbors) {
            if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) continue;
            if (MAP[n.y][n.x] === 1) continue; // Walls block AI
            if (closedSet.has(`${n.x},${n.y}`)) continue;

            const gCost = current.g + 1;
            let neighborNode = openList.find(item => item.x === n.x && item.y === n.y);
            if (!neighborNode) {
                neighborNode = { x: n.x, y: n.y, g: gCost, h: Math.hypot(tX - n.x, tY - n.y), parent: current };
                openList.push(neighborNode);
            } else if (gCost < neighborNode.g) {
                neighborNode.g = gCost;
                neighborNode.parent = current;
            }
        }
    }
    return [];
}

// --- GAME LOGIC UPDATES ---
function updatePlayer(dt) {
    let moveX = 0;
    let moveY = 0;

    if (keys['KeyW']) { moveX += player.dirX; moveY += player.dirY; }
    if (keys['KeyS']) { moveX -= player.dirX; moveY -= player.dirY; }
    if (keys['KeyD']) { moveX += player.planeX; moveY += player.planeY; }
    if (keys['KeyA']) { moveX -= player.planeX; moveY -= player.planeY; }

    const isMoving = moveX !== 0 || moveY !== 0;
    const isRunning = keys['ShiftLeft'] && isMoving && !player.isExhausted;

    // Stamina system
    if (isRunning) {
        player.stamina -= 25 * dt;
        if (player.stamina <= 0) {
            player.stamina = 0;
            player.isExhausted = true;
        }
    } else {
        player.stamina += 15 * dt;
        if (player.stamina >= player.maxStamina) {
            player.stamina = player.maxStamina;
            player.isExhausted = false;
        }
    }
    document.getElementById('staminaBar').style.width = `${(player.stamina / player.maxStamina) * 100}%`;
    document.getElementById('staminaBar').style.backgroundColor = player.isExhausted ? '#ff3333' : '#00ff66';

    // Speed calculation
    let currentSpeed = player.moveSpeed;
    if (isRunning) currentSpeed *= 1.8;
    if (player.isExhausted) currentSpeed *= 0.6;

    if (isMoving) {
        const len = Math.hypot(moveX, moveY);
        moveX = (moveX / len) * currentSpeed * dt;
        moveY = (moveY / len) * currentSpeed * dt;

        if (canMoveTo(player.x + moveX, player.y)) player.x += moveX;
        if (canMoveTo(player.x, player.y + moveY)) player.y += moveY;

        // Sound emission
        player.footstepTimer += dt;
        const stepDelay = isRunning ? 0.3 : 0.5;
        if (player.footstepTimer >= stepDelay) {
            soundEngine.playFootstep(isRunning);
            player.footstepTimer = 0;

            if (isRunning) {
                // Alert Teacher to current position
                teacher.targetX = player.x;
                teacher.targetY = player.y;
                teacher.state = 'INVESTIGATE';
            }
        }
    }

    // Interaction Check
    state.interactableTarget = null;
    document.getElementById('interactionPrompt').style.display = 'none';

    // Check Notebooks
    notebooks.forEach(nb => {
        if (!nb.collected && Math.hypot(player.x - nb.x, player.y - nb.y) < 1.2) {
            state.interactableTarget = { type: 'notebook', obj: nb };
            document.getElementById('interactionPrompt').innerText = 'Press [E] to collect Notebook';
            document.getElementById('interactionPrompt').style.display = 'block';
        }
    });

    // Check Exit Doors
    if (state.exitUnlocked) {
        exits.forEach(ex => {
            if (Math.hypot(player.x - (ex.x + 0.5), player.y - (ex.y + 0.5)) < 1.5) {
                state.interactableTarget = { type: 'exit', obj: ex };
                document.getElementById('interactionPrompt').innerText = 'Press [E] to ESCAPE!';
                document.getElementById('interactionPrompt').style.display = 'block';
            }
        });
    }

    // Handle Interaction Input
    if (keys['KeyE'] && state.interactableTarget) {
        keys['KeyE'] = false; // Prevent hold trigger
        if (state.interactableTarget.type === 'notebook') {
            state.interactableTarget.obj.collected = true;
            state.notebooksCollected++;
            soundEngine.playCollectSound();
            document.getElementById('notebooksVal').innerText = state.notebooksCollected;

            // Increase Difficulty
            teacher.baseSpeed += 0.35;
            teacher.slapInterval = Math.max(0.4, 1.2 - (state.notebooksCollected * 0.12));

            showStatusText(`Notebook Collected! (${state.notebooksCollected}/7)`);

            if (state.notebooksCollected >= state.totalNotebooks) {
                state.exitUnlocked = true;
                showStatusText('ALL NOTEBOOKS COLLECTED! FIND AN EXIT!');
            }
        } else if (state.interactableTarget.type === 'exit') {
            winGame();
        }
    }
}

function updateTeacher(dt) {
    const distToPlayer = Math.hypot(player.x - teacher.x, player.y - teacher.y);

    // Slap Timer Movement (Baldi Slap Behavior)
    teacher.slapTimer += dt;
    if (teacher.slapTimer >= teacher.slapInterval) {
        teacher.slapTimer = 0;

        soundEngine.playSlapSound(distToPlayer / 15);

        // Update Path periodically
        teacher.path = getPath(teacher.x, teacher.y, teacher.targetX, teacher.targetY);

        if (teacher.path.length > 0) {
            const nextTile = teacher.path[0];
            teacher.x = nextTile.x;
            teacher.y = nextTile.y;
        }
    }

    // Catch condition
    if (distToPlayer < 0.8) {
        gameOver();
    }
}

function showStatusText(msg) {
    const el = document.getElementById('statusMessage');
    el.innerText = msg;
    if (state.statusTextTimer) clearTimeout(state.statusTextTimer);
    state.statusTextTimer = setTimeout(() => { el.innerText = ''; }, 3000);
}

// --- GAME LOOP ---
let lastTime = performance.now();
function gameLoop(now) {
    if (!state.inGame) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    updatePlayer(dt);
    updateTeacher(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// --- GAME FLOW MANAGEMENT ---
function startGame() {
    soundEngine.init();
    parseMapObjects();

    state.notebooksCollected = 0;
    state.exitUnlocked = false;
    state.inGame = true;

    teacher.x = 10.5;
    teacher.y = 5.5;
    teacher.targetX = 10.5;
    teacher.targetY = 5.5;
    teacher.baseSpeed = 1.2;
    teacher.slapInterval = 1.2;

    document.getElementById('notebooksVal').innerText = '0';
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

    canvas.requestPointerLock();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    state.inGame = false;
    document.exitPointerLock();
    soundEngine.playJumpscare();
    document.getElementById('deathScreen').classList.remove('hidden');
}

function winGame() {
    state.inGame = false;
    document.exitPointerLock();
    document.getElementById('winScreen').classList.remove('hidden');
}

// --- UI BUTTON LISTENERS ---
document.getElementById('btnPlay').addEventListener('click', startGame);
document.getElementById('btnRetryDeath').addEventListener('click', startGame);
document.getElementById('btnReplayWin').addEventListener('click', startGame);

document.getElementById('btnHowToPlay').addEventListener('click', () => {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('howToPlayScreen').classList.remove('hidden');
});

document.getElementById('btnBackFromHTP').addEventListener('click', () => {
    document.getElementById('howToPlayScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

document.getElementById('btnSettings').addEventListener('click', () => {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('settingsScreen').classList.remove('hidden');
});

document.getElementById('btnBackFromSettings').addEventListener('click', () => {
    document.getElementById('settingsScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

document.getElementById('btnMenuDeath').addEventListener('click', () => {
    document.getElementById('deathScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

document.getElementById('btnMenuWin').addEventListener('click', () => {
    document.getElementById('winScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

// Settings Input Event Listeners
document.getElementById('masterVolume').addEventListener('input', (e) => {
    soundEngine.masterVolume = e.target.value / 100;
});
document.getElementById('sfxVolume').addEventListener('input', (e) => {
    soundEngine.sfxVolume = e.target.value / 100;
});
document.getElementById('mouseSensitivity').addEventListener('input', (e) => {
    state.mouseSensitivity = (e.target.value / 1000) + 0.001;
});
