const characters = [
  { name: "Grote Smurf", src: "assets/grote-smurf.png" },
  { name: "Smurfin", src: "assets/smurfin.png" },
  { name: "Brilsmurf", src: "assets/brilsmurf.png" },
  { name: "Knutselsmurf", src: "assets/knutselsmurf.png" },
  { name: "Azraël", src: "assets/azrael.png" },
  { name: "Gargamel", src: "assets/gargamel.png" },
];

const numberWords = [
  "nul",
  "één",
  "twee",
  "drie",
  "vier",
  "vijf",
  "zes",
  "zeven",
  "acht",
  "negen",
  "tien",
];

const learningColors = [
  { name: "groen", adjective: "groene", hex: "#55b957", soft: "#d9f4d6" },
  { name: "geel", adjective: "gele", hex: "#f5c927", soft: "#fff4b5" },
  { name: "rood", adjective: "rode", hex: "#ef5350", soft: "#ffd8d6" },
  { name: "blauw", adjective: "blauwe", hex: "#168eea", soft: "#d7efff" },
  { name: "oranje", adjective: "oranje", hex: "#f39235", soft: "#ffe2c5" },
  { name: "paars", adjective: "paarse", hex: "#9b64d7", soft: "#eadbfa" },
];

const colorTasks = [
  { name: "appel", article: "een", shape: "apple", character: characters[0] },
  { name: "cadeautje", article: "een", shape: "gift", character: characters[2], neutral: true },
  { name: "bal", article: "een", shape: "ball", character: characters[1] },
  { name: "hoed", article: "een", shape: "hat", character: characters[3] },
  { name: "visje", article: "een", shape: "fish", character: characters[4], neutral: true },
  { name: "boek", article: "een", shape: "book", character: characters[5], neutral: true },
];

const scatterSpots = [
  { x: 13, y: 15 }, { x: 39, y: 12 }, { x: 67, y: 16 }, { x: 86, y: 29 },
  { x: 23, y: 35 }, { x: 53, y: 33 }, { x: 77, y: 49 }, { x: 10, y: 55 },
  { x: 38, y: 55 }, { x: 61, y: 65 }, { x: 70, y: 82 }, { x: 25, y: 78 },
];

const countingCharacter = characters[0];
const gentleSequences = {
  5: [1, 2, 3, 2, 4, 3, 5, 4, 5],
  10: [6, 7, 8, 6, 9, 7, 10, 8, 9, 10],
};
const colorModes = new Set(["color-match"]);

const savedMaxCount = Number(localStorage.getItem("eden-max-count"));
const initialMaxCount = [5, 10].includes(savedMaxCount) ? savedMaxCount : 5;

const state = {
  maxCount: initialMaxCount,
  soundOn: localStorage.getItem("eden-sound") !== "off",
  mode: "count",
  menuCategory: "counting",
  roundIndex: 0,
  colorIndex: 0,
  successes: 0,
  countTarget: 1,
  counted: 0,
  phase: "welcome",
  roundFigure: countingCharacter,
  colorTarget: learningColors[0],
  colorTask: colorTasks[0],
  countedFigures: [],
  roundFigures: [],
  resultHasGifts: false,
  instructionSpeech: "Tik op de figuren.",
};

const welcomeScreen = document.querySelector("#welcomeScreen");
const modeScreen = document.querySelector("#modeScreen");
const gameScreen = document.querySelector("#gameScreen");
const celebrationScreen = document.querySelector("#celebrationScreen");
const countStage = document.querySelector("#countStage");
const characterGrid = document.querySelector("#characterGrid");
const instruction = document.querySelector("#instruction");
const instructionCard = document.querySelector(".instruction-card");
const instructionFigure = document.querySelector("#instructionFigure");
const instructionSwatch = document.querySelector("#instructionSwatch");
const liveNumber = document.querySelector("#liveNumber");
const progressDots = document.querySelector("#progressDots");
const soundButton = document.querySelector("#soundButton");
const parentDialog = document.querySelector("#parentDialog");
const installButton = document.querySelector("#installButton");
const installStatus = document.querySelector("#installStatus");
const celebrationKicker = document.querySelector("#celebrationKicker");
const celebrationNumber = document.querySelector("#celebrationNumber");
const celebrationColor = document.querySelector("#celebrationColor");
const celebrationWord = document.querySelector("#celebrationWord");
const celebrationTitle = document.querySelector("#celebrationTitle");
const resultDots = document.querySelector("#resultDots");
const celebrationFriends = document.querySelector("#celebrationFriends");

let audioContext;
let speechTimer;
let finishTimer;
let deferredInstallPrompt = null;

function showScreen(screen) {
  const shell = document.querySelector(".app-shell");
  document.activeElement?.blur();
  shell.scrollTop = 0;
  window.scrollTo(0, 0);
  [welcomeScreen, modeScreen, gameScreen, celebrationScreen].forEach((item) => {
    item.classList.toggle("is-active", item === screen);
  });
  window.requestAnimationFrame(() => {
    shell.scrollTop = 0;
    window.scrollTo(0, 0);
  });
}

function shuffled(items) {
  return [...items]
    .map((item) => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

function getDutchVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return (
    voices.find((voice) => voice.lang.toLowerCase() === "nl-be") ||
    voices.find((voice) => voice.lang.toLowerCase() === "nl-nl") ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("nl"))
  );
}

function speak(text, { delay = 0, rate = 0.78, pitch = 1.08 } = {}) {
  if (!state.soundOn || !window.speechSynthesis) return;
  window.clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "nl-BE";
    utterance.rate = rate;
    utterance.pitch = pitch;
    const voice = getDutchVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, delay);
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  if (audioContext?.state === "suspended") audioContext.resume();
}

function playTone(notes, duration = 0.16) {
  if (!state.soundOn) return;
  ensureAudio();
  if (!audioContext) return;

  const start = audioContext.currentTime;
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + index * duration);
    gain.gain.exponentialRampToValueAtTime(0.12, start + index * duration + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + index * duration + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start + index * duration);
    oscillator.stop(start + index * duration + duration + 0.02);
  });
}

function renderProgress() {
  progressDots.innerHTML = "";
  for (let index = 0; index < 5; index += 1) {
    const dot = document.createElement("span");
    dot.className = `progress-dot${index < state.successes % 5 ? " is-filled" : ""}`;
    progressDots.append(dot);
  }
}

function getNextTarget() {
  const sequence = gentleSequences[state.maxCount];
  const target = sequence[state.roundIndex % sequence.length];
  state.roundIndex += 1;
  return target;
}

function getNextColor() {
  const palette = state.maxCount === 5 ? learningColors.slice(0, 4) : learningColors;
  const color = palette[state.colorIndex % palette.length];
  state.colorIndex += 1;
  return color;
}

function updateLevelLabels() {
  const easy = state.maxCount === 5;
  document.querySelector(".grown-up-hint").textContent = easy
    ? "Makkelijk: samen tellen tot 5"
    : "Moeilijker: samen tellen tot 10";
  updateModeLevelHint();
}

