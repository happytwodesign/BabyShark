const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const EMOJIS = ['🦔', '🐵', '🐶', '🐹', '🦊', '🦁', '🦄', '🦓', '🦒', '🦙'];

let babySharkImg = new Image();
babySharkImg.src = 'baby_shark.png';

let bubbleImg = new Image();
bubbleImg.src = 'bubble.png';

let jellyfishFrames = [];
for (let i = 0; i < 4; i++) {
    let img = new Image();
    img.src = `jellyfish_frame_${i}.png`;
    jellyfishFrames.push(img);
}

let backgroundImg = new Image();
backgroundImg.src = 'background.png';

const GRAVITY = 0.25;
const FLAP_POWER = -5;
const PIPE_GAP = 200;
const PIPE_FREQUENCY = 2000;
let LAST_PIPE = Date.now();
let LAST_FRAME = Date.now();
const INITIAL_PIPE_SPEED = 2;
const SPEED_INCREMENT = 0.001;

let backgroundSpeed = INITIAL_PIPE_SPEED;

let user = { name: '', emoji: '' };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getRandomEmoji() {
    return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

function saveUserInfo(name) {
    const emoji = getRandomEmoji();
    user = { name, emoji };
    localStorage.setItem('user', JSON.stringify(user));
}

function loadUserInfo() {
    const userData = localStorage.getItem('user');
    if (userData) {
        user = JSON.parse(userData);
    } else {
        document.getElementById('usernameInputContainer').style.display = 'flex';
    }
}

function saveScore(score) {
    let scores = JSON.parse(localStorage.getItem('scores')) || [];
    const existingUser = scores.find(entry => entry.name === user.name);
    if (existingUser) {
        existingUser.score = Math.max(existingUser.score, score);
    } else {
        scores.push({ name: user.name, emoji: user.emoji, score });
    }
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5); // Top 5 scores
    localStorage.setItem('scores', JSON.stringify(scores));
}

function loadLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    scores.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = `${entry.emoji} ${entry.name}: ${entry.score}`;
        leaderboardList.appendChild(li);
    });
}

