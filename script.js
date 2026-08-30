const section = document.querySelector(".parallax");
const scene = document.querySelector(".scene");
const world = document.querySelector(".world");
const movingLayers = [...document.querySelectorAll("[data-depth]")];
const mobileLayers = [...document.querySelectorAll("[data-mobile-shift]")];
const birdFlightTemplates = [...document.querySelectorAll("[data-flight-template]")];
// Spawn the birds behind layer 3 and all nearer foreground layers.
const foregroundAnchor = world.querySelector('img[data-depth="3"]')?.closest("picture");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const backgroundMusic = document.querySelector("#background-music");
const birdSound = document.querySelector("#bird-sound");
const scrollPrompt = document.querySelector(".scroll-prompt");
const registrationButton = document.querySelector("#registration-button");
const registrationDialog = document.querySelector("#registration-dialog");
const registrationClose = document.querySelector("#registration-close");
const registrationForm = document.querySelector("#registration-form");
const attendanceDetails = document.querySelector("#attendance-details");
const attendanceRadios = [...document.querySelectorAll('input[name="Deltagelse"]')];
const flavourCheckboxes = [...document.querySelectorAll('input[name="Is-smage"]')];
const flavourCount = document.querySelector("#flavour-count");
const registrationConfirmation = document.querySelector("#registration-confirmation");
const registrationSubmit = registrationForm.querySelector('[type="submit"]');
let musicStarted = false;
let musicTarget = 0;
let musicFadeFrame;
let promptTimer;
let birdTimer;

function showScrollPromptAfterPause() {
  scrollPrompt.classList.remove("is-visible");
  clearTimeout(promptTimer);
  const scrollRange = section.offsetHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / scrollRange));
  if (progress >= 0.86) return;
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
  backgroundMusic.volume = 0.22;
  musicTarget = 0.22;
  backgroundMusic.play().then(() => { musicStarted = true; }).catch(() => {});
}

function flyBirds() {
  if (reduceMotion.matches) return;
  birdFlightTemplates.forEach((template) => {
    const flight = template.cloneNode(true);
    const baseTop = Number.parseFloat(getComputedStyle(template).top);
    const baseLeft = Number.parseFloat(getComputedStyle(template).left);
    flight.classList.remove("bird-flight-template");
    flight.removeAttribute("data-flight-template");
    flight.classList.add("is-flying");
    flight.style.top = `${baseTop + (Math.random() - 0.5) * 180}px`;
    flight.style.left = `${baseLeft + (Math.random() - 0.5) * 140}px`;
    flight.style.setProperty("--travel-y", `${-50 - Math.random() * 250}px`);
    if (scene.clientWidth <= 600 || !foregroundAnchor) world.append(flight);
    else world.insertBefore(flight, foregroundAnchor);
    flight.addEventListener("animationend", () => flight.remove(), { once: true });
  });
  const birdCall = birdSound.cloneNode(true);
  birdCall.volume = 0.5;
  birdCall.play().catch(() => {});
}

function scheduleBirds() {
  flyBirds();
  birdTimer = window.setTimeout(scheduleBirds, 10000 + Math.random() * 10000);
}

