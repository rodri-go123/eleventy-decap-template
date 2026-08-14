/**
 * Slideshow Module
 * Handles slide navigation with automatic rotation, keyboard support, and drag gestures
 * Features: Sliding transitions, drag-to-navigate, auto-rotate with timer reset
 */

export function initializeSlideshow() {
  const slideshow = document.querySelector(".lp-slideshow");
  if (!slideshow) return;

  const slides = [...slideshow.querySelectorAll(".lp-pr-card")];
  const imageWrappers = [...slideshow.querySelectorAll(".lp-pr-image-wrapper")];
  const status = slideshow.querySelector(".lp-slideshow-status");
  const interval = 8000;
  let current = 0;
  let timer;
  let pointerStartX = null;
  let pointerStartY = null;
  let isDragging = false;

  const showSlide = (index, direction = 0) => {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      
      // Remove all direction classes
      slide.classList.remove("is-active", "slide-from-left", "slide-from-right");
      
      if (active) {
        // Add direction class to animate in
        if (direction > 0) {
          slide.classList.add("slide-from-right");
        } else if (direction < 0) {
          slide.classList.add("slide-from-left");
        }
        slide.classList.add("is-active");
        slide.setAttribute("aria-hidden", "false");
        
        const link = slide.querySelector(".lp-pr-card-link");
        if (link) link.tabIndex = 0;
      } else {
        slide.setAttribute("aria-hidden", "true");
        const link = slide.querySelector(".lp-pr-card-link");
        if (link) link.tabIndex = -1;
      }
    });

    if (status) status.textContent = `${current + 1} of ${slides.length}`;
  };

  const autoRotate = () => {
    showSlide(current + 1, 1);
  };

  const resetTimer = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(autoRotate, interval);
  };

  const move = (direction) => {
    showSlide(current + direction, direction);
    resetTimer();
  };

  if (slides.length < 2) {
    showSlide(0);
    return;
  }

  showSlide(0, 0);
  resetTimer();

  // Keyboard navigation
  slideshow.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
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
