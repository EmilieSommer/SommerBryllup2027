const section = document.querySelector(".parallax");
const scene = document.querySelector(".scene");
const world = document.querySelector(".world");
const movingLayers = [...document.querySelectorAll("[data-depth]")];
const birdFlightTemplates = [...document.querySelectorAll("[data-flight-template]")];
const nearestBranch = world.querySelector('img[data-depth="2"]');
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateScene() {
  // Keep the portrait illustration comfortably framed in both desktop browsers
  // and tall phone screens, while holding the date below the opening view.
  const scale = Math.max(scene.clientWidth / 1440, scene.clientHeight / 1700);
  world.style.setProperty("--scale", scale);
  if (reduceMotion.matches) return;
  const scrollRange = section.offsetHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / scrollRange));
  // Cross this small scroll threshold to launch the flock once. Returning above
  // it arms the animation again for the next downward pass.
  if (progress >= 0.08 && !window.flockTriggered) {
    birdFlightTemplates.forEach((template) => {
      const flight = template.cloneNode(true);
      flight.classList.remove("bird-flight-template");
      flight.removeAttribute("data-flight-template");
      flight.classList.add("is-flying");
      world.insertBefore(flight, nearestBranch);
      flight.addEventListener("animationend", () => flight.remove(), { once: true });
    });
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
window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
updateScene();
