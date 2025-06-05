// =======================
// --- GAME SETTINGS ---
// =======================
const BOARD_SIZE = 8; // 8x8 board
const COLORS = [
  { name: "Yellow", code: "#FFEB3B" },
  { name: "Red", code: "#E53935" },
  { name: "Green", code: "#43A047" },
  { name: "Blue", code: "#1E88E5" },
  { name: "Purple", code: "#9C27B0" }
];

// =======================
// --- HERO DATA ---
// =======================
const heroes = [
  { name: "Flareblade", color: "Red", hp: 100, maxHp: 100, mp: 0, mpMax: 50, attack: 30 },
  { name: "Aquaria", color: "Blue", hp: 90, maxHp: 90, mp: 0, mpMax: 50, attack: 25 },
  { name: "Verdant", color: "Green", hp: 110, maxHp: 110, mp: 0, mpMax: 50, attack: 35 }
];

// =======================
// --- ENEMY DATA ---
// =======================
const enemy = 
{
  name: "Shadow Fiend",
  hp: 125,
  maxHp: 125,
  color: "Purple"
//img: "enemy.png" // optional, if you want to use an image
}

function renderEnemy() {
  const enemyNameDiv = document.getElementById('enemy-name');
  const enemyHpFill = document.getElementById('enemy-hp-fill');
  const enemyColorDiv = document.getElementById('enemy-color');
  const enemyImg = document.getElementById('enemy-img');
  if (enemyNameDiv) enemyNameDiv.textContent = enemy.name;
  if (enemyHpFill) enemyHpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
  if (enemyColorDiv) enemyColorDiv.style.background = enemy.color;
  if (enemyImg && enemy.img) {
    enemyImg.src = enemy.img;
    enemyImg.style.display = "block";
  }
}

function dealDamageToEnemy(damage, attackerName) {
  const logDiv = document.createElement("div");
  logDiv.className = "damage-log";
  logDiv.textContent = `${attackerName} hits ${enemy.name} for ${damage}!`;
  document.body.appendChild(logDiv);

  setTimeout(() => logDiv.remove(), 1500);

  enemy.hp = Math.max(0, enemy.hp - damage);
  renderEnemy();

  if (enemy.hp === 0) {
    handleEnemyDefeat();
  } else {
    flashEnemyPanel();
  }
}

function handleEnemyDefeat() {
  const winDiv = document.createElement("div");
  winDiv.className = "victory";
  winDiv.textContent = "Enemy Defeated!";
  document.body.appendChild(winDiv);

  stopTimer();
  gameOver = true;
  animating = true;
}

function flashEnemyPanel() {
  const enemyContainer = document.getElementById('enemy-container');
  if (enemyContainer) {
    enemyContainer.classList.add("hit");
    setTimeout(() => {
      enemyContainer.classList.remove("hit");
    }, 300);
  }
}
// =======================
// --- GAME STATE ---
// =======================
let board = [];
let score = 0;
let selected = null; // {row, col}
let animating = false;
let gameOver = false;

// =======================
// --- TIMER STATE ---
// =======================
const TIMER_START = 10000; // 10 seconds in ms
let timerInterval = null;
let timerPaused = false;
let timeLeft = TIMER_START;
let lastTick = null;

// =======================
// --- DOM ELEMENTS ---
// =======================
const boardDiv = document.getElementById('board');
const scoreDiv = document.getElementById('score');
const timerDiv = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const heroPanel = document.getElementById('heroPanel');

