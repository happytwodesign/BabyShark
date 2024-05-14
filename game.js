const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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
const PIPE_SPEED = 2;
const PIPE_GAP = 200;
const PIPE_FREQUENCY = 2000;
let LAST_PIPE = Date.now();
let LAST_FRAME = Date.now();

function resizeCanvas() {
    const aspectRatio = 4 / 3;
    if (window.innerWidth / window.innerHeight > aspectRatio) {
        canvas.height = window.innerHeight;
        canvas.width = window.innerHeight * aspectRatio;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerWidth / aspectRatio;
    }
    ctx.scale(canvas.width / 800, canvas.height / 600);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class BabyShark {
    constructor() {
        this.image = babySharkImg;
        this.x = 100;
        this.y = canvas.height / 2;
        this.width = 80;
        this.height = 40;
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
        this.width = 80;
        this.height = 150;
        this.x = canvas.width;
        this.y = inverted ? y - PIPE_GAP / 2 - this.height : y + PIPE_GAP / 2;
        this.inverted = inverted;
    }

    update() {
        this.x -= PIPE_SPEED;

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

for (let i = 0; i < 20; i++) {
    bubbles.push(new Bubble(Math.random() * canvas.width, Math.random() * canvas.height));
}

function resetGame() {
    shark = new BabyShark();
    pipes = [];
    score = 0;
    running = true;
    gameOver = false;
    LAST_PIPE = Date.now();
    LAST_FRAME = Date.now();
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!running) {
            resetGame();
        } else {
            shark.flap();
        }
    }
});

canvas.addEventListener('click', () => {
    if (!running) {
        resetGame();
    } else {
        shark.flap();
    }
});

document.getElementById('startButton').addEventListener('click', resetGame);

function gameLoop() {
    if (running) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        shark.update();
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
        ctx.font = '28px Arial';
        ctx.fillText(`Score: ${score}`, 20, 50);

        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);

            document.getElementById('startButton').style.display = 'block';
        } else {
            document.getElementById('startButton').style.display = 'none';
        }
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
