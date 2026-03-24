const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Game Config
let cellSize = 20;
let gridWidth, gridHeight;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 1, dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameInterval;
let isGameRunning = false;
let moveQueue = [];

// Visuals
const colors = {
    snakeHead: '#39ff14',
    snakeBody: '#00f3ff',
    food: '#ff00ff',
    grid: 'rgba(255, 255, 255, 0.05)'
};

function init() {
    highScoreEl.innerText = `High Score: ${highScore}`;
    resize();
    window.addEventListener('resize', resize);
    
    // Controls
    window.addEventListener('keydown', handleKeydown);
    startScreen.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    
    // Touch controls
    let touchStartX, touchStartY;
    document.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        if (!isGameRunning) startGame();
    });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) queueMove(1, 0);
            else if (dx < -30) queueMove(-1, 0);
        } else {
            if (dy > 30) queueMove(0, 1);
            else if (dy < -30) queueMove(0, -1);
        }
    });
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gridWidth = Math.floor(canvas.width / cellSize);
    gridHeight = Math.floor(canvas.height / cellSize);
}

function startGame() {
    isGameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    snake = [
        { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
        { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2) },
        { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2) }
    ];
    dx = 1; dy = 0;
    score = 0;
    moveQueue = [];
    scoreEl.innerText = `Score: ${score}`;
    placeFood();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameStep, 100);
}

function gameStep() {
    // Process input queue
    if (moveQueue.length > 0) {
        const next = moveQueue.shift();
        dx = next.x;
        dy = next.y;
    }

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision (teleport)
    if (head.x < 0) head.x = gridWidth - 1;
    if (head.x >= gridWidth) head.x = 0;
    if (head.y < 0) head.y = gridHeight - 1;
    if (head.y >= gridHeight) head.y = 0;

    // Self collision
    if (snake.some((seg, idx) => idx !== 0 && seg.x === head.x && seg.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = `Score: ${score}`;
        placeFood();
    } else {
        snake.pop();
    }

    draw();
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
    };
    // Don't place food on snake
    if (snake.some(seg => seg.x === food.x && seg.y === food.y)) placeFood();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += cellSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += cellSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Food
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.food;
    ctx.fillStyle = colors.food;
    ctx.fillRect(food.x * cellSize + 2, food.y * cellSize + 2, cellSize - 4, cellSize - 4);

    // Snake
    snake.forEach((seg, i) => {
        ctx.shadowBlur = i === 0 ? 20 : 10;
        ctx.shadowColor = i === 0 ? colors.snakeHead : colors.snakeBody;
        ctx.fillStyle = i === 0 ? colors.snakeHead : colors.snakeBody;
        ctx.fillRect(seg.x * cellSize + 1, seg.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
    
    // Reset shadow for performance
    ctx.shadowBlur = 0;
}

function handleKeydown(e) {
    if (!isGameRunning && (e.code === 'Space' || e.code === 'Enter')) {
        startGame();
        return;
    }
    
    switch (e.key) {
        case 'ArrowUp': queueMove(0, -1); break;
        case 'ArrowDown': queueMove(0, 1); break;
        case 'ArrowLeft': queueMove(-1, 0); break;
        case 'ArrowRight': queueMove(1, 0); break;
    }
}

function queueMove(nx, ny) {
    const last = moveQueue.length > 0 ? moveQueue[moveQueue.length - 1] : { x: dx, y: dy };
    // Prevent 180 degree turns
    if (nx === -last.x || ny === -last.y) return;
    moveQueue.push({ x: nx, y: ny });
    if (moveQueue.length > 2) moveQueue.shift(); // Limit queue
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameInterval);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.innerText = `High Score: ${highScore}`;
    }
    finalScoreEl.innerText = `Final Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

init();