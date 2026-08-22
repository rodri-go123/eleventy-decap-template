export function initializeSlideshow() {
  const slideshow = document.querySelector(".lp-slideshow");
  if (!slideshow) return;

  const track = slideshow.querySelector(".lp-slides");
  const status = slideshow.querySelector(".lp-slideshow-status");
  const realSlides = [...track.querySelectorAll(".lp-pr-card")];
  const interval = 8000;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionMs = prefersReduced ? 0 : 600;
  const easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

  if (realSlides.length === 0) return;

  // Single slide: nothing to slide to
  if (realSlides.length < 2) {
    realSlides[0].classList.add("is-active");
    realSlides[0].setAttribute("aria-hidden", "false");
    if (status) status.textContent = `1 of 1`;
    return;
  }

  // Slide clones for seamless infinite looping
  // Extended track layout: [cloneOfLast, real0, real1, ..., realN-1, cloneOfFirst]
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[realSlides.length - 1].cloneNode(true);
  [firstClone, lastClone].forEach((clone) => {
    clone.classList.add("is-clone");
    clone.classList.remove("is-active");
    clone.setAttribute("aria-hidden", "true");
    const link = clone.querySelector(".lp-pr-card-link");
    if (link) link.tabIndex = -1;
  });
  track.insertBefore(lastClone, realSlides[0]);
  track.appendChild(firstClone);

  const allSlides = [...track.querySelectorAll(".lp-pr-card")];
  const imageWrappers = [...track.querySelectorAll(".lp-pr-image-wrapper")];
  const totalCount = allSlides.length;

  let position = 1;
  let current = 0;
  let timer;
  let isAnimating = false;
  let pointerStartX = null;
  let pointerStartY = null;
  let isDragging = false;

  const setTransition = (enabled) => {
    track.style.transition = enabled
      ? `transform ${transitionMs}ms ${easing}`
      : "none";
  };

  const applyPosition = () => {
    track.style.transform = `translateX(-${position * 100}%)`;
  };

  const updateA11y = () => {
    allSlides.forEach((slide, i) => {
      const active = i === position;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      const link = slide.querySelector(".lp-pr-card-link");
      if (link) link.tabIndex = active ? 0 : -1;
    });
    if (status) status.textContent = `${current + 1} of ${realSlides.length}`;
  };

  // Instantly reposition the track without animating (used for loop wrap-around)
  const snapNoTransition = () => {
    setTransition(false);
    applyPosition();
    updateA11y();
    void track.offsetWidth;
    setTransition(true);
  };

  const resetTimer = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => move(1), interval);
  };

  const move = (direction) => {
    if (isAnimating) return;
    isAnimating = true;

    position += direction;
    current = (current + direction + realSlides.length) % realSlides.length;

    setTransition(true);
    applyPosition();
    updateA11y();
    resetTimer();

    window.setTimeout(() => {
      // After landing on a clone, jump to the matching real slide seamlessly
      if (position === 0) {
        position = realSlides.length;
        snapNoTransition();
      } else if (position === totalCount - 1) {
        position = 1;
        snapNoTransition();
      }
      isAnimating = false;
    }, transitionMs);
  };

  // Initial placement (no animation)
  snapNoTransition();
  resetTimer();

  // Keyboard navigation
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") console.log("left"), move(-1);
    if (event.key === "ArrowRight") console.log("right"), move(1);
  });

  // Drag handlers on image wrappers
  imageWrappers.forEach((wrapper) => {
    wrapper.addEventListener("pointerdown", (event) => {
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      isDragging = true;
      slideshow.classList.add("is-dragging");
      wrapper.setPointerCapture(event.pointerId);
    });

    wrapper.addEventListener("pointerup", (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;
      isDragging = false;
      slideshow.classList.remove("is-dragging");
      pointerStartX = null;
      pointerStartY = null;

      // Minimum 50px drag to trigger slide change
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        const direction = deltaX < 0 ? 1 : -1;
        move(direction);
      } else {
        resetTimer();
      }
    });

    wrapper.addEventListener("pointercancel", () => {
      isDragging = false;
      slideshow.classList.remove("is-dragging");
      pointerStartX = null;
      pointerStartY = null;
    });

    wrapper.addEventListener("pointermove", (event) => {
      if (!isDragging || pointerStartX === null) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;

      // Prevent default only if dragging horizontally
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
      }
    });
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSlideshow);
} else {
  initializeSlideshow();
}