// =======================
// --- TIMER FUNCTIONS ---
// =======================
function formatTime(ms) {
  const sec = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${sec}.${tenths}`;
}

function updateTimerDisplay() {
  timerDiv.textContent = "Time: " + formatTime(Math.max(timeLeft, 0));
}

function startTimer() {
  if (timerInterval) return;
  timerPaused = false;
  lastTick = Date.now();
  timerInterval = setInterval(() => {
    if (!timerPaused && !gameOver) {
      const now = Date.now();
      const dt = now - lastTick;
      lastTick = now;
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerDisplay();
        stopTimer();
        handleGameOver();
        return;
      }
      updateTimerDisplay();
    }
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function pauseTimer() {
  if (!timerPaused && !gameOver) {
    timerPaused = true;
    const now = Date.now();
    timeLeft -= Math.max(0, now - lastTick);
    updateTimerDisplay();
  }
}

function resumeTimer() {
  if (timerPaused && !gameOver) {
    timerPaused = false;
    lastTick = Date.now();
  }
}

function resetTimer() {
  stopTimer();
  timeLeft = TIMER_START;
  timerPaused = false;
  gameOver = false;
  updateTimerDisplay();
}

function handleGameOver() {
  gameOver = true;
  animating = true;
  timerDiv.textContent = "Time: 0.0 (Game Over)";
}

// =======================
// --- HERO UI FUNCTIONS ---
// =======================
function renderHeroes() {
  heroPanel.innerHTML = "";
  heroes.forEach(hero => {
    const heroDiv = document.createElement('div');
    heroDiv.className = "hero";

    // Name
    const name = document.createElement('div');
    name.className = "hero-name";
    name.textContent = hero.name;

    // Color badge
    const colorBadge = document.createElement('div');
    colorBadge.className = "hero-color";
    const colorObj = COLORS.find(c => c.name === hero.color);
    colorBadge.style.backgroundColor = colorObj ? colorObj.code : "#ccc";

    // HP bar
    const hpBar = document.createElement('div');
    hpBar.className = "bar hp-bar";
    hpBar.innerHTML = `<div style="width:${(hero.hp / hero.maxHp) * 100}%" class="fill hp-fill"></div>`;

    // MP bar
    const mpBar = document.createElement('div');
    mpBar.className = "bar mp-bar";
    mpBar.innerHTML = `<div style="width:${(hero.mp / hero.mpMax) * 100}%" class="fill mp-fill"></div>`;

    // Append all
    heroDiv.appendChild(name);
    heroDiv.appendChild(colorBadge);
    heroDiv.appendChild(hpBar);
    heroDiv.appendChild(mpBar);

    heroPanel.appendChild(heroDiv);
  });
}

function resetHeroesMp() {
  heroes.forEach(hero => {
    hero.mp = 0;
  });
  renderHeroes();
}

// =======================
// --- BOARD FUNCTIONS ---
// =======================
function randomGem() {
  return Math.floor(Math.random() * COLORS.length);
}

function initBoard() {
  board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      let gem;
      do {
        gem = randomGem();
        row[c] = gem;
      } while (
        (c >= 2 && row[c-1] === gem && row[c-2] === gem) ||
        (r >= 2 && board[r-1][c] === gem && board[r-2][c] === gem) ||
        (r >= 2 && c >= 2 && board[r-1][c-1] === gem && board[r-2][c-2] === gem) ||
        (r >= 2 && c <= BOARD_SIZE - 3 && board[r-1][c+1] === gem && board[r-2][c+2] === gem)
      );
    }
    board.push(row);
  }
  enemy.hp = enemy.maxHp;
  score = 0;
  selected = null;
  animating = false;
  gameOver = false;
  updateBoard();
  updateScore();
  resetTimer();
  startTimer();
  resetHeroesMp();
  renderHeroes();
  renderEnemy();
}

function updateBoard(matchedPositions = []) {
  boardDiv.innerHTML = "";
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const gemDiv = document.createElement('div');
      gemDiv.className = 'gem';
      gemDiv.style.background = COLORS[board[r][c]].code;
      gemDiv.title = COLORS[board[r][c]].name;
      gemDiv.dataset.row = r;
      gemDiv.dataset.col = c;
      if (selected && selected.row === r && selected.col === c) {
        gemDiv.classList.add('selected');
      }
      // Highlight matched gems
      if (matchedPositions.some(pos => pos.r === r && pos.c === c)) {
        gemDiv.classList.add('matched');
      }
      if (gameOver) gemDiv.style.pointerEvents = "none";
      gemDiv.onclick = () => selectGem(r, c);
      boardDiv.appendChild(gemDiv);
    }
  }
}

function updateScore() {
  scoreDiv.textContent = `Score: ${score}`;
}

// =======================
// --- INPUT HANDLING ---
// =======================
function selectGem(row, col) {
  if (animating || gameOver) return;

  if (!selected) {
    selected = { row, col };
  } else {
    const dist = Math.abs(selected.row - row) + Math.abs(selected.col - col);
    // allow horizontal, vertical, and diagonal swaps dist=1 or 2 (diagonal)
    if (dist === 1 || dist === 2) {
      swapGems(selected.row, selected.col, row, col);
    }
    selected = null;
  }
  updateBoard();
}

function swapGems(r1, c1, r2, c2) {
  animating = true;

  // Swap gems on board
  const temp = board[r1][c1];
  board[r1][c1] = board[r2][c2];
  board[r2][c2] = temp;
  updateBoard();

  setTimeout(() => {
    const matches = findMatches();
    if (matches.length === 0) {
      // No match: just end
      animating = false;
    } else {
      pauseTimer();      // Stop countdown during match animation
      handleMatches(matches);
    }
  }, 200);
}

// =======================
// --- MATCH FINDING & HANDLING ---
// =======================
function findMatches() {
  let matches = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const color = board[r][c];

      // Horizontal match
      if (c <= BOARD_SIZE - 3) {
        if (board[r][c+1] === color && board[r][c+2] === color) {
          matches.push({ r, c }, { r, c: c+1 }, { r, c: c+2 });
        }
      }

      // Vertical match
      if (r <= BOARD_SIZE - 3) {
        if (board[r+1][c] === color && board[r+2][c] === color) {
          matches.push({ r, c }, { r: r+1, c }, { r: r+2, c });
        }
      }

      // Diagonal down-right
      if (r <= BOARD_SIZE - 3 && c <= BOARD_SIZE - 3) {
        if (board[r+1][c+1] === color && board[r+2][c+2] === color) {
          matches.push({ r, c }, { r: r+1, c: c+1 }, { r: r+2, c: c+2 });
        }
      }

      // Diagonal down-left
      if (r <= BOARD_SIZE - 3 && c >= 2) {
        if (board[r+1][c-1] === color && board[r+2][c-2] === color) {
          matches.push({ r, c }, { r: r+1, c: c-1 }, { r: r+2, c: c-2 });
        }
      }
    }
  }

  // Remove duplicates
  const uniqueMatches = [];
  const seen = new Set();
  for (const m of matches) {
    const key = `${m.r},${m.c}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(m);
    }
  }
  return uniqueMatches;
}

