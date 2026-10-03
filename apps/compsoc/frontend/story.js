const DECK_QUERY = "(min-width: 768px) and (min-height: 480px)";
const deckMedia = window.matchMedia(DECK_QUERY);
const root = document.documentElement;
const slides = Array.from(document.querySelectorAll(".slide"));
const cellList = document.querySelector(".deck-cells");
const counter = document.querySelector(".deck-count");
const prevButton = document.querySelector(".deck-prev");
const nextButton = document.querySelector(".deck-next");

let current = 0;
let step = 0;
let observer = null;

function makeSquare(className, index) {
  const square = document.createElement("span");
  square.className = className;
  square.style.setProperty("--n", String(index));
  return square;
}

function buildUnits() {
  document.querySelectorAll(".units").forEach((group) => {
    const total = Number(group.dataset.total);
    const filled = Number(group.dataset.filled);
    group.style.setProperty("--cols", group.dataset.cols);
    for (let i = 0; i < total; i += 1) {
      const unit = makeSquare("unit", i);
      if (i < filled) unit.classList.add("is-filled");
      group.append(unit);
    }
  });
}

function buildRankings() {
  document.querySelectorAll(".ranking").forEach((ranking) => {
    const count = Number(ranking.dataset.count);
    const target = Number(ranking.dataset.target);
    ranking.style.setProperty("--cols", ranking.dataset.cols);
    for (let i = 0; i < count; i += 1) {
      const cell = makeSquare("rank-cell", i);
      if (i < 5) cell.classList.add("is-top");
      if (i === target - 1) cell.classList.add("is-target");
      ranking.append(cell);
    }
  });
}

function stepsOf(index) {
  return Number(slides[index].dataset.steps || 0);
}

function render() {
  slides.forEach((slide, index) => {
    const active = index === current;
    slide.classList.toggle("is-active", active);
    slide.classList.toggle("is-before", index < current);
    slide.classList.toggle("is-step", active && step > 0);
    slide.setAttribute("aria-hidden", String(!active));
  });
  cellList.querySelectorAll("li").forEach((item, index) => {
    const button = item.querySelector("button");
    item.classList.toggle("is-seen", index < current);
    if (index === current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  counter.textContent = `${current + 1} / ${slides.length}`;
  prevButton.disabled = current === 0 && step === 0;
  nextButton.disabled =
    current === slides.length - 1 && step === stepsOf(current);
  history.replaceState(null, "", `#${current + 1}`);
}

function goTo(index, atStep = 0) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  step = atStep;
  render();
}

function next() {
  if (step < stepsOf(current)) {
    step += 1;
    render();
  } else if (current < slides.length - 1) {
    goTo(current + 1);
  }
}

function previous() {
  if (step > 0) {
    step -= 1;
    render();
  } else if (current > 0) {
    goTo(current - 1, stepsOf(current - 1));
  }
}

function buildNav() {
  slides.forEach((slide, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Slide ${index + 1}: ${slide.dataset.title}`,
    );
    button.addEventListener("click", () => goTo(index));
    item.append(button);
    cellList.append(item);
  });
  prevButton.addEventListener("click", previous);
  nextButton.addEventListener("click", next);
}

function onKey(event) {
  if (!deckMedia.matches || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  const onControl =
    event.target instanceof Element && event.target.closest("a, button");
  if (onControl && (event.key === " " || event.key === "Enter")) return;
  const forward = ["ArrowRight", "ArrowDown", "PageDown", " "];
  const back = ["ArrowLeft", "ArrowUp", "PageUp"];
  if (forward.includes(event.key) && !(event.key === " " && event.shiftKey)) {
    event.preventDefault();
    next();
  } else if (
    back.includes(event.key) ||
    (event.key === " " && event.shiftKey)
  ) {
    event.preventDefault();
    previous();
  } else if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  } else if (event.key === "End") {
    event.preventDefault();
    goTo(slides.length - 1);
  } else if (event.key === "f" || event.key === "F") {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.();
  }
}

let touchStart = null;
function onTouchStart(event) {
  touchStart = event.touches[0];
}
function onTouchEnd(event) {
  if (!deckMedia.matches || !touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.clientX;
  const dy = event.changedTouches[0].clientY - touchStart.clientY;
  touchStart = null;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
  if (dx < 0) next();
  else previous();
}

function startScrollMode() {
  slides.forEach((slide) => {
    slide.classList.remove("is-before");
    slide.removeAttribute("aria-hidden");
  });
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const slide = entry.target;
        slide.classList.add("is-active");
        if (slide.dataset.steps) {
          window.setTimeout(() => slide.classList.add("is-step"), 1800);
        }
        observer.unobserve(slide);
      });
    },
    { threshold: 0.3 },
  );
  slides.forEach((slide) => observer.observe(slide));
}

function applyMode() {
  const deck = deckMedia.matches;
  root.classList.toggle("deck-mode", deck);
  if (deck) {
    observer?.disconnect();
    observer = null;
    render();
  } else {
    startScrollMode();
  }
}

buildUnits();
buildRankings();
buildNav();

const fromHash = Number.parseInt(window.location.hash.slice(1), 10);
if (fromHash >= 1 && fromHash <= slides.length) current = fromHash - 1;

document.addEventListener("keydown", onKey);
document.addEventListener("touchstart", onTouchStart, { passive: true });
document.addEventListener("touchend", onTouchEnd);
deckMedia.addEventListener("change", applyMode);
// Wait two frames so the first slide's hidden state paints before it animates in.
requestAnimationFrame(() => requestAnimationFrame(applyMode));