// A tap/click unlocks audio on browsers that block sound during scroll gestures.
window.addEventListener("pointerdown", startBackgroundMusic);
window.addEventListener("keydown", startBackgroundMusic);
window.addEventListener("touchstart", startBackgroundMusic, { passive: true });
window.addEventListener("wheel", startBackgroundMusic, { passive: true });
// Browsers that permit autoplay begin music immediately; a tap remains the
// fallback for phones that require an interaction before audio can play.
startBackgroundMusic();
window.setTimeout(scheduleBirds, 500);
registrationButton.addEventListener("click", () => registrationDialog.showModal());
registrationClose.addEventListener("click", () => registrationDialog.close());
function updateAttendanceDetails() {
  const attending = document.querySelector('input[name="Deltagelse"]:checked')?.value === "Ja";
  attendanceDetails.classList.toggle("is-visible", attending);
  attendanceDetails.setAttribute("aria-hidden", String(!attending));
  attendanceDetails.querySelectorAll("input, textarea").forEach((field) => { field.disabled = !attending; });
}
attendanceRadios.forEach((radio) => radio.addEventListener("change", updateAttendanceDetails));
updateAttendanceDetails();
flavourCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", () => {
  const selected = flavourCheckboxes.filter((flavour) => flavour.checked);
  if (selected.length > 4) checkbox.checked = false;
  const selectedCount = flavourCheckboxes.filter((flavour) => flavour.checked).length;
  flavourCount.textContent = `(${selectedCount}/4)`;
  flavourCheckboxes.forEach((flavour) => { flavour.disabled = !flavour.checked && selectedCount >= 4; });
}));
registrationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const attending = document.querySelector('input[name="Deltagelse"]:checked')?.value === "Ja";
  registrationSubmit.disabled = true;
  registrationSubmit.textContent = "Sender…";
  registrationConfirmation.hidden = false;
  registrationConfirmation.textContent = "Sender din tilmelding — vent venligst et øjeblik.";

  try {
    const response = await fetch(registrationForm.action, {
      method: "POST",
      body: new FormData(registrationForm),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Formspree submission failed");
    registrationForm.querySelectorAll("input, textarea, button").forEach((field) => { field.disabled = true; });
    registrationSubmit.classList.add("is-sent");
    registrationSubmit.textContent = "Sendt!";
    registrationConfirmation.hidden = false;
    registrationConfirmation.textContent = attending
      ? "Tak for dit svar — vi glæder os til at fejre med dig."
      : "Tak for dit svar — vi er kede af, at du ikke kan være med.";
  } catch (error) {
    registrationConfirmation.hidden = false;
    registrationConfirmation.textContent = "Åh nej — svaret kunne ikke sendes. Prøv gerne igen om lidt.";
    registrationSubmit.disabled = false;
    registrationSubmit.textContent = "Svar her";
  }
});

function updateScene() {
  // Keep the portrait illustration comfortably framed in both desktop browsers
  // and tall phone screens, while holding the date below the opening view.
  const scale = Math.max(scene.clientWidth / 1440, scene.clientHeight / 1700);
  world.style.setProperty("--scale", scale);
  const scrollRange = section.offsetHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / scrollRange));
  // Dark type on the pale opening, gradually becoming cream over the dark landscape.
  const startColor = [74, 45, 39];
  const endColor = [255, 240, 212];
  const promptColor = startColor.map((channel, index) => Math.round(channel + (endColor[index] - channel) * progress));
  scrollPrompt.style.setProperty("--prompt-color", `rgb(${promptColor.join(", ")})`);
  setMusicLevel(musicStarted ? 0.22 : 0);
  // End the journey with the RSVP stamp centred in the viewport, rather than
  // leaving its lower half below the fold on desktop screens.
  const stampCentre = registrationButton.offsetTop + registrationButton.offsetHeight / 2;
  const cameraForStamp = stampCentre - scene.clientHeight / (2 * scale);
  const cameraDistance = scene.clientWidth <= 600 ? 1300 : Math.max(1300, cameraForStamp);
  world.style.setProperty("--camera", progress * cameraDistance);
  if (scene.clientWidth <= 600) {
    mobileLayers.forEach((item) => item.style.setProperty("--float", `${Number(item.dataset.mobileShift) * progress}px`));
  } else {
    movingLayers.forEach((item) => {
      const depth = Number(item.dataset.depth);
      item.style.setProperty("--float", `${(12 - depth) * progress * 38}px`);
    });
  }
}
let queued = false;
function requestUpdate() { if (!queued) { queued = true; requestAnimationFrame(() => { updateScene(); queued = false; }); } }
window.addEventListener("scroll", () => { showScrollPromptAfterPause(); requestUpdate(); }, { passive: true });
window.addEventListener("resize", requestUpdate);
updateScene();
showScrollPromptAfterPause();
