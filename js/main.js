const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('current-score');
const highScoreDisplay = document.getElementById('high-score');
const speedMultiplierDisplay = document.getElementById('speed-multiplier');
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const overlay = document.getElementById('overlay');
const speedSlider = document.getElementById('speed-slider');
const ingameSpeedSlider = document.getElementById('ingame-speed-slider');

// 游戏常量配置
const GRID_SIZE = 20;
const TILE_COUNT = 20; // 20x20 宫格
canvas.width = GRID_SIZE * TILE_COUNT;
canvas.height = GRID_SIZE * TILE_COUNT;

let snake = [];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('snake-high-score') || 0;
let gameRunning = false;
let isPaused = false;
let gameLoopTimeout;

// 速度控制逻辑
// 滑块值 1-10 映射到毫秒延迟 250ms - 50ms
// 速度等级越小延迟越高，反之越低
function mapSpeedLevelToInterval(level) {
    // 线性映射：1->250ms, 10->50ms
    return 250 - (level - 1) * 22.22;
}

let speedLevel = 5;
let speedInterval = mapSpeedLevelToInterval(speedLevel);

// 粒子系统
let particles = [];

// 初始化计分板显示
highScoreDisplay.textContent = highScore;
updateSpeedUI();

// 同步滑块
speedSlider.addEventListener('input', (e) => {
    speedLevel = parseInt(e.target.value);
    ingameSpeedSlider.value = speedLevel;
    updateSpeedUI();
});

ingameSpeedSlider.addEventListener('input', (e) => {
    speedLevel = parseInt(e.target.value);
    speedSlider.value = speedLevel;
    updateSpeedUI();
});

function updateSpeedUI() {
    speedInterval = mapSpeedLevelToInterval(speedLevel);
    // 速度倍率显示，以 5 级作为 1.0x 基准
    const multiplier = (speedLevel / 5).toFixed(1);
    speedMultiplierDisplay.textContent = multiplier;
}

// 游戏循环
function gameLoop() {
    if (!gameRunning || isPaused) return;

    update();
    draw();

    gameLoopTimeout = setTimeout(gameLoop, speedInterval);
}

function update() {
    // 应用方向改变，防止 180 度掉头
    dx = nextDx;
    dy = nextDy;

    // 移动蛇头
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 碰撞检测：边界
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return gameOver();
    }

    // 碰撞检测：撞自己
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return gameOver();
        }
    }

    snake.unshift(head);

    // 碰撞检测：吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 动态得分逻辑：基础分 10 * 速度等级/5 (倍率)
        const multiplier = speedLevel / 5;
        score += Math.round(10 * multiplier);
        scoreDisplay.textContent = score;
        
        createParticles(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2);
        generateFood();
        
        // 进食后的小幅自动加速机制（可选，此处保持原有逻辑或移除以完全由滑块控制）
        // 如果想保留进食后变快，可以稍微提升 speedLevel 或直接减少间隔
        // 这里选择保持由用户主要控制，进食后仅轻微提速（不改变滑块显示）
        if (speedInterval > 40) speedInterval -= 1;
    } else {
        snake.pop();
    }

    // 更新粒子状态
    updateParticles();
}

function draw() {
    // 清空背景（带一点点拖尾效果）
    ctx.fillStyle = 'rgba(13, 13, 26, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格辅助线（很淡）
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= canvas.width; i += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // 绘制食物（发光效果）
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // 绘制蛇身
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        const color = isHead ? '#00f3ff' : '#bc13fe';
        ctx.shadowBlur = isHead ? 20 : 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // 绘制圆角矩形蛇身
        const padding = 1;
        drawRoundedRect(
            segment.x * GRID_SIZE + padding,
            segment.y * GRID_SIZE + padding,
            GRID_SIZE - padding * 2,
            GRID_SIZE - padding * 2,
            5
        );
    });

    // 绘制粒子
    drawParticles();

    // 重置发光效果，避免影响后续绘制
    ctx.shadowBlur = 0;
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// 粒子系统逻辑
function createParticles(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3 + 1,
            color: '#ff00ff',
            life: 1.0
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}

function generateFood() {
    let newFood;
    let collision = true;
    while (collision) {
        newFood = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
        collision = snake.some(s => s.x === newFood.x && s.y === newFood.y);
    }
    food = newFood;
}

function startGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0; dy = -1;
    nextDx = 0; nextDy = -1;
    score = 0;
    // 每次开始重新从滑块获取速度
    updateSpeedUI();
    scoreDisplay.textContent = score;
    gameRunning = true;
    isPaused = false;
    overlay.classList.add('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    generateFood();
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake-high-score', highScore);
        highScoreDisplay.textContent = highScore;
    }
    finalScoreDisplay.textContent = score;
    overlay.classList.remove('hidden');
    gameOverScreen.classList.remove('hidden');
}

function togglePause() {
    if (!gameRunning) return;
    isPaused = !isPaused;
    if (isPaused) {
        overlay.classList.remove('hidden');
        pauseScreen.classList.remove('hidden');
        pauseBtn.textContent = '继续';
    } else {
        overlay.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        pauseBtn.textContent = '暂停';
        gameLoop();
    }
}

// 键盘监听
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
        case 'Escape':
        case 'p':
        case 'P':
            togglePause();
            break;
    }
});

// 按钮监听
startBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// 初始渲染
draw();