function updateModeLevelHint() {
  const hint = document.querySelector("#modeLevelHint");
  const easy = state.maxCount === 5;
  if (state.menuCategory === "colors") {
    hint.textContent = easy ? "Makkelijk · groen, geel, rood en blauw" : "Moeilijker · zes kleuren";
  } else {
    hint.textContent = easy ? "Makkelijk · tellen tot 5" : "Moeilijker · tellen tot 10";
  }
}

function showModeCategory(category) {
  state.menuCategory = category === "colors" ? "colors" : "counting";
  document.querySelectorAll(".mode-tab").forEach((button) => {
    const active = button.dataset.category === state.menuCategory;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-category-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.categoryPanel !== state.menuCategory;
  });
  updateModeLevelHint();
  modeScreen.scrollTop = 0;
}

function showModeSelection() {
  state.phase = "choosing-mode";
  window.clearTimeout(finishTimer);
  window.speechSynthesis?.cancel();
  showScreen(modeScreen);
  showModeCategory(state.menuCategory);
}

function chooseMode(mode) {
  state.mode = mode;
  state.roundIndex = 0;
  state.colorIndex = 0;
  startRound();
}

function resetInstructionVisuals() {
  instructionCard.classList.remove("has-figure", "has-swatch");
  instructionFigure.hidden = true;
  instructionSwatch.hidden = true;
}

function setInstruction(text, speechText = text) {
  instruction.textContent = text;
  state.instructionSpeech = speechText;
}

function showInstructionFigure(character) {
  instructionFigure.src = character.src;
  instructionFigure.alt = character.name;
  instructionFigure.hidden = false;
  instructionCard.classList.add("has-figure");
}

function showInstructionColor(color) {
  instructionSwatch.style.background = color.hex;
  instructionSwatch.hidden = false;
  instructionCard.classList.add("has-swatch");
}

function prepareRound() {
  window.clearTimeout(finishTimer);
  state.phase = "playing";
  state.counted = 0;
  state.resultHasGifts = false;
  state.roundFigure = countingCharacter;
  state.countedFigures = [];
  state.roundFigures = [];
  showScreen(gameScreen);
  renderProgress();
  liveNumber.classList.remove("is-showing", "is-color");
  characterGrid.replaceChildren();
  characterGrid.className = "character-grid";
  characterGrid.dataset.mode = state.mode;
  countStage.dataset.mode = state.mode;
  resetInstructionVisuals();
}

function startRound() {
  prepareRound();
  if (colorModes.has(state.mode)) {
    state.colorTarget = getNextColor();
    startColorMatchGame();
    return;
  }

  state.countTarget = getNextTarget();
  state.roundFigure = characters[(state.roundIndex - 1) % characters.length];
  characterGrid.dataset.count = String(state.countTarget);
  const starters = {
    count: startCountingGame,
    search: startSearchGame,
    gift: startGiftGame,
    flashlight: startFlashlightGame,
    brush: startBrushGame,
    train: startTrainGame,
    doors: startDoorsGame,
    path: startPathGame,
    puzzle: startPuzzleGame,
  };
  (starters[state.mode] || startCountingGame)();
}

function createCharacterCard(character, index, interactive = true) {
  const card = document.createElement(interactive ? "button" : "div");
  if (interactive) card.type = "button";
  card.className = "character-card";
  card.dataset.characterIndex = String(characters.indexOf(character));
  card.style.setProperty("--delay", `${index * 220}ms`);
  card.dataset.defaultLabel =
    state.countTarget === 1
      ? `${character.name} aantikken`
      : `${character.name} ${index + 1} aantikken`;

  if (interactive) card.setAttribute("aria-label", card.dataset.defaultLabel);
  else card.setAttribute("aria-hidden", "true");

  card.innerHTML = `
    <img src="${character.src}" alt="${interactive ? character.name : ""}" draggable="false" />
    <span class="count-badge" aria-hidden="true"></span>
  `;
  return card;
}

function createCountFigure(className, character = state.roundFigure) {
  const figure = document.createElement("div");
  figure.className = className;
  figure.dataset.characterIndex = String(characters.indexOf(character));
  figure.innerHTML = `
    <img src="${character.src}" alt="" draggable="false" />
    <span class="count-badge" aria-hidden="true"></span>
  `;
  return figure;
}

function showLiveNumber(number) {
  liveNumber.classList.remove("is-showing", "is-color");
  liveNumber.textContent = number;
  void liveNumber.offsetWidth;
  liveNumber.classList.add("is-showing");
}

function showLiveColor(color) {
  liveNumber.classList.remove("is-showing");
  liveNumber.classList.add("is-color");
  liveNumber.style.setProperty("--live-color", color.hex);
  liveNumber.textContent = color.name;
  void liveNumber.offsetWidth;
  liveNumber.classList.add("is-showing");
}

function announceCount() {
  showLiveNumber(state.counted);
  playTone([360 + state.counted * 42], 0.13);
  speak(numberWords[state.counted], { delay: 70, rate: 0.68 });
}

function announceColor(color) {
  showLiveColor(color);
  playTone([440, 554], 0.12);
  speak(color.name, { delay: 60, rate: 0.7 });
}

function completeCountItem(item, { autoFinish = true } = {}) {
  if (state.phase !== "playing" || item.dataset.counted === "true") return false;
  item.dataset.counted = "true";
  item.classList.add("is-counted");
  state.counted += 1;
  const character = characters[Number(item.dataset.characterIndex)];
  state.countedFigures.push(character || state.roundFigure);
  const badge = item.querySelector(".count-badge");
  if (badge) badge.textContent = state.counted;
  announceCount();
  if (autoFinish && state.counted === state.countTarget) finishRound();
  return true;
}

function makeRoundFigures(amount, pool = characters) {
  if (!pool.includes(state.roundFigure)) {
    state.roundFigure = pool[(state.roundIndex - 1) % pool.length];
  }
  state.roundFigures = Array.from({ length: amount }, () => state.roundFigure);
  return state.roundFigures;
}

function getScatterPositions(amount) {
  return shuffled(scatterSpots).slice(0, amount);
}

function startCountingGame() {
  setInstruction(
    state.countTarget === 1
      ? `Tik op ${state.roundFigure.name}`
      : `Tik op elke ${state.roundFigure.name}`,
  );
  Array.from({ length: state.countTarget }, () => state.roundFigure).forEach((character, index) => {
    const card = createCharacterCard(character, index, true);
    card.addEventListener("click", () => completeCountItem(card));
    characterGrid.append(card);
  });
  speak(state.instructionSpeech, { delay: 350 });
}

