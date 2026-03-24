const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// 游戏参数
const gridSize = 20;
let tileCountX, tileCountY;
let snake = [{x: 10, y: 10}];
let food = {x: 5, y: 5};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('neonSnakeHighScore') || 0;
let gameRunning = false;
let gameSpeed = 100;

highScoreEl.innerText = highScore;

// 动态设置 canvas 大小
function resizeCanvas() {
    const size = Math.min(window.innerWidth - 40, 400);
    canvas.width = size;
    canvas.height = size;
    tileCountX = canvas.width / gridSize;
    tileCountY = canvas.height / gridSize;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 控制逻辑
function handleInput(dir) {
    if (!gameRunning) return;
    switch(dir) {
        case 'up': if (dy === 0) { dx = 0; dy = -1; } break;
        case 'down': if (dy === 0) { dx = 0; dy = 1; } break;
        case 'left': if (dx === 0) { dx = -1; dy = 0; } break;
        case 'right': if (dx === 0) { dx = 1; dy = 0; } break;
    }
}

window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': handleInput('up'); break;
        case 'ArrowDown': handleInput('down'); break;
        case 'ArrowLeft': handleInput('left'); break;
        case 'ArrowRight': handleInput('right'); break;
    }
});

// 虚拟按钮
document.getElementById('ctrl-up').addEventListener('click', () => handleInput('up'));
document.getElementById('ctrl-down').addEventListener('click', () => handleInput('down'));
document.getElementById('ctrl-left').addEventListener('click', () => handleInput('left'));
document.getElementById('ctrl-right').addEventListener('click', () => handleInput('right'));

function startGame() {
    snake = [{x: Math.floor(tileCountX/2), y: Math.floor(tileCountY/2)}];
    dx = 1; dy = 0;
    score = 0;
    scoreEl.innerText = score;
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    placeFood();
    mainLoop();
}

function gameOver() {
    gameRunning = false;
    gameOverScreen.classList.remove('hidden');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonSnakeHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    // 确保食物不在蛇身上
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            placeFood();
            break;
        }
    }
}

function draw() {
    // 清空背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画蛇
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#39FF14';
    ctx.fillStyle = '#39FF14';
    snake.forEach((part, index) => {
        // 头部的发光更强
        if (index === 0) {
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#fff'; // 蛇头白色提亮
        } else {
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#39FF14';
        }
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // 画食物
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF00FF';
    ctx.fillStyle = '#FF00FF';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    
    // 重置阴影以免影响性能
    ctx.shadowBlur = 0;
}

function update() {
    if (!gameRunning) return;

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // 碰撞检测：墙壁
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        return gameOver();
    }

    // 碰撞检测：身体
    for (let part of snake) {
        if (part.x === head.x && part.y === head.y) {
            return gameOver();
        }
    }

    snake.unshift(head);

    // 吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = score;
        placeFood();
        // 每 50 分加速
        if (score % 50 === 0 && gameSpeed > 40) {
            gameSpeed -= 5;
        }
    } else {
        snake.pop();
    }
}

function mainLoop() {
    if (!gameRunning) return;
    update();
    draw();
    setTimeout(mainLoop, gameSpeed);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// 初次绘制背景
draw();
