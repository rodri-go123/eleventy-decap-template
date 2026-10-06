export function initializeSlideshow() {
  const slideshow = document.querySelector(".lp-slideshow");
  if (!slideshow) return;

  const track = slideshow.querySelector(".lp-slides");
  const status = slideshow.querySelector(".lp-slideshow-status");
  const previousButton = slideshow.querySelector(".lp-slideshow-button--previous");
  const nextButton = slideshow.querySelector(".lp-slideshow-button--next");
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
    if (previousButton) previousButton.disabled = true;
    if (nextButton) nextButton.disabled = true;
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
  let didDrag = false;
  let suppressClick = false;
  let dragOffsetX = 0;

  const setTransition = (enabled) => {
    track.style.transition = enabled
      ? `transform ${transitionMs}ms ${easing}`
      : "none";
  };

  const applyPosition = () => {
    track.style.transform = `translateX(calc(-${position * 100}% + ${dragOffsetX}px))`;
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
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  previousButton?.addEventListener("click", () => move(-1));
  nextButton?.addEventListener("click", () => move(1));

  slideshow.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);

  let wheelLock = false;
  slideshow.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 20) return;

    event.preventDefault();
    if (wheelLock || isAnimating) return;

    wheelLock = true;
    move(event.deltaX > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock = false;
    }, transitionMs);
  }, { passive: false });

  // Drag handlers on image wrappers
  imageWrappers.forEach((wrapper) => {
    wrapper.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      isDragging = true;
      didDrag = false;
      slideshow.classList.add("is-dragging");
      wrapper.setPointerCapture(event.pointerId);
    });

    wrapper.addEventListener("pointerup", (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;
      const shouldMove = Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY);
      isDragging = false;
      slideshow.classList.remove("is-dragging");
      pointerStartX = null;
      pointerStartY = null;
      suppressClick = didDrag;

      if (shouldMove) {
        const direction = deltaX < 0 ? 1 : -1;
        dragOffsetX = 0;
        move(direction);
      } else {
        dragOffsetX = 0;
        setTransition(true);
        applyPosition();
        resetTimer();
      }
    });

    wrapper.addEventListener("pointercancel", () => {
      isDragging = false;
      slideshow.classList.remove("is-dragging");
      pointerStartX = null;
      pointerStartY = null;
      suppressClick = didDrag;
      dragOffsetX = 0;
      setTransition(true);
      applyPosition();
    });

    wrapper.addEventListener("pointermove", (event) => {
      if (!isDragging || pointerStartX === null) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;

      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        didDrag = true;
      }

      // Move the track with the pointer so the adjacent slide is revealed.
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
        dragOffsetX = deltaX;
        setTransition(false);
        applyPosition();
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