function startSearchGame() {
  const distractorAmount = state.countTarget >= 8 ? 2 : 3;
  const distractors = characters
    .filter((character) => character !== state.roundFigure)
    .slice(0, distractorAmount);
  const figures = shuffled([
    ...Array.from({ length: state.countTarget }, () => ({ character: state.roundFigure, target: true })),
    ...distractors.map((character) => ({ character, target: false })),
  ]);

  characterGrid.dataset.count = String(figures.length);
  setInstruction(
    `Zoek ${state.roundFigure.name}`,
    `Zoek ${state.roundFigure.name}. Tik alleen op ${state.roundFigure.name}.`,
  );
  showInstructionFigure(state.roundFigure);

  figures.forEach(({ character, target }, index) => {
    const card = createCharacterCard(character, index, true);
    card.classList.add("search-card");
    card.setAttribute("aria-label", `${character.name} aantikken`);
    card.addEventListener("click", () => {
      if (target) {
        completeCountItem(card);
      } else if (state.phase === "playing") {
        card.classList.remove("is-wrong");
        void card.offsetWidth;
        card.classList.add("is-wrong");
        speak(`Dat is ${character.name}. Zoek ${state.roundFigure.name}.`, { delay: 60 });
      }
    });
    characterGrid.append(card);
  });
  speak(state.instructionSpeech, { delay: 350 });
}

