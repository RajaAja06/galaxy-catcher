const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  level: document.getElementById("level"),
  lives: document.getElementById("lives"),
  highScore: document.getElementById("highScore"),
  finalScore: document.getElementById("finalScore"),
  startScreen: document.getElementById("startScreen"),
  gameOverScreen: document.getElementById("gameOverScreen"),
  newRecord: document.getElementById("newRecord"),
  startButton: document.getElementById("startButton"),
  restartButton: document.getElementById("restartButton"),
  pauseButton: document.getElementById("pauseButton"),
  soundButton: document.getElementById("soundButton"),
  leftButton: document.getElementById("leftButton"),
  rightButton: document.getElementById("rightButton")
};

const keys = { left: false, right: false };
const backgroundStars = Array.from({ length: 70 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 1.8 + 0.4,
  alpha: Math.random() * 0.65 + 0.25
}));

let player;
let objects;
let particles;
let score = 0;
let lives = 3;
let level = 1;
let running = false;
let paused = false;
let muted = false;
let lastTime = 0;
let spawnTimer = 0;
let animationId;
let highScore = Number(localStorage.getItem("galaxyCatcherHighScore")) || 0;

ui.highScore.textContent = highScore;
drawIdleScene();

function resetGame() {
  player = { x: canvas.width / 2 - 50, y: canvas.height - 64, width: 100, height: 25, speed: 520 };
  objects = [];
  particles = [];
  score = 0;
  lives = 3;
  level = 1;
  spawnTimer = 0;
  lastTime = performance.now();
  paused = false;
  updateUI();
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();
  running = true;
  ui.startScreen.classList.add("hidden");
  ui.gameOverScreen.classList.add("hidden");
  ui.newRecord.classList.add("hidden");
  ui.pauseButton.classList.remove("hidden");
  ui.pauseButton.textContent = "Jeda";
  animationId = requestAnimationFrame(gameLoop);
}

function gameLoop(time) {
  if (!running) return;
  const delta = Math.min((time - lastTime) / 1000, 0.035);
  lastTime = time;

  if (!paused) {
    update(delta);
    draw();
  }

  animationId = requestAnimationFrame(gameLoop);
}

function update(delta) {
  if (keys.left) player.x -= player.speed * delta;
  if (keys.right) player.x += player.speed * delta;
  player.x = Math.max(8, Math.min(canvas.width - player.width - 8, player.x));

  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnObject();
    spawnTimer = Math.max(0.34, 0.82 - level * 0.045);
  }

  objects.forEach((item) => {
    item.y += item.speed * delta;
    item.rotation += item.spin * delta;
  });

  for (let i = objects.length - 1; i >= 0; i--) {
    const item = objects[i];
    if (isColliding(item, player)) {
      if (item.type === "meteor") {
        lives--;
        makeParticles(item.x, item.y, "#ff6685", 15);
        beep(105, 0.13);
      } else {
        const points = item.type === "crystal" ? 3 : 1;
        score += points;
        makeParticles(item.x, item.y, item.type === "crystal" ? "#68e8ff" : "#ffe66d", 11);
        beep(item.type === "crystal" ? 680 : 500, 0.07);
      }
      objects.splice(i, 1);
      level = Math.floor(score / 10) + 1;
      updateUI();
      if (lives <= 0) endGame();
    } else if (item.y - item.size > canvas.height) {
      objects.splice(i, 1);
    }
  }

  particles.forEach((particle) => {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
  });
  particles = particles.filter((particle) => particle.life > 0);
}

function spawnObject() {
  const chance = Math.random();
  const type = chance < 0.68 ? "star" : chance < 0.9 ? "meteor" : "crystal";
  const size = type === "meteor" ? 24 : type === "crystal" ? 18 : 20;
  objects.push({
    type,
    x: size + Math.random() * (canvas.width - size * 2),
    y: -35,
    size,
    speed: 155 + level * 18 + Math.random() * 65,
    rotation: 0,
    spin: (Math.random() - 0.5) * 4
  });
}

function isColliding(item, basket) {
  return item.x + item.size > basket.x &&
    item.x - item.size < basket.x + basket.width &&
    item.y + item.size > basket.y &&
    item.y - item.size < basket.y + basket.height;
}

function draw() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#080928");
  gradient.addColorStop(0.7, "#11154b");
  gradient.addColorStop(1, "#1c1648");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawHorizon();
  objects.forEach(drawObject);
  particles.forEach(drawParticle);
  drawPlayer();

  if (paused) {
    ctx.fillStyle = "rgba(5, 5, 22, .62)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 42px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("GAME DIJEDA", canvas.width / 2, canvas.height / 2);
  }
}