class BabyShark {
    constructor() {
        this.image = babySharkImg;
        this.width = canvas.width * 0.1;
        this.height = this.width * 0.5;
        this.x = 100;
        this.y = canvas.height / 2;
        this.velocity = 0;
    }

    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;

        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
        }
    }

    flap() {
        this.velocity = FLAP_POWER;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Bubble {
    constructor(x, y) {
        this.image = bubbleImg;
        this.scale = Math.random() * 0.5 + 0.5;
        this.width = 20 * this.scale;
        this.height = 20 * this.scale;
        this.x = x;
        this.y = y;
        this.speed = Math.random() * 2 + 1;
    }

    update() {
        this.y -= this.speed;
        if (this.y + this.height < 0) {
            this.y = canvas.height + this.height;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Pipe {
    constructor(inverted, y) {
        this.images = jellyfishFrames;
        this.frameIndex = 0;
        this.image = this.images[this.frameIndex];
        this.width = canvas.width * 0.1;
        this.height = canvas.height * (Math.random() * 0.3 + 0.2); // Высота медузы изменена в зависимости от высоты экрана
        this.x = canvas.width;
        this.y = inverted ? y - PIPE_GAP / 2 - this.height : y + PIPE_GAP / 2;
        this.inverted = inverted;
        this.verticalSpeed = (Math.random() - 0.5) * 2; // Случайная вертикальная скорость
    }

    update() {
        this.x -= backgroundSpeed;
        this.y += this.verticalSpeed;

        // Обеспечиваем, чтобы трубы оставались в пределах экрана по вертикали
        if (this.inverted && this.y + this.height > canvas.height / 2) {
            this.y = canvas.height / 2 - this.height;
            this.verticalSpeed = -this.verticalSpeed;
        } else if (!this.inverted && this.y < canvas.height / 2) {
            this.y = canvas.height / 2;
            this.verticalSpeed = -this.verticalSpeed;
        }

        if (Date.now() - LAST_FRAME > 200) {
            this.frameIndex = (this.frameIndex + 1) % this.images.length;
            this.image = this.images[this.frameIndex];
            LAST_FRAME = Date.now();
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    offScreen() {
        return this.x + this.width < 0;
    }

    collide(shark) {
        return (
            this.x < shark.x + shark.width &&
            this.x + this.width > shark.x &&
            this.y < shark.y + shark.height &&
            this.y + this.height > shark.y
        );
    }
}

class PipePair {
    constructor() {
        this.passed = false;
        const gapY = Math.random() * (canvas.height - 200) + 100;
        this.topPipe = new Pipe(true, gapY);
        this.bottomPipe = new Pipe(false, gapY);
    }

    update() {
        this.topPipe.update();
        this.bottomPipe.update();
    }

    draw() {
        this.topPipe.draw();
        this.bottomPipe.draw();
    }

    offScreen() {
        return this.topPipe.offScreen();
    }

    collide(shark) {
        return this.topPipe.collide(shark) || this.bottomPipe.collide(shark);
    }
}

let shark = new BabyShark();
let pipes = [];
let bubbles = [];
let score = 0;
let running = false;
let gameOver = false;
let holdShark = true;

for (let i = 0; i < 20; i++) {
    bubbles.push(new Bubble(Math.random() * canvas.width, Math.random() * canvas.height));
}

function resetGame() {
    shark = new BabyShark();
    pipes = [];
    score = 0;
    running = true;
    gameOver = false;
    holdShark = true;
    backgroundSpeed = INITIAL_PIPE_SPEED;
    LAST_PIPE = Date.now();
    LAST_FRAME = Date.now();
    setTimeout(() => {
        holdShark = false;
    }, 1000);
}

document.getElementById('submitUsername').addEventListener('click', () => {
    const usernameInput = document.getElementById('usernameInput').value;
    if (usernameInput) {
        saveUserInfo(usernameInput);
        document.getElementById('usernameInputContainer').style.display = 'none';
        resetGame();  // Начать игру сразу после ввода имени
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !holdShark) {
        shark.flap();
    }
});

canvas.addEventListener('click', () => {
    if (!holdShark) {
        shark.flap();
    }
});

document.getElementById('startButton').addEventListener('click', () => {
    resetGame();
    document.getElementById('startButton').style.display = 'none'; // Скрыть кнопку после начала игры
    document.getElementById('tapMessage').style.display = 'none'; // Скрыть сообщение после начала игры
});

let backgroundX1 = 0;
let backgroundX2 = canvas.width;

function drawBackground() {
    let aspectRatio = backgroundImg.width / backgroundImg.height;
    let bgWidth = canvas.width;
    let bgHeight = canvas.width / aspectRatio;

    if (bgHeight < canvas.height) {
        bgHeight = canvas.height;
        bgWidth = canvas.height * aspectRatio;
    }

    // Draw the first background image
    ctx.drawImage(backgroundImg, backgroundX1, 0, bgWidth, bgHeight);
    
    // Draw the second background image
    ctx.drawImage(backgroundImg, backgroundX2, 0, bgWidth, bgHeight);
    
    // Add an extra draw call to cover the gap
    if (backgroundX1 < 0) {
        ctx.drawImage(backgroundImg, backgroundX1 + bgWidth, 0, bgWidth, bgHeight);
    }
    if (backgroundX2 < 0) {
        ctx.drawImage(backgroundImg, backgroundX2 + bgWidth, 0, bgWidth, bgHeight);
    }
}

function gameLoop() {
    if (running) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Move background
        backgroundX1 -= backgroundSpeed;
        backgroundX2 -= backgroundSpeed;

        if (backgroundX1 <= -canvas.width) {
            backgroundX1 = canvas.width;
        }
        if (backgroundX2 <= -canvas.width) {
            backgroundX2 = canvas.width;
        }

        drawBackground();

        if (!holdShark) {
            shark.update();
        }
        shark.draw();

        if (Date.now() - LAST_PIPE > PIPE_FREQUENCY) {
            pipes.push(new PipePair());
            LAST_PIPE = Date.now();
        }

        for (let pipePair of pipes) {
            pipePair.update();
            pipePair.draw();

            if (pipePair.collide(shark)) {
                gameOver = true;
                running = false;
                saveScore(score);
                loadLeaderboard();
            }

            if (!pipePair.passed && pipePair.topPipe.x + pipePair.topPipe.width < shark.x) {
                pipePair.passed = true;
                score++;
            }
        }

        pipes = pipes.filter(pipePair => !pipePair.offScreen());

        for (let bubble of bubbles) {
            bubble.update();
            bubble.draw();
        }

        ctx.fillStyle = 'white';
        ctx.font = `${canvas.width / 50}px Arial`; // Responsive font size
        ctx.fillText(`Score: ${score}`, 30, 50);

        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = `${canvas.width / 40}px Arial`; // Responsive font size
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);

            document.getElementById('startButton').style.display = 'block';
            document.getElementById('startButton').style.top = `${canvas.height / 2 + 20}px`;
            document.getElementById('tapMessage').style.display = 'block';
            document.getElementById('tapMessage').style.top = `${canvas.height / 2 + 60}px`;
            document.getElementById('leaderboard').style.display = 'block';
        } else {
            document.getElementById('startButton').style.display = 'none';
            document.getElementById('tapMessage').style.display = 'none';
            document.getElementById('leaderboard').style.display = 'none';

            // Увеличиваем скорость фона и труб
            backgroundSpeed += SPEED_INCREMENT;
        }
    }

    requestAnimationFrame(gameLoop);
}

function clearLeaderboard() {
    localStorage.removeItem('scores');
}

// clearLeaderboard(); // Удалите комментарий, если хотите очистить leaderboard при каждом запуске

loadUserInfo();
gameLoop();