function startGiftGame() {
  state.resultHasGifts = true;
  setInstruction(
    `Sleep elk cadeautje naar ${state.roundFigure.name}`,
    `Pak een cadeautje en sleep het helemaal naar ${state.roundFigure.name}.`,
  );
  const scene = document.createElement("div");
  scene.className = "gift-drag-scene gesture-scene";
  scene.innerHTML = '<div class="gift-recipients"></div><div class="gift-tray" aria-label="Cadeautjes"></div>';
  const recipientsHolder = scene.querySelector(".gift-recipients");
  const giftTray = scene.querySelector(".gift-tray");
  const recipients = [];

  makeRoundFigures(state.countTarget).forEach((character, index) => {
    const recipient = createCharacterCard(character, index, false);
    recipient.classList.add("gift-recipient");
    recipient.removeAttribute("aria-hidden");
    recipient.setAttribute("aria-label", `${character.name} wacht op een cadeautje`);
    recipientsHolder.append(recipient);
    recipients.push(recipient);

    const gift = document.createElement("button");
    gift.type = "button";
    gift.className = "drag-gift";
    gift.setAttribute("aria-label", `Sleep cadeautje ${index + 1} naar ${character.name}`);
    gift.textContent = "🎁";
    giftTray.append(gift);
    makeDraggable(gift, ({ clientX, clientY }) => {
      const target = recipients.find((item) =>
        item.dataset.counted !== "true" && pointInside(item.getBoundingClientRect(), clientX, clientY, 8)
      );
      if (!target) return false;
      const deliveredGift = document.createElement("span");
      deliveredGift.className = "gift-on-recipient";
      deliveredGift.textContent = "🎁";
      target.append(deliveredGift);
      target.classList.add("has-gift");
      gift.remove();
      completeCountItem(target);
      return true;
    });
  });
  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function startFlashlightGame() {
  const scene = document.createElement("div");
  scene.className = "flashlight-scene gesture-scene";
  scene.innerHTML = `
    <div class="flashlight-halo" aria-hidden="true"></div>
    <div class="gargamel-collector" aria-hidden="true">
      <img src="${characters[5].src}" alt="" />
      <span class="collection-bag"><span class="bag-number">0</span></span>
    </div>
  `;
  const halo = scene.querySelector(".flashlight-halo");
  const bag = scene.querySelector(".collection-bag");
  const bagNumber = scene.querySelector(".bag-number");
  const figures = [];
  const safeSmurfs = characters.slice(0, 4);
  const roundFigures = makeRoundFigures(state.countTarget, safeSmurfs);
  setInstruction(
    `Zoek ${state.roundFigure.name} · blijf 2 tellen schijnen`,
    `Zoek ${state.roundFigure.name}. Houd elk figuurtje twee seconden in het licht.`,
  );
  const positions = getScatterPositions(state.countTarget);

  roundFigures.forEach((character, index) => {
    const figure = createCountFigure("flash-figure", character);
    figure.dataset.lightMs = "0";
    figure.style.left = `${positions[index].x}%`;
    figure.style.top = `${positions[index].y}%`;
    const meter = document.createElement("span");
    meter.className = "light-timer";
    meter.setAttribute("aria-hidden", "true");
    figure.append(meter);
    scene.append(figure);
    figures.push(figure);
  });

  let activePointerId = null;
  let pointerPosition = null;
  let lastFrame = 0;
  let lightFrame = 0;

  const moveLight = (clientX, clientY) => {
    const sceneRect = scene.getBoundingClientRect();
    halo.style.left = `${clientX - sceneRect.left}px`;
    halo.style.top = `${clientY - sceneRect.top}px`;
    pointerPosition = { x: clientX, y: clientY };
  };

  const collectFigure = (figure) => {
    const rect = figure.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const bagRect = bag.getBoundingClientRect();
    figure.style.setProperty("--bag-x", `${bagRect.left + bagRect.width / 2 - centerX}px`);
    figure.style.setProperty("--bag-y", `${bagRect.top + bagRect.height / 2 - centerY}px`);
    figure.classList.remove("is-lit");
    figure.classList.add("is-found");
    if (completeCountItem(figure)) {
      window.setTimeout(() => {
        bagNumber.textContent = String(state.countedFigures.length);
        bag.classList.remove("bag-pop");
        void bag.offsetWidth;
        bag.classList.add("bag-pop");
      }, 420);
    }
  };

  const updateLight = (now) => {
    if (activePointerId === null || !pointerPosition || state.phase !== "playing") return;
    const elapsed = Math.min(50, Math.max(0, now - lastFrame));
    lastFrame = now;
    figures.forEach((figure) => {
      if (figure.dataset.counted === "true") return;
      const rect = figure.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const inLight = Math.hypot(pointerPosition.x - centerX, pointerPosition.y - centerY) < 78;
      if (inLight) {
        const lightMs = Math.min(2000, Number(figure.dataset.lightMs) + elapsed);
        figure.dataset.lightMs = String(lightMs);
        figure.style.setProperty("--light-progress", String(lightMs / 2000));
        figure.style.setProperty("--light-local-x", `${pointerPosition.x - rect.left}px`);
        figure.style.setProperty("--light-local-y", `${pointerPosition.y - rect.top}px`);
        figure.classList.add("is-lit");
        if (lightMs >= 2000) collectFigure(figure);
      } else if (Number(figure.dataset.lightMs) > 0) {
        figure.dataset.lightMs = "0";
        figure.style.setProperty("--light-progress", "0");
        figure.classList.remove("is-lit");
      }
    });
    lightFrame = window.requestAnimationFrame(updateLight);
  };

  const stopLight = (event) => {
    if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    activePointerId = null;
    pointerPosition = null;
    window.cancelAnimationFrame(lightFrame);
    scene.classList.remove("is-shining");
    figures.forEach((figure) => {
      if (figure.dataset.counted === "true") return;
      figure.dataset.lightMs = "0";
      figure.style.setProperty("--light-progress", "0");
      figure.classList.remove("is-lit");
    });
  };

  scene.addEventListener("pointerdown", (event) => {
    if (state.phase !== "playing") return;
    event.preventDefault();
    activePointerId = event.pointerId;
    scene.setPointerCapture(event.pointerId);
    scene.classList.add("is-shining");
    moveLight(event.clientX, event.clientY);
    lastFrame = performance.now();
    window.cancelAnimationFrame(lightFrame);
    lightFrame = window.requestAnimationFrame(updateLight);
  });
  scene.addEventListener("pointermove", (event) => {
    if (activePointerId !== event.pointerId || !scene.hasPointerCapture(event.pointerId)) return;
    moveLight(event.clientX, event.clientY);
  });
  scene.addEventListener("pointerup", stopLight);
  scene.addEventListener("pointercancel", stopLight);
  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function startBrushGame() {
  setInstruction(
    "Maak het vuile raam helemaal schoon",
    `Veeg het stof van het raam. Maak elke ${state.roundFigure.name} helemaal stofvrij.`,
  );
  const scene = document.createElement("div");
  scene.className = "brush-scene gesture-scene";
  const figures = [];
  const positions = getScatterPositions(state.countTarget);

  makeRoundFigures(state.countTarget).forEach((character, index) => {
    const figure = createCountFigure("brush-figure", character);
    figure.style.left = `${positions[index].x}%`;
    figure.style.top = `${positions[index].y}%`;
    scene.append(figure);
    figures.push(figure);
  });

  const dustCanvas = document.createElement("canvas");
  dustCanvas.className = "dust-canvas";
  dustCanvas.setAttribute("aria-label", "Vuil raam om schoon te vegen");
  scene.append(dustCanvas);
  characterGrid.append(scene);

  let dustContext;
  let sampleSets = [];
  const brushRadius = 21;

  const initializeDirtyWindow = () => {
    const sceneRect = scene.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    dustCanvas.width = Math.max(1, Math.round(sceneRect.width * ratio));
    dustCanvas.height = Math.max(1, Math.round(sceneRect.height * ratio));
    dustContext = dustCanvas.getContext("2d");
    dustContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    const grime = dustContext.createLinearGradient(0, 0, sceneRect.width, sceneRect.height);
    grime.addColorStop(0, "rgba(126, 116, 91, 0.94)");
    grime.addColorStop(0.5, "rgba(174, 160, 123, 0.93)");
    grime.addColorStop(1, "rgba(104, 101, 83, 0.95)");
    dustContext.fillStyle = grime;
    dustContext.fillRect(0, 0, sceneRect.width, sceneRect.height);
    dustContext.fillStyle = "rgba(74, 68, 54, 0.2)";
    for (let index = 0; index < 85; index += 1) {
      const x = (index * 73) % Math.max(1, sceneRect.width);
      const y = (index * 137) % Math.max(1, sceneRect.height);
      const radius = 2 + (index % 7);
      dustContext.beginPath();
      dustContext.arc(x, y, radius, 0, Math.PI * 2);
      dustContext.fill();
    }
    sampleSets = figures.map((figure) => {
      const rect = figure.getBoundingClientRect();
      const samples = [];
      for (let row = 0; row < 7; row += 1) {
        for (let column = 0; column < 5; column += 1) {
          samples.push({
            x: rect.left - sceneRect.left + rect.width * (0.08 + column * 0.21),
            y: rect.top - sceneRect.top + rect.height * (0.05 + row * 0.15),
            clean: false,
          });
        }
      }
      return { figure, samples };
    });
  };

  const distanceToSegment = (point, start, end) => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;
    if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
    const amount = Math.max(0, Math.min(1, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared));
    return Math.hypot(point.x - (start.x + amount * deltaX), point.y - (start.y + amount * deltaY));
  };

  const scratchSegment = (start, end) => {
    if (!dustContext) return;
    dustContext.save();
    dustContext.globalCompositeOperation = "destination-out";
    dustContext.lineCap = "round";
    dustContext.lineJoin = "round";
    dustContext.lineWidth = brushRadius * 2;
    dustContext.beginPath();
    dustContext.moveTo(start.x, start.y);
    dustContext.lineTo(end.x, end.y);
    dustContext.stroke();
    dustContext.restore();

    sampleSets.forEach(({ figure, samples }) => {
      if (figure.dataset.counted === "true") return;
      samples.forEach((sample) => {
        if (!sample.clean && distanceToSegment(sample, start, end) <= brushRadius) sample.clean = true;
      });
      const cleaned = samples.filter((sample) => sample.clean).length;
      figure.style.setProperty("--clean-progress", String(cleaned / samples.length));
      if (cleaned === samples.length) {
        figure.classList.add("is-clean");
        completeCountItem(figure);
      }
    });
  };

  let lastScrubPoint = null;
  const getScenePoint = (event) => {
    const rect = scene.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  scene.addEventListener("pointerdown", (event) => {
    if (state.phase !== "playing") return;
    event.preventDefault();
    scene.setPointerCapture(event.pointerId);
    lastScrubPoint = getScenePoint(event);
    scratchSegment(lastScrubPoint, lastScrubPoint);
  });
  scene.addEventListener("pointermove", (event) => {
    if (!scene.hasPointerCapture(event.pointerId)) return;
    const point = getScenePoint(event);
    scratchSegment(lastScrubPoint || point, point);
    lastScrubPoint = point;
  });
  const finishScrub = (event) => {
    if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    lastScrubPoint = null;
  };
  scene.addEventListener("pointerup", finishScrub);
  scene.addEventListener("pointercancel", finishScrub);
  window.requestAnimationFrame(initializeDirtyWindow);
  speak(state.instructionSpeech, { delay: 350 });
}

function pointInside(rect, clientX, clientY, padding = 24) {
  return (
    clientX >= rect.left - padding && clientX <= rect.right + padding &&
    clientY >= rect.top - padding && clientY <= rect.bottom + padding
  );
}

function makeDraggable(element, onDrop) {
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  element.addEventListener("pointerdown", (event) => {
    if (state.phase !== "playing" || element.dataset.dragged === "true") return;
    event.preventDefault();
    ensureAudio();
    startX = event.clientX;
    startY = event.clientY;
    lastX = event.clientX;
    lastY = event.clientY;
    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");
    element.style.zIndex = "20";
  });

  element.addEventListener("pointermove", (event) => {
    if (!element.hasPointerCapture(event.pointerId)) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    lastX = event.clientX;
    lastY = event.clientY;
    element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.08)`;
  });

  const finishDrag = (event) => {
    if (!element.hasPointerCapture(event.pointerId)) return;
    element.releasePointerCapture(event.pointerId);
    element.classList.remove("is-dragging");
    element.style.zIndex = "";
    const accepted = onDrop({ clientX: lastX, clientY: lastY, element });
    if (accepted) {
      element.dataset.dragged = "true";
      element.style.transform = "";
    } else {
      element.classList.add("is-returning");
      element.style.transform = "";
      window.setTimeout(() => element.classList.remove("is-returning"), 280);
    }
  };

  element.addEventListener("pointerup", finishDrag);
  element.addEventListener("pointercancel", finishDrag);
}

function startTrainGame() {
  setInstruction("Sleep iedereen in de trein", "Sleep elk figuurtje naar de trein.");
  const scene = document.createElement("div");
  scene.className = "train-scene gesture-scene";
  scene.innerHTML = `
    <div class="train-drop-zone" aria-label="Trein">
      <span class="train-engine" aria-hidden="true">🚂</span>
      <div class="wagon-grid"></div>
    </div>
    <div class="train-platform" aria-label="Wachtende Smurfen"></div>
  `;
  const dropZone = scene.querySelector(".train-drop-zone");
  const wagonGrid = scene.querySelector(".wagon-grid");
  const platform = scene.querySelector(".train-platform");
  const wagons = [];

  makeRoundFigures(state.countTarget).forEach((character, index) => {
    const wagon = document.createElement("div");
    wagon.className = "train-wagon";
    wagon.innerHTML = '<span class="wagon-window"></span><span class="count-badge" aria-hidden="true"></span>';
    wagonGrid.append(wagon);
    wagons.push(wagon);

    const token = document.createElement("button");
    token.type = "button";
    token.className = "drag-figure train-token";
    token.setAttribute("aria-label", `Sleep ${character.name} naar de trein`);
    token.innerHTML = `<img src="${character.src}" alt="" draggable="false" />`;
    platform.append(token);
    const placeToken = () => {
      if (token.dataset.dragged === "true" || state.phase !== "playing") return false;
      const wagonTarget = wagons.find((wagonItem) => wagonItem.dataset.counted !== "true");
      if (!wagonTarget) return false;
      token.dataset.dragged = "true";
      wagonTarget.dataset.characterIndex = String(characters.indexOf(character));
      wagonTarget.querySelector(".wagon-window").innerHTML = `<img src="${character.src}" alt="" />`;
      token.remove();
      completeCountItem(wagonTarget);
      if (state.counted === state.countTarget) scene.classList.add("train-is-leaving");
      return true;
    };
    makeDraggable(token, ({ clientX, clientY }) => {
      if (!pointInside(dropZone.getBoundingClientRect(), clientX, clientY, 40)) return false;
      return placeToken();
    });
    token.addEventListener("click", placeToken);
  });

  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function openDoor(door, deltaX, deltaY) {
  if (door.dataset.counted === "true" || state.phase !== "playing") return;
  const distance = Math.max(1, Math.hypot(deltaX, deltaY));
  door.style.setProperty("--door-open-x", `${(deltaX / distance) * 145}%`);
  door.style.setProperty("--door-open-y", `${(deltaY / distance) * 145}%`);
  door.classList.add("is-open");
  door.querySelector(".door-panel").style.transform = "";
  completeCountItem(door);
}

function startDoorsGame() {
  setInstruction("Veeg de hele deur open", "Maak een lange veeg over elke deur. De richting maakt niet uit.");
  const scene = document.createElement("div");
  scene.className = "door-scene gesture-scene";

  makeRoundFigures(state.countTarget).forEach((character, index) => {
    const door = createCountFigure("peek-door", character);
    door.setAttribute("aria-label", `Deur ${index + 1} openvegen`);
    const panel = document.createElement("span");
    panel.className = "door-panel";
    panel.innerHTML = '<span class="door-window">★</span><span class="door-knob"></span><span class="door-arrow">↔</span>';
    door.append(panel);
    scene.append(door);

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    door.addEventListener("pointerdown", (event) => {
      if (state.phase !== "playing") return;
      event.preventDefault();
      startX = event.clientX;
      startY = event.clientY;
      currentX = 0;
      currentY = 0;
      door.setPointerCapture(event.pointerId);
    });
    door.addEventListener("pointermove", (event) => {
      if (!door.hasPointerCapture(event.pointerId)) return;
      currentX = event.clientX - startX;
      currentY = event.clientY - startY;
      panel.style.transform = `translate(${currentX * 0.65}px, ${currentY * 0.65}px)`;
    });
    door.addEventListener("pointerup", (event) => {
      if (door.hasPointerCapture(event.pointerId)) door.releasePointerCapture(event.pointerId);
      const requiredDistance = Math.max(80, Math.min(150, Math.min(door.clientWidth, door.clientHeight) * 0.85));
      if (Math.hypot(currentX, currentY) >= requiredDistance) openDoor(door, currentX, currentY);
      else panel.style.transform = "";
    });
    door.addEventListener("pointercancel", (event) => {
      if (door.hasPointerCapture(event.pointerId)) door.releasePointerCapture(event.pointerId);
      if (door.dataset.counted !== "true") panel.style.transform = "";
    });
  });

  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function makeZigzagPoints(amount) {
  if (amount === 1) return [{ x: 50, y: 50 }];
  return Array.from({ length: amount }, (_, index) => ({
    x: index % 2 === 0 ? 23 : 77,
    y: 10 + (index * 80) / (amount - 1),
  }));
}

function makeTrailPoints(amount) {
  if (amount <= 7) return makeZigzagPoints(amount);
  const trail = [
    { x: 14, y: 12 }, { x: 50, y: 12 }, { x: 84, y: 12 },
    { x: 84, y: 37 }, { x: 50, y: 37 }, { x: 14, y: 37 },
    { x: 14, y: 63 }, { x: 50, y: 63 }, { x: 84, y: 63 },
    { x: 84, y: 88 }, { x: 50, y: 88 }, { x: 14, y: 88 },
  ];
  return trail.slice(0, amount);
}

function startPathGame() {
  setInstruction(
    "Volg elke stap naar de paddenstoel",
    `Sleep ${state.roundFigure.name} stap voor stap naar het paddenstoelenhuis.`,
  );
  const scene = document.createElement("div");
  scene.className = "path-scene gesture-scene";
  const points = makeTrailPoints(state.countTarget + 1);
  const startPoint = points[0];
  const destination = points[points.length - 1];
  const stepPoints = points.slice(1);
  const intermediatePoints = stepPoints.slice(0, -1);
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  scene.innerHTML = `
    <svg class="path-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${pointString}"></polyline>
    </svg>
    <span class="path-start" style="left:${startPoint.x}%;top:${startPoint.y}%" aria-hidden="true">START</span>
    <div class="mushroom-house" style="left:${destination.x}%;top:${destination.y}%" aria-label="Paddenstoelenhuis van Grote Smurf">
      <span class="mushroom-cap"><i></i><i></i><i></i></span>
      <span class="mushroom-stem"><i></i></span>
      <span class="count-badge path-step-number" aria-hidden="true">${state.countTarget}</span>
    </div>
  `;
  const mushroom = scene.querySelector(".mushroom-house");
  mushroom.dataset.characterIndex = String(characters.indexOf(state.roundFigure));
  mushroom.classList.add("path-step", "path-destination-step");
  const steps = intermediatePoints.map((point, index) => {
    const step = document.createElement("span");
    step.className = "path-step";
    step.dataset.characterIndex = String(characters.indexOf(state.roundFigure));
    step.style.left = `${point.x}%`;
    step.style.top = `${point.y}%`;
    step.innerHTML = `<span class="count-badge path-step-number" aria-hidden="true">${index + 1}</span>`;
    scene.append(step);
    return step;
  });
  steps.push(mushroom);
  const leader = document.createElement("button");
  leader.type = "button";
  leader.className = "path-leader";
  leader.setAttribute("aria-label", `Sleep ${state.roundFigure.name} over het pad`);
  leader.innerHTML = `<img src="${state.roundFigure.src}" alt="" draggable="false" />`;
  leader.style.left = `${startPoint.x}%`;
  leader.style.top = `${startPoint.y}%`;
  scene.append(leader);
  let nextStepIndex = 0;

  const moveLeader = (clientX, clientY) => {
    const rect = scene.getBoundingClientRect();
    const x = Math.max(8, Math.min(rect.width - 8, clientX - rect.left));
    const y = Math.max(8, Math.min(rect.height - 8, clientY - rect.top));
    leader.style.left = `${x}px`;
    leader.style.top = `${y}px`;
    const nextStep = steps[nextStepIndex];
    if (!nextStep || state.phase !== "playing") return;
    const stepRect = nextStep.getBoundingClientRect();
    const centerX = stepRect.left + stepRect.width / 2;
    const centerY = stepRect.top + stepRect.height / 2;
    const reach = nextStep === mushroom ? 42 : Math.max(44, stepRect.width * 0.8);
    if (Math.hypot(clientX - centerX, clientY - centerY) < reach) {
      nextStep.classList.add(nextStep === mushroom ? "is-home" : "is-visited");
      completeCountItem(nextStep);
      nextStepIndex += 1;
    }
  };

  leader.addEventListener("pointerdown", (event) => {
    if (state.phase !== "playing") return;
    leader.setPointerCapture(event.pointerId);
    leader.classList.add("is-dragging");
    moveLeader(event.clientX, event.clientY);
  });
  leader.addEventListener("pointermove", (event) => {
    if (!leader.hasPointerCapture(event.pointerId)) return;
    moveLeader(event.clientX, event.clientY);
  });
  leader.addEventListener("pointerup", (event) => {
    if (leader.hasPointerCapture(event.pointerId)) leader.releasePointerCapture(event.pointerId);
    leader.classList.remove("is-dragging");
  });
  leader.addEventListener("pointercancel", (event) => {
    if (leader.hasPointerCapture(event.pointerId)) leader.releasePointerCapture(event.pointerId);
    leader.classList.remove("is-dragging");
  });
  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function startLiftGame() {
  setInstruction("Schuif de lift omhoog", "Pak de grote knop en schuif de Smurfenlift helemaal omhoog.");
  const scene = document.createElement("div");
  scene.className = "lift-scene gesture-scene";
  scene.innerHTML = `
    <div class="lift-building">
      <div class="lift-cable"></div>
      <div class="lift-cabin"><div class="lift-passengers"></div></div>
      <div class="lift-floor-dots" aria-hidden="true"></div>
    </div>
    <div class="lift-control" aria-label="Liftknop">
      <span class="lift-track"></span>
      <button type="button" class="lift-handle" aria-label="Schuif omhoog">↕</button>
    </div>
  `;
  const building = scene.querySelector(".lift-building");
  const cabin = scene.querySelector(".lift-cabin");
  const passengers = scene.querySelector(".lift-passengers");
  const floorDots = scene.querySelector(".lift-floor-dots");
  const control = scene.querySelector(".lift-control");
  const handle = scene.querySelector(".lift-handle");

  for (let index = 0; index < state.countTarget; index += 1) {
    const dot = document.createElement("span");
    floorDots.append(dot);
  }

  const updateLift = (clientY) => {
    const rect = control.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    handle.style.bottom = `calc(${progress * 100}% - 27px)`;
    const travel = Math.max(0, building.clientHeight - cabin.offsetHeight - 24);
    cabin.style.transform = `translateY(${-progress * travel}px)`;
    const reached = Math.min(state.countTarget, Math.floor(progress * state.countTarget + 0.15));
    while (state.counted < reached && state.phase === "playing") {
      const passenger = createCountFigure("lift-passenger");
      passengers.append(passenger);
      floorDots.children[state.counted]?.classList.add("is-reached");
      completeCountItem(passenger);
    }
  };

  const startSlide = (event) => {
    if (state.phase !== "playing") return;
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("is-dragging");
    updateLift(event.clientY);
  };
  handle.addEventListener("pointerdown", startSlide);
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) updateLift(event.clientY);
  });
  handle.addEventListener("pointerup", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    handle.classList.remove("is-dragging");
  });
  handle.addEventListener("click", () => {
    if (state.phase !== "playing") return;
    const rect = control.getBoundingClientRect();
    const nextProgress = Math.min(1, (state.counted + 1) / state.countTarget);
    updateLift(rect.bottom - rect.height * nextProgress);
  });
  control.addEventListener("pointerdown", (event) => {
    if (event.target === handle || state.phase !== "playing") return;
    updateLift(event.clientY);
  });

  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function startPuzzleGame() {
  setInstruction("Sleep het figuurtje naar zijn schaduw", "Sleep het figuurtje helemaal naar dezelfde lichte schaduw.");
  const scene = document.createElement("div");
  scene.className = "puzzle-scene gesture-scene";
  scene.innerHTML = '<div class="puzzle-slots"></div><div class="puzzle-tray"></div>';
  const slotsHolder = scene.querySelector(".puzzle-slots");
  const tray = scene.querySelector(".puzzle-tray");
  const slots = [];

  makeRoundFigures(state.countTarget).forEach((character) => {
    const slot = createCountFigure("puzzle-slot", character);
    slot.querySelector("img").classList.add("puzzle-shadow");
    slotsHolder.append(slot);
    slots.push(slot);
  });

  const spawnPiece = () => {
    if (state.phase !== "playing") return;
    const target = slots.find((slot) => slot.dataset.counted !== "true");
    if (!target) return;
    target.classList.add("is-current");
    const piece = document.createElement("button");
    piece.type = "button";
    piece.className = "drag-figure puzzle-piece";
    const targetCharacter = characters[Number(target.dataset.characterIndex)] || countingCharacter;
    piece.setAttribute("aria-label", `Sleep ${targetCharacter.name} naar dezelfde schaduw`);
    piece.innerHTML = `<img src="${targetCharacter.src}" alt="" draggable="false" />`;
    tray.replaceChildren(piece);
    const placePiece = () => {
      if (piece.dataset.dragged === "true" || state.phase !== "playing") return false;
      piece.dataset.dragged = "true";
      target.classList.remove("is-current");
      target.querySelector("img").classList.remove("puzzle-shadow");
      piece.remove();
      completeCountItem(target);
      if (state.phase === "playing") window.setTimeout(spawnPiece, 220);
      return true;
    };
    makeDraggable(piece, ({ clientX, clientY }) => {
      if (!pointInside(target.getBoundingClientRect(), clientX, clientY, 46)) return false;
      return placePiece();
    });
  };

  characterGrid.append(scene);
  spawnPiece();
  speak(state.instructionSpeech, { delay: 350 });
}

function startColorPathGame() {
  const color = state.colorTarget;
  setInstruction(`Volg het ${color.adjective} pad`, `Sleep Grote Smurf door alle ${color.adjective} rondjes.`);
  showInstructionColor(color);
  const scene = document.createElement("div");
  scene.className = "color-path-scene gesture-scene";
  scene.style.setProperty("--target-color", color.hex);
  scene.style.setProperty("--target-soft", color.soft);
  const points = makeZigzagPoints(4);
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  scene.innerHTML = `
    <svg class="color-path-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${pointString}"></polyline>
    </svg>
  `;
  const stones = points.map((point) => {
    const stone = document.createElement("span");
    stone.className = "color-stone";
    stone.style.left = `${point.x}%`;
    stone.style.top = `${point.y}%`;
    scene.append(stone);
    return stone;
  });
  const leader = document.createElement("button");
  leader.type = "button";
  leader.className = "path-leader color-leader";
  leader.setAttribute("aria-label", "Sleep Grote Smurf over het kleurenpad");
  leader.innerHTML = `<img src="${countingCharacter.src}" alt="" draggable="false" />`;
  leader.style.left = `${points[0].x}%`;
  leader.style.top = `${points[0].y}%`;
  scene.append(leader);

  const moveLeader = (clientX, clientY) => {
    const rect = scene.getBoundingClientRect();
    leader.style.left = `${Math.max(8, Math.min(rect.width - 8, clientX - rect.left))}px`;
    leader.style.top = `${Math.max(8, Math.min(rect.height - 8, clientY - rect.top))}px`;
    stones.forEach((stone) => {
      if (stone.dataset.visited === "true") return;
      const stoneRect = stone.getBoundingClientRect();
      const centerX = stoneRect.left + stoneRect.width / 2;
      const centerY = stoneRect.top + stoneRect.height / 2;
      if (Math.hypot(clientX - centerX, clientY - centerY) < 72) {
        stone.dataset.visited = "true";
        stone.classList.add("is-visited");
        announceColor(color);
        if (stones.every((item) => item.dataset.visited === "true")) finishColorRound();
      }
    });
  };

  leader.addEventListener("pointerdown", (event) => {
    if (state.phase !== "playing") return;
    leader.setPointerCapture(event.pointerId);
    leader.classList.add("is-dragging");
    moveLeader(event.clientX, event.clientY);
  });
  leader.addEventListener("pointermove", (event) => {
    if (leader.hasPointerCapture(event.pointerId)) moveLeader(event.clientX, event.clientY);
  });
  leader.addEventListener("pointerup", (event) => {
    if (leader.hasPointerCapture(event.pointerId)) leader.releasePointerCapture(event.pointerId);
    leader.classList.remove("is-dragging");
  });
  leader.addEventListener("click", () => {
    const nextStone = stones.find((stone) => stone.dataset.visited !== "true");
    if (!nextStone || state.phase !== "playing") return;
    nextStone.dataset.visited = "true";
    nextStone.classList.add("is-visited");
    announceColor(color);
    if (stones.every((item) => item.dataset.visited === "true")) finishColorRound();
  });

  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function createColorObject(task, color, interactive = true) {
  const object = document.createElement(interactive ? "button" : "span");
  if (interactive) object.type = "button";
  object.className = `color-object color-object--${task.shape}`;
  object.style.setProperty("--object-color", color.hex);
  object.setAttribute("aria-label", `${task.neutral ? color.name : color.adjective} ${task.name}`);
  object.innerHTML = '<span class="object-shape" aria-hidden="true"><i></i><b></b></span>';
  return object;
}

function startColorMatchGame() {
  const targetColor = state.colorTarget;
  const task = colorTasks[(state.colorIndex - 1) % colorTasks.length];
  const colorWord = task.neutral ? targetColor.name : targetColor.adjective;
  state.colorTask = task;
  state.roundFigure = task.character;
  setInstruction(
    `Geef ${task.article} ${colorWord} ${task.name} aan ${task.character.name}`,
    `Geef ${task.article} ${colorWord} ${task.name} aan ${task.character.name}.`,
  );
  showInstructionColor(targetColor);
  const scene = document.createElement("div");
  scene.className = "color-match-scene gesture-scene";
  scene.innerHTML = `
    <div class="paint-target" aria-label="Geef het voorwerp aan ${task.character.name}">
      <span class="paint-target-ring" aria-hidden="true">+</span>
      <img src="${task.character.src}" alt="" draggable="false" />
    </div>
    <div class="paint-options" aria-label="Gekleurde ${task.name}"></div>
  `;
  const target = scene.querySelector(".paint-target");
  const targetRing = scene.querySelector(".paint-target-ring");
  const options = scene.querySelector(".paint-options");
  targetRing.style.borderColor = targetColor.hex;
  target.style.setProperty("--target-soft", targetColor.soft);

  const palette = state.maxCount === 5 ? learningColors.slice(0, 4) : learningColors;
  const distractors = shuffled(palette.filter((color) => color !== targetColor)).slice(0, state.maxCount === 5 ? 2 : 3);
  shuffled([targetColor, ...distractors]).forEach((color) => {
    const object = createColorObject(task, color, true);
    options.append(object);
    const tryColor = () => {
      if (object.dataset.dragged === "true" || state.phase !== "playing") return false;
      if (color !== targetColor) {
        playTone([260, 220], 0.12);
        speak(`Dat is ${color.name}. Zoek ${colorWord} ${task.name}.`, { delay: 50 });
        target.classList.remove("needs-target");
        void target.offsetWidth;
        target.classList.add("needs-target");
        return false;
      }
      object.dataset.dragged = "true";
      object.remove();
      const received = createColorObject(task, targetColor, false);
      received.classList.add("received-object");
      target.append(received);
      target.classList.add("is-painted");
      announceColor(targetColor);
      finishColorRound();
      return true;
    };
    makeDraggable(object, ({ clientX, clientY }) => {
      if (!pointInside(target.getBoundingClientRect(), clientX, clientY, 34)) return false;
      return tryColor();
    });
  });

  characterGrid.append(scene);
  speak(state.instructionSpeech, { delay: 350 });
}

function finishRound() {
  if (state.phase !== "playing") return;
  state.phase = "finishing";
  window.clearTimeout(finishTimer);
  finishTimer = window.setTimeout(showCountResult, 850);
}

function finishColorRound() {
  if (state.phase !== "playing") return;
  state.phase = "finishing";
  window.clearTimeout(finishTimer);
  finishTimer = window.setTimeout(showColorResult, 800);
}

function showCountResult() {
  state.phase = "result";
  state.successes += 1;
  celebrationScreen.dataset.result = "count";
  celebrationKicker.textContent = "Dat zijn er";
  celebrationNumber.hidden = false;
  celebrationColor.hidden = true;
  celebrationNumber.textContent = state.countTarget;
  celebrationWord.textContent = numberWords[state.countTarget];
  celebrationTitle.textContent = "Goed geteld!";

  resultDots.hidden = false;
  resultDots.innerHTML = "";
  for (let index = 0; index < state.countTarget; index += 1) {
    const dot = document.createElement("span");
    if (index === 5) dot.classList.add("new-row");
    resultDots.append(dot);
  }

  celebrationFriends.dataset.count = String(state.countTarget);
  celebrationFriends.classList.toggle("has-gifts", state.resultHasGifts);
  const resultFigures = state.countedFigures.length === state.countTarget
    ? state.countedFigures
    : Array.from({ length: state.countTarget }, () => state.roundFigure);
  celebrationFriends.innerHTML = resultFigures.map((character) => `
    <span class="result-figure">
      <img src="${character.src}" alt="" />
      ${state.resultHasGifts ? '<span class="result-gift">🎁</span>' : ""}
    </span>
  `).join("");

  showScreen(celebrationScreen);
  createConfetti();
  playTone([523, 659, 784], 0.14);
  const resultSentence = state.resultHasGifts
    ? `Iedereen heeft een cadeautje. Dat zijn er ${numberWords[state.countTarget]}.`
    : `Dat zijn er ${numberWords[state.countTarget]}. Goed geteld!`;
  speak(resultSentence, { delay: 120, rate: 0.75 });
}

function showColorResult() {
  const color = state.colorTarget;
  state.phase = "result";
  state.successes += 1;
  celebrationScreen.dataset.result = "color";
  celebrationKicker.textContent = "Deze kleur is";
  celebrationNumber.hidden = true;
  celebrationColor.hidden = false;
  celebrationColor.style.background = color.hex;
  celebrationColor.style.boxShadow = `0 10px 0 color-mix(in srgb, ${color.hex} 76%, #554000), 0 18px 30px rgba(21, 54, 90, 0.2)`;
  celebrationWord.textContent = color.name;
  celebrationTitle.textContent = "Mooi geleerd!";
  resultDots.hidden = true;
  celebrationFriends.dataset.count = "1";
  celebrationFriends.classList.remove("has-gifts");
  celebrationFriends.style.setProperty("--result-color", color.soft);
  const resultObject = createColorObject(state.colorTask, color, false);
  resultObject.classList.add("result-color-object");
  celebrationFriends.innerHTML = `<span class="result-figure color-result-figure"><img src="${state.roundFigure.src}" alt="" /></span>`;
  celebrationFriends.querySelector(".color-result-figure").append(resultObject);

  showScreen(celebrationScreen);
  createConfetti();
  playTone([523, 659, 784], 0.14);
  speak(`De ${state.colorTask.name} is ${color.name}. Mooi gedaan!`, { delay: 120, rate: 0.75 });
}

function createConfetti() {
  const holder = document.querySelector("#confetti");
  const colors = ["#ff6b9c", "#ffd84f", "#168eea", "#57bd55", "#ffffff"];
  holder.innerHTML = "";
  for (let index = 0; index < 24; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--fall-time", `${2.2 + Math.random() * 1.8}s`);
    piece.style.setProperty("--fall-delay", `${-Math.random() * 3}s`);
    piece.style.setProperty("--drift", `${-50 + Math.random() * 100}px`);
    holder.append(piece);
  }
}

function repeatInstruction() {
  if (state.phase !== "playing") return;
  speak(state.instructionSpeech, { rate: 0.76 });
}

function updateSoundButton() {
  soundButton.textContent = state.soundOn ? "🔊" : "🔇";
  soundButton.setAttribute("aria-label", state.soundOn ? "Geluid uitzetten" : "Geluid aanzetten");
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  localStorage.setItem("eden-sound", state.soundOn ? "on" : "off");
  if (!state.soundOn) window.speechSynthesis?.cancel();
  updateSoundButton();
  if (state.soundOn) {
    ensureAudio();
    playTone([523, 659], 0.12);
    repeatInstruction();
  }
}

function isRunningAsInstalledApp() {
  return (
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function updateInstallControls() {
  if (isRunningAsInstalledApp()) {
    installButton.disabled = true;
    installButton.querySelector("span:last-child").textContent = "App is geïnstalleerd";
    installStatus.textContent = "Eden telt opent nu zonder browserbalken.";
    return;
  }

  installButton.disabled = false;
  installButton.querySelector("span:last-child").textContent = "Installeer de app";
  installStatus.textContent = deferredInstallPrompt
    ? "Klaar om op dit toestel te installeren."
    : "Open de gepubliceerde pagina in Chrome en kies zo nodig ⋮ → App installeren.";
}

async function installApp() {
  if (!deferredInstallPrompt) {
    installStatus.textContent = "Gebruik in Chrome het menu ⋮ en kies ‘App installeren’ of ‘Toevoegen aan startscherm’.";
    return;
  }

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (choice.outcome === "accepted") {
    installButton.disabled = true;
    installButton.querySelector("span:last-child").textContent = "App wordt geïnstalleerd";
    installStatus.textContent = "Even geduld; het app-icoon verschijnt zo op het toestel.";
  } else {
    installStatus.textContent = "Installatie geannuleerd. Je kunt het later opnieuw proberen via Chrome.";
  }
}

function openParentSettings() {
  const input = parentDialog.querySelector(`input[value="${state.maxCount}"]`);
  if (input) input.checked = true;
  parentDialog.showModal();
}

function saveParentSettings(event) {
  event.preventDefault();
  const selected = parentDialog.querySelector('input[name="maxCount"]:checked');
  state.maxCount = Number(selected?.value) === 10 ? 10 : 5;
  state.roundIndex = 0;
  state.colorIndex = 0;
  localStorage.setItem("eden-max-count", String(state.maxCount));
  updateLevelLabels();
  parentDialog.close();
}

document.querySelector("#startButton").addEventListener("click", () => {
  ensureAudio();
  playTone([392, 523, 659], 0.12);
  showModeSelection();
  speak("Kies een spelletje.", { delay: 200 });
});

document.querySelectorAll(".mode-tab").forEach((button) => {
  button.addEventListener("click", () => showModeCategory(button.dataset.category));
});

document.querySelectorAll(".mode-card").forEach((button) => {
  button.addEventListener("click", () => chooseMode(button.dataset.mode));
});

document.querySelector("#nextButton").addEventListener("click", startRound);
document.querySelector("#otherGameButton").addEventListener("click", showModeSelection);
document.querySelector("#homeButton").addEventListener("click", showModeSelection);
document.querySelector("#modeBackButton").addEventListener("click", () => {
  state.phase = "welcome";
  window.clearTimeout(finishTimer);
  window.speechSynthesis?.cancel();
  showScreen(welcomeScreen);
});
document.querySelector("#repeatButton").addEventListener("click", repeatInstruction);
document.querySelector("#parentButton").addEventListener("click", openParentSettings);
document.querySelector("#saveSettingsButton").addEventListener("click", saveParentSettings);
soundButton.addEventListener("click", toggleSound);
installButton.addEventListener("click", installApp);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallControls();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallControls();
});

updateSoundButton();
updateLevelLabels();
updateInstallControls();
showModeCategory("counting");

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  let serviceWorkerRefreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (serviceWorkerRefreshing) return;
    serviceWorkerRefreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js", {
        updateViaCache: "none",
      });
      const checkForUpdate = () => registration.update().catch(() => {});
      checkForUpdate();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
      window.setInterval(checkForUpdate, 30 * 60 * 1000);
    } catch {
      // De app blijft ook zonder serviceworker speelbaar.
    }
  });
}
