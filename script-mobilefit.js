const cardItems = [
  { key: "sun", label: "태양", emoji: "☀️", start: "#ffe082", end: "#ffb300" },
  { key: "moon", label: "달", emoji: "🌙", start: "#c5cae9", end: "#7986cb" },
  { key: "cloud", label: "구름", emoji: "☁️", start: "#d7f0ff", end: "#90caf9" },
  { key: "flower", label: "꽃", emoji: "🌸", start: "#ffd6e7", end: "#f48fb1" },
  { key: "leaf", label: "잎", emoji: "🍀", start: "#dcedc8", end: "#81c784" },
  { key: "fish", label: "물고기", emoji: "🐟", start: "#c8e6ff", end: "#4fc3f7" },
  { key: "rocket", label: "로켓", emoji: "🚀", start: "#e1bee7", end: "#ba68c8" },
  { key: "car", label: "자동차", emoji: "🚗", start: "#ffe0b2", end: "#ff8a65" },
  { key: "cake", label: "케이크", emoji: "🎂", start: "#f8bbd0", end: "#f06292" },
  { key: "gift", label: "선물", emoji: "🎁", start: "#ffecb3", end: "#ffca28" }
];

const TOTAL_PAIRS = 10;
const STORAGE_KEY = "memoryGameBestRecord5x4";

const board = document.getElementById("gameBoard");
const turnCount = document.getElementById("turnCount");
const timeCount = document.getElementById("timeCount");
const matchedCount = document.getElementById("matchedCount");
const message = document.getElementById("message");
const resetButton = document.getElementById("resetButton");
const bestRecordText = document.getElementById("bestRecordText");

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let turns = 0;
let matchedPairs = 0;
let timerId = null;
let startTime = null;
let gameStarted = false;
let currentSeconds = 0;

function shuffle(array) {
  const copiedArray = [...array];

  for (let index = copiedArray.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copiedArray[index], copiedArray[randomIndex]] = [
      copiedArray[randomIndex],
      copiedArray[index]
    ];
  }

  return copiedArray;
}

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainSeconds = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainSeconds}`;
}

function createCardImage(item) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${item.start}" />
          <stop offset="100%" stop-color="${item.end}" />
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="28" fill="url(#bg)" />
      <circle cx="90" cy="70" r="42" fill="rgba(255,255,255,0.32)" />
      <text x="90" y="92" text-anchor="middle" font-size="54">${item.emoji}</text>
      <rect x="28" y="126" width="124" height="28" rx="14" fill="rgba(255,255,255,0.78)" />
      <text x="90" y="145" text-anchor="middle" font-size="18" font-weight="700" fill="#503221">${item.label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function loadBestRecord() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
}

function saveBestRecord(record) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

function updateBestRecordText() {
  const record = loadBestRecord();

  if (!record) {
    bestRecordText.textContent = "5x4 최고기록이 아직 없습니다.";
    return;
  }

  bestRecordText.textContent = `턴 ${record.turns} / 시간 ${formatTime(record.seconds)}`;
}

function startTimer() {
  if (timerId) {
    return;
  }

  startTime = Date.now() - currentSeconds * 1000;
  timerId = setInterval(() => {
    currentSeconds = Math.floor((Date.now() - startTime) / 1000);
    timeCount.textContent = formatTime(currentSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function updateStatus() {
  turnCount.textContent = String(turns);
  matchedCount.textContent = `${matchedPairs} / ${TOTAL_PAIRS}`;
}

function setupGame() {
  stopTimer();

  cards = shuffle([...cardItems, ...cardItems]).map((item, index) => ({
    id: index,
    pairKey: item.key,
    label: item.label,
    image: createCardImage(item),
    matched: false
  }));

  firstCard = null;
  secondCard = null;
  lockBoard = false;
  turns = 0;
  matchedPairs = 0;
  gameStarted = false;
  currentSeconds = 0;

  timeCount.textContent = "00:00";
  message.textContent = "카드를 눌러 5x4 게임을 시작하세요.";
  updateStatus();
  updateBestRecordText();
  renderBoard();
}

function renderBoard() {
  board.innerHTML = "";

  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.dataset.id = String(card.id);
    button.dataset.pairKey = card.pairKey;
    button.setAttribute("aria-label", "숨겨진 카드");

    if (card.matched) {
      button.classList.add("is-matched");
      button.disabled = true;
      button.setAttribute("aria-label", `${card.label} 카드, 맞춤 완료`);
    }

    button.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back">
          <span class="card-mark">★</span>
          <span class="card-back-text">MEMORY</span>
        </span>
        <span class="card-face card-front">
          <img class="card-image" src="${card.image}" alt="${card.label} 그림 카드">
        </span>
      </span>
    `;

    button.addEventListener("click", () => handleCardClick(button, card));
    board.appendChild(button);
  });
}

