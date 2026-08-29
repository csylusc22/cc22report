(() => {
  const stage = document.getElementById("aiTvStage");
  const cassette = document.getElementById("aiCassette");
  const slot = document.getElementById("aiTvSlot");
  const dropZone = document.getElementById("aiTvDropZone");
  const video = document.getElementById("aiTvVideo");
  const eject = document.getElementById("aiTvEject");
  const hint = document.getElementById("aiTvHint");

  if (!stage || !cassette || !slot || !dropZone || !video || !eject || !hint) return;

  const defaultHint = "DRAG TAPE INTO SLOT · 点击磁带也可播放";
  let dragging = false;
  let inserted = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let dragX = 0;
  let dragY = 0;
  let ignoreClick = false;

  const setDrag = (x, y) => {
    dragX = x;
    dragY = y;
    cassette.style.setProperty("--drag-x", `${x}px`);
    cassette.style.setProperty("--drag-y", `${y}px`);
  };

  const overlapsSlot = () => {
    const tapeRect = cassette.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const tapeCenterX = tapeRect.left + tapeRect.width / 2;
    const tapeTopBand = tapeRect.top + tapeRect.height * 0.22;
    const horizontal = tapeCenterX > slotRect.left - 44 && tapeCenterX < slotRect.right + 44;
    const vertical = tapeTopBand > slotRect.top - 64 && tapeTopBand < slotRect.bottom + 80;
    return horizontal && vertical;
  };

  const positionInsertedTape = () => {
    if (!inserted) return;
    cassette.classList.remove("is-inserted");
    cassette.style.opacity = "0";
    const tapeRect = cassette.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const x = slotRect.left + slotRect.width / 2 - (tapeRect.left + tapeRect.width / 2);
    const y = slotRect.top + slotRect.height / 2 - (tapeRect.top + tapeRect.height / 2);
    cassette.style.setProperty("--insert-x", `${x}px`);
    cassette.style.setProperty("--insert-y", `${y}px`);
    cassette.classList.add("is-inserted");
    cassette.style.removeProperty("opacity");
  };

  const insertTape = () => {
    if (inserted) return;
    inserted = true;
    dragging = false;
    cassette.classList.remove("is-dragging");
    stage.classList.remove("is-drop-ready");
    setDrag(0, 0);
    positionInsertedTape();
    stage.classList.add("is-playing");
    hint.textContent = "TAPE LOADED · 正在播放";

    video.currentTime = 0;
    video.volume = 0.72;
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {
        video.muted = true;
        video.play().catch(() => {
          hint.textContent = "点击屏幕继续播放 · TAP SCREEN TO PLAY";
        });
      });
    }
  };

  const resetTape = () => {
    inserted = false;
    dragging = false;
    video.pause();
    video.currentTime = 0;
    video.muted = false;
    stage.classList.remove("is-playing", "is-drop-ready");
    cassette.classList.remove("is-inserted", "is-dragging");
    cassette.style.removeProperty("--insert-x");
    cassette.style.removeProperty("--insert-y");
    setDrag(0, 0);
    hint.textContent = defaultHint;
  };

  cassette.addEventListener("pointerdown", (event) => {
    if (inserted || event.button > 0) return;
    dragging = true;
    moved = false;
    ignoreClick = false;
    startX = event.clientX - dragX;
    startY = event.clientY - dragY;
    cassette.setPointerCapture(event.pointerId);
    cassette.classList.add("is-dragging");
    event.preventDefault();
  });

  cassette.addEventListener("pointermove", (event) => {
    if (!dragging || inserted) return;
    const nextX = event.clientX - startX;
    const nextY = event.clientY - startY;
    if (Math.hypot(nextX - dragX, nextY - dragY) > 3) moved = true;
    setDrag(nextX, nextY);
    stage.classList.toggle("is-drop-ready", overlapsSlot());
  });

  const finishDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    cassette.classList.remove("is-dragging");
    if (cassette.hasPointerCapture(event.pointerId)) cassette.releasePointerCapture(event.pointerId);
    const shouldInsert = overlapsSlot() || !moved;
    stage.classList.remove("is-drop-ready");
    ignoreClick = true;
    if (shouldInsert) insertTape();
    else setDrag(0, 0);
    window.setTimeout(() => { ignoreClick = false; }, 0);
  };

  cassette.addEventListener("pointerup", finishDrag);
  cassette.addEventListener("pointercancel", finishDrag);
  cassette.addEventListener("click", () => {
    if (!ignoreClick) insertTape();
  });

  cassette.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      insertTape();
    }
  });

  eject.addEventListener("click", (event) => {
    event.stopPropagation();
    resetTape();
  });

  dropZone.addEventListener("click", (event) => {
    if (!inserted || event.target === eject) return;
    if (video.paused) {
      video.play();
      hint.textContent = "TAPE LOADED · 正在播放";
    } else {
      video.pause();
      hint.textContent = "PAUSED · 点击屏幕继续播放";
    }
  });

  let resizeFrame;
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(positionInsertedTape);
  });
})();
