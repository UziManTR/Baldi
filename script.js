/**
 * Baldi's Basics Classic HTML5 - Sessiz Mod Engine
 * Saf Vanilla JavaScript Raycasting Framework
 */

// Global Error Catching System
window.onerror = function(msg, url, lineNo, columnNo, error) {
    // Sadece konsola bilgi verir, oyunu dondurmaz
    return true;
};

window.onunhandledrejection = function(event) {
    event.preventDefault();
};

// Asset Yükleyici & Fallback Sistemi
class AssetManager {
    constructor() {
        this.textures = {};
        this.loaded = false;
        this.initAtlas();
    }

    initAtlas() {
        try {
            const img = new Image();
            img.src = 'assets/images/Baldi_Classic_Assets_Atlas.jpg';
            img.onload = () => {
                this.textures['atlas'] = img;
                this.loaded = true;
            };
            img.onerror = () => {
                this.loaded = false; // Fallback çizimler kullanılacak
            };
        } catch (e) {
            this.loaded = false;
        }
    }
}

// Harita Yapısı (1: Duvar, 0: Yol, 2: Kapı, 3: Notebook)
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,1,0,0,0,0,1,0,0,0,3,0,1],
    [1,0,1,0,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,3,0,0,0,0,0,2,0,0,0,0,0,0,3,1],
    [1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,0,1,0,1,1,1,0,1,0,1],
    [1,3,0,0,1,3,0,0,0,1,3,0,0,3,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const MAP_SIZE = 16;

class Player {
    constructor() {
        this.x = 2.5;
        this.y = 2.5;
        this.dirX = -1;
        this.dirY = 0;
        this.planeX = 0;
        this.planeY = 0.66;
        this.moveSpeed = 0.03;
        this.rotSpeed = 0.03;
        this.stamina = 100;
        this.maxStamina = 100;
        this.notebooks = 0;
    }

    update(keys, map) {
        let speed = this.moveSpeed;
        if (keys['ShiftLeft'] || keys['ShiftRight']) {
            if (this.stamina > 0) {
                speed *= 1.8;
                this.stamina = Math.max(0, this.stamina - 0.4);
            }
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + 0.2);
        }

        let moveX = 0;
        let moveY = 0;

        if (keys['KeyW']) {
            moveX += this.dirX * speed;
            moveY += this.dirY * speed;
        }
        if (keys['KeyS']) {
            moveX -= this.dirX * speed;
            moveY -= this.dirY * speed;
        }
        if (keys['KeyA']) {
            moveX -= this.planeX * speed;
            moveY -= this.planeY * speed;
        }
        if (keys['KeyD']) {
            moveX += this.planeX * speed;
            moveY += this.planeY * speed;
        }

        // Duvar Çarpışma Kontrolü (Simple Box Collision)
        const nextX = this.x + moveX;
        const nextY = this.y + moveY;

        if (map[Math.floor(nextY)] && map[Math.floor(nextY)][Math.floor(nextX)] === 0) {
            this.x = nextX;
            this.y = nextY;
        } else if (map[Math.floor(this.y)] && map[Math.floor(this.y)][Math.floor(nextX)] === 0) {
            this.x = nextX;
        } else if (map[Math.floor(nextY)] && map[Math.floor(nextY)][Math.floor(this.x)] === 0) {
            this.y = nextY;
        }
    }

    rotate(angle) {
        const oldDirX = this.dirX;
        this.dirX = this.dirX * Math.cos(angle) - this.dirY * Math.sin(angle);
        this.dirY = oldDirX * Math.sin(angle) + this.dirY * Math.cos(angle);
        const oldPlaneX = this.planeX;
        this.planeX = this.planeX * Math.cos(angle) - this.planeY * Math.sin(angle);
        this.planeY = oldPlaneX * Math.sin(angle) + this.planeY * Math.cos(angle);
    }
}