function handleCardClick(button, card) {
  if (lockBoard || card.matched || button === firstCard) {
    return;
  }

  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  button.classList.add("is-flipped");
  button.setAttribute("aria-label", `${card.label} 카드`);

  if (!firstCard) {
    firstCard = button;
    return;
  }

  secondCard = button;
  lockBoard = true;
  turns += 1;
  updateStatus();

  const isMatch = firstCard.dataset.pairKey === secondCard.dataset.pairKey;

  if (isMatch) {
    keepMatchedCards();
  } else {
    hideUnmatchedCards();
  }
}

function isBetterRecord(newTurns, newSeconds, savedRecord) {
  if (!savedRecord) {
    return true;
  }

  if (newTurns < savedRecord.turns) {
    return true;
  }

  if (newTurns === savedRecord.turns && newSeconds < savedRecord.seconds) {
    return true;
  }

  return false;
}

function saveIfBestRecord() {
  const currentRecord = loadBestRecord();

  if (!isBetterRecord(turns, currentSeconds, currentRecord)) {
    return false;
  }

  saveBestRecord({
    turns,
    seconds: currentSeconds
  });

  updateBestRecordText();
  return true;
}

function keepMatchedCards() {
  const firstMatchedCard = firstCard;
  const secondMatchedCard = secondCard;
  const firstId = Number(firstMatchedCard.dataset.id);
  const secondId = Number(secondMatchedCard.dataset.id);

  cards = cards.map((card) => {
    if (card.id === firstId || card.id === secondId) {
      return { ...card, matched: true };
    }
    return card;
  });

  firstMatchedCard.classList.add("is-matched", "just-matched");
  secondMatchedCard.classList.add("is-matched", "just-matched");
  firstMatchedCard.disabled = true;
  secondMatchedCard.disabled = true;

  setTimeout(() => {
    firstMatchedCard.classList.remove("just-matched");
    secondMatchedCard.classList.remove("just-matched");
  }, 700);

  matchedPairs += 1;
  updateStatus();

  if (matchedPairs === TOTAL_PAIRS) {
    stopTimer();
    const isBestRecord = saveIfBestRecord();
    message.textContent = isBestRecord
      ? `축하합니다! 5x4 최고기록을 달성했어요. ${turns}턴 / ${formatTime(currentSeconds)}`
      : `축하합니다! ${turns}턴 만에 ${formatTime(currentSeconds)} 동안 모두 맞췄어요.`;
  } else {
    message.textContent = "정답입니다. 반짝이는 카드가 고정됐어요.";
  }

  resetTurnState();
}

function hideUnmatchedCards() {
  const firstOpenedCard = firstCard;
  const secondOpenedCard = secondCard;

  message.textContent = "다른 카드예요. 다시 기억해 보세요.";

  setTimeout(() => {
    firstOpenedCard.classList.remove("is-flipped");
    secondOpenedCard.classList.remove("is-flipped");
    firstOpenedCard.setAttribute("aria-label", "숨겨진 카드");
    secondOpenedCard.setAttribute("aria-label", "숨겨진 카드");
    resetTurnState();
  }, 850);
}

function resetTurnState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

resetButton.addEventListener("click", setupGame);

setupGame();
