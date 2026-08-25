const section = document.querySelector(".parallax");
const scene = document.querySelector(".scene");
const world = document.querySelector(".world");
const movingLayers = [...document.querySelectorAll("[data-depth]")];
const birdFlightTemplates = [...document.querySelectorAll("[data-flight-template]")];
// Spawn the birds behind layer 3 and all nearer foreground layers.
const foregroundAnchor = world.querySelector('img[data-depth="3"]');
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const backgroundMusic = document.querySelector("#background-music");
const birdSound = document.querySelector("#bird-sound");
const scrollPrompt = document.querySelector(".scroll-prompt");
let musicStarted = false;
let musicTarget = 0;
let musicFadeFrame;
let promptTimer;

function showScrollPromptAfterPause() {
  scrollPrompt.classList.remove("is-visible");
  clearTimeout(promptTimer);
  promptTimer = setTimeout(() => scrollPrompt.classList.add("is-visible"), 1200);
}

function fadeMusic() {
  const difference = musicTarget - backgroundMusic.volume;
  if (Math.abs(difference) < 0.003) {
    backgroundMusic.volume = musicTarget;
    musicFadeFrame = undefined;
    return;
  }
  backgroundMusic.volume += difference * 0.09;
  musicFadeFrame = requestAnimationFrame(fadeMusic);
}

function setMusicLevel(level) {
  musicTarget = level;
  if (!musicFadeFrame) musicFadeFrame = requestAnimationFrame(fadeMusic);
}

function startBackgroundMusic() {
  if (musicStarted || reduceMotion.matches) return;
  backgroundMusic.volume = 0;
  backgroundMusic.play().then(() => { musicStarted = true; }).catch(() => {});
}

// A tap/click unlocks audio on browsers that block sound during scroll gestures.
window.addEventListener("pointerdown", startBackgroundMusic, { once: true });
window.addEventListener("keydown", startBackgroundMusic, { once: true });

function updateScene() {
  // Keep the portrait illustration comfortably framed in both desktop browsers
  // and tall phone screens, while holding the date below the opening view.
  const scale = Math.max(scene.clientWidth / 1440, scene.clientHeight / 1700);
  world.style.setProperty("--scale", scale);
  if (reduceMotion.matches) return;
  const scrollRange = section.offsetHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / scrollRange));
  // Dark type on the pale opening, gradually becoming cream over the dark landscape.
  const startColor = [74, 45, 39];
  const endColor = [255, 240, 212];
  const promptColor = startColor.map((channel, index) => Math.round(channel + (endColor[index] - channel) * progress));
  scrollPrompt.style.setProperty("--prompt-color", `rgb(${promptColor.join(", ")})`);
  startBackgroundMusic();
  setMusicLevel(progress > 0.015 && progress < 0.88 ? 0.22 : 0);
  // Cross this small scroll threshold to launch the flock once. Returning above
  // it arms the animation again for the next downward pass.
  if (progress >= 0.08 && !window.flockTriggered) {
    birdFlightTemplates.forEach((template) => {
      const flight = template.cloneNode(true);
      flight.classList.remove("bird-flight-template");
      flight.removeAttribute("data-flight-template");
      flight.classList.add("is-flying");
      world.insertBefore(flight, foregroundAnchor);
      flight.addEventListener("animationend", () => flight.remove(), { once: true });
    });
    // Each flock has one bird call; cloned audio lets earlier calls finish naturally.
    const birdCall = birdSound.cloneNode(true);
    birdCall.volume = 0.5;
    birdCall.play().catch(() => {});
    window.flockTriggered = true;
  }
  if (progress < 0.05) window.flockTriggered = false;
  world.style.setProperty("--camera", progress * 1300);
  movingLayers.forEach((item) => {
    const depth = Number(item.dataset.depth);
    item.style.setProperty("--float", `${(12 - depth) * progress * 38}px`);
  });
}
let queued = false;
function requestUpdate() { if (!queued) { queued = true; requestAnimationFrame(() => { updateScene(); queued = false; }); } }
window.addEventListener("scroll", () => { showScrollPromptAfterPause(); requestUpdate(); }, { passive: true });
window.addEventListener("resize", requestUpdate);
updateScene();
showScrollPromptAfterPause();