class Baldi {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseSpeed = 0.015;
        this.speed = this.baseSpeed;
    }

    update(player, notebooksCollected) {
        // Baldi defter sayısına göre hızlanır
        this.speed = this.baseSpeed + (notebooksCollected * 0.004);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.2) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        return dist < 0.5; // Yakalama mesafesi
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.assets = new AssetManager();
        this.player = new Player();
        this.baldi = new Baldi(13.5, 13.5);
        this.keys = {};
        this.isPaused = true;
        this.isGameOver = false;
        this.activeNotebookCoord = null;

        this.resize();
        this.bindEvents();
        this.gameLoop();
    }

    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && !this.isGameOver) {
                this.togglePause();
            }
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse Look
        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.canvas && !this.isPaused) {
                const movementX = e.movementX || 0;
                this.player.rotate(movementX * 0.002);
            }
        });

        // UI Event Listeners (Safe Null Check)
        const safeClick = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };

        safeClick('btn-play', () => this.startGame());
        safeClick('btn-resume', () => this.togglePause());
        safeClick('btn-restart-pause', () => this.restartGame());
        safeClick('btn-restart-over', () => this.restartGame());
        safeClick('btn-restart-win', () => this.restartGame());
        safeClick('btn-submit-answer', () => this.submitAnswer());
    }

    startGame() {
        this.hideModal('main-menu');
        this.isPaused = false;
        try {
            this.canvas.requestPointerLock();
        } catch (e) {}
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showModal('pause-menu');
            try { document.exitPointerLock(); } catch(e){}
        } else {
            this.hideModal('pause-menu');
            try { this.canvas.requestPointerLock(); } catch(e){}
        }
    }

    showModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    hideModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    checkInteraction() {
        // Oyuncunun durduğu karede veya baktığı yönde Notebook var mı?
        const px = Math.floor(this.player.x);
        const py = Math.floor(this.player.y);

        const prompt = document.getElementById('interaction-prompt');

        if (MAP[py] && MAP[py][px] === 3) {
            if (prompt) prompt.style.display = 'block';
            if (this.keys['KeyE']) {
                this.triggerMathBoard(px, py);
            }
        } else {
            if (prompt) prompt.style.display = 'none';
        }
    }

    triggerMathBoard(x, y) {
        this.isPaused = true;
        this.activeNotebookCoord = { x, y };
        try { document.exitPointerLock(); } catch(e){}

        const qEl = document.getElementById('math-question');
        const num1 = Math.floor(Math.random() * 10);
        const num2 = Math.floor(Math.random() * 10);
        this.currentAnswer = num1 + num2;
        
        if (qEl) qEl.innerText = `${num1} + ${num2} = ?`;
        this.showModal('notebook-modal');
    }

    submitAnswer() {
        const ansInput = document.getElementById('math-answer');
        if (ansInput) {
            const val = parseInt(ansInput.value, 10);
            if (val === this.currentAnswer) {
                this.player.notebooks++;
                if (this.activeNotebookCoord) {
                    MAP[this.activeNotebookCoord.y][this.activeNotebookCoord.x] = 0;
                }
            } else {
                // Yanlış cevap Baldi'yi yaklaştırır/hızlandırır
                this.baldi.speed += 0.01;
            }
            ansInput.value = '';
        }

        this.hideModal('notebook-modal');
        this.isPaused = false;
        try { this.canvas.requestPointerLock(); } catch(e){}

        if (this.player.notebooks >= 7) {
            this.winGame();
        }
    }

    restartGame() {
        this.player = new Player();
        this.baldi = new Baldi(13.5, 13.5);
        this.isGameOver = false;
        this.isPaused = false;
        
        this.hideModal('pause-menu');
        this.hideModal('game-over-menu');
        this.hideModal('win-menu');
        this.hideModal('main-menu');
        
        try { this.canvas.requestPointerLock(); } catch(e){}
    }

    winGame() {
        this.isPaused = true;
        this.showModal('win-menu');
        try { document.exitPointerLock(); } catch(e){}
    }

    gameOver() {
        this.isGameOver = true;
        this.isPaused = true;
        this.showModal('game-over-menu');
        try { document.exitPointerLock(); } catch(e){}
    }

    renderRaycaster() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.fillStyle = '#555'; // Tavan
        this.ctx.fillRect(0, 0, w, h / 2);
        this.ctx.fillStyle = '#777'; // Zemin
        this.ctx.fillRect(0, h / 2, w, h / 2);

        // Raycasting algoritması
        for (let x = 0; x < w; x += 2) { // Performans için 2'şer piksel
            const cameraX = 2 * x / w - 1;
            const rayDirX = this.player.dirX + this.player.planeX * cameraX;
            const rayDirY = this.player.dirY + this.player.planeY * cameraX;

            let mapX = Math.floor(this.player.x);
            let mapY = Math.floor(this.player.y);

            let sideDistX, sideDistY;
            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            let perpWallDist;

            let stepX, stepY;
            let hit = 0;
            let side = 0;

            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (this.player.x - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - this.player.x) * deltaDistX;
            }

            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (this.player.y - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - this.player.y) * deltaDistY;
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
                if (MAP[mapY] && MAP[mapY][mapX] > 0 && MAP[mapY][mapX] !== 3) {
                    hit = 1;
                }
            }

            if (side === 0) perpWallDist = (mapX - this.player.x + (1 - stepX) / 2) / rayDirX;
            else perpWallDist = (mapY - this.player.y + (1 - stepY) / 2) / rayDirY;

            const lineHeight = Math.floor(h / perpWallDist);
            const drawStart = -lineHeight / 2 + h / 2;

            // Fallback Renklendirme
            this.ctx.fillStyle = side === 1 ? '#a0a0a0' : '#c2c2c2';
            this.ctx.fillRect(x, drawStart, 2, lineHeight);
        }
    }

    renderSprites() {
        // Baldi Render (Fallback / Sprite Marker)
        const dx = this.baldi.x - this.player.x;
        const dy = this.baldi.y - this.player.y;

        const spriteAngle = Math.atan2(dy, dx) - Math.atan2(this.player.dirY, this.player.dirX);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.2) {
            const screenX = (this.canvas.width / 2) + (Math.tan(spriteAngle) * this.canvas.width);
            const size = Math.min(this.canvas.height, (this.canvas.height / dist));

            this.ctx.fillStyle = '#00ff00'; // Baldi Yeşili Marker
            this.ctx.beginPath();
            this.ctx.arc(screenX, this.canvas.height / 2, Math.max(5, size / 4), 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateUI() {
        const countEl = document.getElementById('notebook-count');
        if (countEl) countEl.innerText = `Notebooks: ${this.player.notebooks} / 7`;

        const staminaBar = document.getElementById('stamina-bar');
        if (staminaBar) {
            staminaBar.style.width = `${(this.player.stamina / this.player.maxStamina) * 100}%`;
        }
    }

    gameLoop() {
        if (!this.isPaused && !this.isGameOver) {
            this.player.update(this.keys, MAP);
            const caught = this.baldi.update(this.player, this.player.notebooks);
            this.checkInteraction();

            if (caught) {
                this.gameOver();
            }
        }

        try {
            this.renderRaycaster();
            this.renderSprites();
            this.updateUI();
        } catch (e) {
            // Safe fallback logic
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Oyunu Başlat
window.addEventListener('DOMContentLoaded', () => {
    try {
        new Game();
    } catch (e) {
        // Global initialization error catch
    }
});