function drawBackground() {
  backgroundStars.forEach((star, index) => {
    const pulse = Math.sin(performance.now() * 0.002 + index) * 0.18;
    ctx.globalAlpha = star.alpha + pulse;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawHorizon() {
  ctx.fillStyle = "rgba(104, 232, 255, .06)";
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height + 105, 500, 150, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(104, 232, 255, .18)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  ctx.save();
  ctx.shadowColor = "#68e8ff";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#68e8ff";
  roundRect(x, y, player.width, player.height, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#17183f";
  roundRect(x + 10, y + 6, player.width - 20, 8, 5);
  ctx.fill();
  ctx.fillStyle = "#9b7cff";
  ctx.beginPath();
  ctx.moveTo(x + 22, y + player.height);
  ctx.lineTo(x + 34, y + player.height + 14);
  ctx.lineTo(x + 45, y + player.height);
  ctx.moveTo(x + 56, y + player.height);
  ctx.lineTo(x + 68, y + player.height + 14);
  ctx.lineTo(x + 79, y + player.height);
  ctx.fill();
  ctx.restore();
}

function drawObject(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation);
  if (item.type === "star") {
    ctx.shadowColor = "#ffe66d";
    ctx.shadowBlur = 18;
    drawStar(0, 0, 5, item.size, item.size * 0.45, "#ffe66d");
  } else if (item.type === "crystal") {
    ctx.shadowColor = "#68e8ff";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#68e8ff";
    ctx.beginPath();
    ctx.moveTo(0, -item.size);
    ctx.lineTo(item.size * .75, 0);
    ctx.lineTo(0, item.size);
    ctx.lineTo(-item.size * .75, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = "#8b4562";
    ctx.beginPath();
    ctx.arc(0, 0, item.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#592b4b";
    ctx.beginPath();
    ctx.arc(-7, -5, 5, 0, Math.PI * 2);
    ctx.arc(7, 7, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
  let rotation = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rotation) * outerRadius, cy + Math.sin(rotation) * outerRadius);
    rotation += step;
    ctx.lineTo(cx + Math.cos(rotation) * innerRadius, cy + Math.sin(rotation) * innerRadius);
    rotation += step;
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function makeParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y, color,
      vx: (Math.random() - 0.5) * 190,
      vy: (Math.random() - 0.5) * 190,
      size: Math.random() * 4 + 2,
      life: Math.random() * 0.45 + 0.25
    });
  }
}

function drawParticle(particle) {
  ctx.globalAlpha = Math.max(0, particle.life * 2);
  ctx.fillStyle = particle.color;
  ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  ctx.globalAlpha = 1;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function updateUI() {
  ui.score.textContent = score;
  ui.level.textContent = level;
  ui.lives.textContent = Array(Math.max(0, lives)).fill("❤").join(" ") || "—";
}

function endGame() {
  running = false;
  cancelAnimationFrame(animationId);
  ui.pauseButton.classList.add("hidden");
  ui.finalScore.textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("galaxyCatcherHighScore", highScore);
    ui.highScore.textContent = highScore;
    ui.newRecord.classList.remove("hidden");
  }
  ui.gameOverScreen.classList.remove("hidden");
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  ui.pauseButton.textContent = paused ? "Lanjut" : "Jeda";
  lastTime = performance.now();
  draw();
}

function beep(frequency, duration) {
  if (muted) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.035, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function drawIdleScene() {
  player = { x: canvas.width / 2 - 50, y: canvas.height - 64, width: 100, height: 25, speed: 520 };
  objects = [];
  particles = [];
  draw();
}

function setDirection(direction, active) {
  keys[direction] = active;
}

document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "a", "A"].includes(event.key)) setDirection("left", true);
  if (["ArrowRight", "d", "D"].includes(event.key)) setDirection("right", true);
  if (event.key === " " && running) togglePause();
});

document.addEventListener("keyup", (event) => {
  if (["ArrowLeft", "a", "A"].includes(event.key)) setDirection("left", false);
  if (["ArrowRight", "d", "D"].includes(event.key)) setDirection("right", false);
});

function bindHoldButton(button, direction) {
  ["pointerdown", "touchstart"].forEach((name) => button.addEventListener(name, (event) => {
    event.preventDefault();
    setDirection(direction, true);
  }, { passive: false }));
  ["pointerup", "pointercancel", "pointerleave", "touchend"].forEach((name) => button.addEventListener(name, () => {
    setDirection(direction, false);
  }));
}

bindHoldButton(ui.leftButton, "left");
bindHoldButton(ui.rightButton, "right");
ui.startButton.addEventListener("click", startGame);
ui.restartButton.addEventListener("click", startGame);
ui.pauseButton.addEventListener("click", togglePause);
ui.soundButton.addEventListener("click", () => {
  muted = !muted;
  ui.soundButton.textContent = muted ? "🔇" : "🔊";
});