function handleMatches(matches) {
  // Increase score & grant mana by matched gem color
  const matchedColors = new Set();
  matches.forEach(({ r, c }) => {
    const colorIndex = board[r][c];
    if (colorIndex !== null) {
      const colorName = COLORS[colorIndex].name;
      matchedColors.add(colorName);
    }
  });

  matchedColors.forEach(colorName => {
    score += 10;
    const hero = heroes.find(h => h.color === colorName);
    if (hero) {
      hero.mp = Math.min(hero.mp + 10, hero.mpMax);
    }
  });

  // 1. Highlight matched gems
  updateBoard(matches);

  // 2. Wait, then remove matched gems and continue
  setTimeout(() => {
    // Remove matched gems (set to null)
    matches.forEach(({ r, c }) => {
      board[r][c] = null;
    });

    updateScore();
    renderHeroes();

    // Animate falling & new gems
    setTimeout(() => {
      collapseBoard();
    }, 300);
  }, 300); // Show highlight for 300ms
}
function collapseBoard() {
  for (let c = 0; c < BOARD_SIZE; c++) {
    let pointer = BOARD_SIZE - 1;
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        board[pointer][c] = board[r][c];
        if (pointer !== r) board[r][c] = null;
        pointer--;
      }
    }
    // Fill top empty slots
    for (let r = pointer; r >= 0; r--) {
      board[r][c] = randomGem();
    }
  }
  updateBoard();

  setTimeout(() => {
    const newMatches = findMatches();
    if (newMatches.length > 0) {
      handleMatches(newMatches);
    } else {
      animating = false;

      // Sequential hero attacks with delay
      function attackHeroesSequentially(index = 0, callback) {
        if (index >= heroes.length) {
          if (callback) callback();
          return;
        }
        const hero = heroes[index];
        if (hero.mp >= hero.mpMax && enemy.hp > 0) {
          hero.mp = 0;
          renderHeroes();
          dealDamageToEnemy(hero.attack, hero.name);
          setTimeout(() => {
            if (enemy.hp > 0) {
              attackHeroesSequentially(index + 1, callback);
            } else {
              if (callback) callback();
            }
          }, 400);
        } else {
          attackHeroesSequentially(index + 1, callback);
        }
      }
      attackHeroesSequentially(0, resumeTimer);
    }
  }, 300);
}

// =======================
// --- EVENT LISTENERS ---
// =======================
resetBtn.onclick = () => {
  initBoard();
};

// =======================
// --- INIT GAME ---
// =======================
initBoard();
