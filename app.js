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

const countingCharacter = characters[0];
const gentleSequences = {
  5: [1, 2, 3, 2, 4, 3, 5, 4, 5],
  10: [6, 7, 8, 6, 9, 7, 10, 8, 9, 10],
};

const savedMaxCount = Number(localStorage.getItem("eden-max-count"));
const initialMaxCount = [5, 10].includes(savedMaxCount) ? savedMaxCount : 5;

const state = {
  maxCount: initialMaxCount,
  soundOn: localStorage.getItem("eden-sound") !== "off",
  mode: "count",
  roundIndex: 0,
  successes: 0,
  countTarget: 1,
  counted: 0,
  phase: "welcome",
  roundFigure: countingCharacter,
  resultHasGifts: false,
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
const liveNumber = document.querySelector("#liveNumber");
const progressDots = document.querySelector("#progressDots");
const soundButton = document.querySelector("#soundButton");
const parentDialog = document.querySelector("#parentDialog");
const installButton = document.querySelector("#installButton");
const installStatus = document.querySelector("#installStatus");

let audioContext;
let speechTimer;
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
  return [...items].sort(() => Math.random() - 0.5);
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

function updateLevelLabels() {
  const easy = state.maxCount === 5;
  document.querySelector(".grown-up-hint").textContent = easy
    ? "Makkelijk: samen tellen tot 5"
    : "Moeilijker: samen tellen tot 10";
  document.querySelector("#modeLevelHint").textContent = easy
    ? "Makkelijk · tellen tot 5"
    : "Moeilijker · tellen tot 10";
}

function showModeSelection() {
  state.phase = "choosing-mode";
  window.speechSynthesis?.cancel();
  showScreen(modeScreen);
}

function chooseMode(mode) {
  state.mode = mode;
  state.roundIndex = 0;
  startRound();
}

function createCharacterCard(character, index, interactive = true) {
  const card = document.createElement(interactive ? "button" : "div");
  if (interactive) card.type = "button";
  card.className = "character-card";
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

function startRound() {
  state.phase = "playing";
  state.counted = 0;
  state.countTarget = getNextTarget();
  showScreen(gameScreen);
  renderProgress();
  liveNumber.classList.remove("is-showing");
  characterGrid.innerHTML = "";
  characterGrid.dataset.count = String(state.countTarget);
  characterGrid.dataset.mode = state.mode;
  countStage.dataset.mode = state.mode;
  instructionCard.classList.remove("has-figure");
  instructionFigure.hidden = true;
  state.resultHasGifts = false;

  if (state.mode === "search") {
    startSearchGame();
  } else if (state.mode === "gift") {
    startGiftGame();
  } else {
    startCountingGame();
  }
}

function startCountingGame() {
  state.roundFigure = countingCharacter;
  instruction.textContent = state.countTarget === 1 ? "Tik op Grote Smurf" : "Tik op elke Grote Smurf";
  Array.from({ length: state.countTarget }, () => countingCharacter).forEach((character, index) => {
    const card = createCharacterCard(character, index, true);
    card.addEventListener("click", () => countCharacter(card));
    characterGrid.append(card);
  });
  speak(instruction.textContent, { delay: 350 });
}

function startSearchGame() {
  state.roundFigure = characters[(state.roundIndex + 1) % characters.length];
  const distractorAmount = state.countTarget >= 8 ? 2 : 3;
  const distractors = characters
    .filter((character) => character !== state.roundFigure)
    .slice(0, distractorAmount);
  const figures = shuffled([
    ...Array.from({ length: state.countTarget }, () => ({ character: state.roundFigure, target: true })),
    ...distractors.map((character) => ({ character, target: false })),
  ]);

  characterGrid.dataset.count = String(figures.length);
  instruction.textContent = `Zoek ${state.roundFigure.name}`;
  instructionFigure.src = state.roundFigure.src;
  instructionFigure.alt = state.roundFigure.name;
  instructionFigure.hidden = false;
  instructionCard.classList.add("has-figure");

  figures.forEach(({ character, target }, index) => {
    const card = createCharacterCard(character, index, true);
    card.classList.add("search-card");
    card.dataset.target = String(target);
    card.dataset.figureName = character.name;
    card.setAttribute("aria-label", `${character.name} aantikken`);
    card.addEventListener("click", () => {
      if (target) countSearchFigure(card);
      else rejectSearchFigure(card, character);
    });
    characterGrid.append(card);
  });

  speak(`Zoek ${state.roundFigure.name}. Tik alleen op ${state.roundFigure.name}.`, { delay: 350 });
}

function startGiftGame() {
  const friendlyCharacters = characters.slice(0, 4);
  state.roundFigure = friendlyCharacters[(state.roundIndex + 1) % friendlyCharacters.length];
  state.resultHasGifts = true;
  instruction.textContent = "Geef iedereen een cadeautje";

  Array.from({ length: state.countTarget }, () => state.roundFigure).forEach((character, index) => {
    const card = createCharacterCard(character, index, true);
    card.classList.add("gift-card");
    const gift = document.createElement("span");
    gift.className = "gift-token";
    gift.setAttribute("aria-hidden", "true");
    card.append(gift);
    card.setAttribute("aria-label", `Geef ${character.name} ${index + 1} een cadeautje`);
    card.addEventListener("click", () => giveGift(card));
    characterGrid.append(card);
  });

  speak("Geef iedereen één cadeautje. Tik op elk figuurtje.", { delay: 350 });
}

function showLiveNumber(number) {
  liveNumber.textContent = number;
  liveNumber.classList.remove("is-showing");
  void liveNumber.offsetWidth;
  liveNumber.classList.add("is-showing");
}

function announceCount() {
  showLiveNumber(state.counted);
  playTone([360 + state.counted * 42], 0.13);
  speak(numberWords[state.counted], { delay: 70, rate: 0.68 });
}

function countCharacter(card) {
  if (state.phase !== "playing" || card.classList.contains("is-counted")) return;
  ensureAudio();
  state.counted += 1;
  card.classList.add("is-counted");
  card.querySelector(".count-badge").textContent = state.counted;
  card.setAttribute(
    "aria-label",
    `${state.roundFigure.name}, geteld als ${numberWords[state.counted]}`,
  );
  announceCount();
  if (state.counted === state.countTarget) finishRound();
}

function countSearchFigure(card) {
  if (state.phase !== "playing" || card.classList.contains("is-counted")) return;
  ensureAudio();
  state.counted += 1;
  card.classList.add("is-counted");
  card.querySelector(".count-badge").textContent = state.counted;
  card.setAttribute(
    "aria-label",
    `${state.roundFigure.name}, geteld als ${numberWords[state.counted]}`,
  );
  announceCount();
  if (state.counted === state.countTarget) finishRound();
}

function rejectSearchFigure(card, character) {
  if (state.phase !== "playing") return;
  card.classList.remove("is-wrong");
  void card.offsetWidth;
  card.classList.add("is-wrong");
  speak(`Dat is ${character.name}. Zoek ${state.roundFigure.name}.`, { delay: 60 });
}

function giveGift(card) {
  if (state.phase !== "playing" || card.classList.contains("has-gift")) return;
  ensureAudio();
  state.counted += 1;
  card.classList.add("is-counted", "has-gift");
  card.querySelector(".gift-token").textContent = "🎁";
  card.querySelector(".count-badge").textContent = state.counted;
  card.setAttribute(
    "aria-label",
    `${state.roundFigure.name} heeft cadeautje ${numberWords[state.counted]}`,
  );
  announceCount();
  if (state.counted === state.countTarget) finishRound();
}

function finishRound() {
  state.phase = "finishing";
  window.setTimeout(showResult, 1000);
}

function showResult() {
  state.phase = "result";
  state.successes += 1;
  document.querySelector("#celebrationNumber").textContent = state.countTarget;
  document.querySelector("#celebrationWord").textContent = numberWords[state.countTarget];

  const dots = document.querySelector("#resultDots");
  dots.innerHTML = "";
  for (let index = 0; index < state.countTarget; index += 1) {
    const dot = document.createElement("span");
    if (index === 5) dot.classList.add("new-row");
    dots.append(dot);
  }

  const friends = document.querySelector("#celebrationFriends");
  friends.dataset.count = String(state.countTarget);
  friends.classList.toggle("has-gifts", state.resultHasGifts);
  friends.innerHTML = Array.from({ length: state.countTarget }, () => `
    <span class="result-figure">
      <img src="${state.roundFigure.src}" alt="" />
      ${state.resultHasGifts ? '<span class="result-gift">🎁</span>' : ""}
    </span>
  `).join("");

  showScreen(celebrationScreen);
  createConfetti();
  playTone([523, 659, 784], 0.14);
  const resultSentence = state.resultHasGifts
    ? `Iedereen heeft een cadeautje. Dat zijn er ${numberWords[state.countTarget]}.`
    : `Dat zijn er ${numberWords[state.countTarget]}. Goed geteld!`;
  speak(resultSentence, {
    delay: 120,
    rate: 0.75,
  });
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
  if (state.mode === "search") {
    speak(`Zoek ${state.roundFigure.name}. Tik alleen op ${state.roundFigure.name}.`, { rate: 0.76 });
  } else if (state.mode === "gift") {
    speak("Geef iedereen één cadeautje. Tik op elk figuurtje.", { rate: 0.76 });
  } else {
    speak(instruction.textContent, { rate: 0.76 });
  }
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

document.querySelectorAll(".mode-card").forEach((button) => {
  button.addEventListener("click", () => chooseMode(button.dataset.mode));
});

document.querySelector("#nextButton").addEventListener("click", startRound);
document.querySelector("#otherGameButton").addEventListener("click", showModeSelection);
document.querySelector("#homeButton").addEventListener("click", showModeSelection);
document.querySelector("#modeBackButton").addEventListener("click", () => {
  state.phase = "welcome";
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

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}
