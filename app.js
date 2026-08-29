const body = document.body;
const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('.site-menu');
const sections = [...document.querySelectorAll('.page')];
const railLinks = [...document.querySelectorAll('.section-rail a')];
const currentNumber = document.querySelector('#currentNumber');
const currentTitle = document.querySelector('#currentTitle');
const rail = document.querySelector('.section-rail');
const cursor = document.querySelector('.cursor-orbit');
const previewTarget = new URLSearchParams(location.search).get('preview');

menuButton.addEventListener('click', () => {
  const open = !body.classList.contains('menu-open');
  body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
});

menu.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: 0.14 });
sections.forEach((section) => observer.observe(section));

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const section = visible.target;
  const index = sections.indexOf(section);
  currentNumber.textContent = section.dataset.number;
  currentTitle.textContent = section.dataset.title;
  body.dataset.theme = section.dataset.theme;
  railLinks.forEach((link, linkIndex) => link.classList.toggle('active', linkIndex === index));
}, { threshold: [0.35, 0.55, 0.7] });
sections.forEach((section) => sectionObserver.observe(section));

// Re-align deep links after large portfolio images have finished affecting layout.
window.addEventListener('load', () => {
  if (previewTarget) {
    const target = document.querySelector(`#${previewTarget}`);
    sections.forEach((section) => section.classList.add('is-visible'));
    document.documentElement.style.scrollBehavior = 'auto';
    if (target) window.scrollTo(0, target.offsetTop);
    return;
  }
  if (!location.hash) return;
  const target = document.querySelector(location.hash);
  if (target) window.setTimeout(() => target.scrollIntoView({ block: 'start' }), 120);
});

let cursorX = innerWidth / 2;
let cursorY = innerHeight / 2;
let orbitX = cursorX;
let orbitY = cursorY;

window.addEventListener('pointermove', (event) => {
  cursorX = event.clientX;
  cursorY = event.clientY;
  document.querySelectorAll('[data-parallax]').forEach((element) => {
    const strength = Number(element.dataset.parallax);
    const x = (event.clientX - innerWidth / 2) * strength;
    const y = (event.clientY - innerHeight / 2) * strength;
    element.style.translate = `${x}px ${y}px`;
  });
});

function moveCursor() {
  orbitX += (cursorX - orbitX) * 0.16;
  orbitY += (cursorY - orbitY) * 0.16;
  if (cursor) cursor.style.translate = `${orbitX}px ${orbitY}px`;
  requestAnimationFrame(moveCursor);
}
moveCursor();

window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? (scrollY / max) * 100 : 0;
  rail.style.setProperty('--progress', `${progress}%`);
}, { passive: true });

document.querySelectorAll('a, button, figure').forEach((element) => {
  element.addEventListener('pointerenter', () => cursor?.style.setProperty('transform', 'scale(1.65)'));
  element.addEventListener('pointerleave', () => cursor?.style.setProperty('transform', 'scale(1)'));
});

const flyingSwallow = document.querySelector('.flying-swallow');

if (flyingSwallow) {
  const launchSwallow = () => {
    if (!flyingSwallow.classList.contains('is-flying')) flyingSwallow.classList.add('is-flying');
  };
  flyingSwallow.addEventListener('pointerenter', launchSwallow);
  flyingSwallow.addEventListener('click', launchSwallow);
  flyingSwallow.addEventListener('animationend', () => {
    window.setTimeout(() => flyingSwallow.classList.remove('is-flying'), 420);
  });
}

// Direction page: cursor-positioned water ripples for both concentric diagrams.
document.querySelectorAll('[data-ripple-zone]').forEach((zone) => {
  let touchTimer;

  const placeRipple = (event) => {
    const rect = zone.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
    const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
    zone.style.setProperty('--ripple-x', `${x}px`);
    zone.style.setProperty('--ripple-y', `${y}px`);
  };

  zone.addEventListener('pointerenter', (event) => {
    placeRipple(event);
    zone.classList.add('is-rippling');
  });
  zone.addEventListener('pointermove', placeRipple);
  zone.addEventListener('pointerleave', () => zone.classList.remove('is-rippling'));
  zone.addEventListener('pointerdown', (event) => {
    placeRipple(event);
    zone.classList.add('is-rippling');
    window.clearTimeout(touchTimer);
    touchTimer = window.setTimeout(() => zone.classList.remove('is-rippling'), 1800);
  });
});

// About page: openable envelope, fanned cards and an image lightbox.
const aboutEnvelope = document.querySelector('#aboutEnvelope');
const envelopeToggle = aboutEnvelope?.querySelector('.envelope-toggle');
const aboutWorkCards = [...document.querySelectorAll('.about-work-card')];
const aboutLightbox = document.querySelector('#aboutLightbox');

if (aboutEnvelope && envelopeToggle) {
  envelopeToggle.addEventListener('click', () => {
    const isOpen = aboutEnvelope.classList.toggle('is-open');
    envelopeToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

if (aboutLightbox && aboutWorkCards.length) {
  const lightboxImage = aboutLightbox.querySelector('figure img');
  const lightboxCaption = aboutLightbox.querySelector('figcaption');
  const lightboxClose = aboutLightbox.querySelector('.about-lightbox-close');
  const lightboxPrev = aboutLightbox.querySelector('.about-lightbox-prev');
  const lightboxNext = aboutLightbox.querySelector('.about-lightbox-next');
  let activeAboutImage = 0;

  const showAboutImage = (index) => {
    activeAboutImage = (index + aboutWorkCards.length) % aboutWorkCards.length;
    const card = aboutWorkCards[activeAboutImage];
    lightboxImage.src = card.dataset.aboutImage;
    lightboxImage.alt = card.querySelector('img')?.alt || '';
    lightboxCaption.textContent = card.dataset.aboutTitle || '';
  };

  const openAboutLightbox = (index) => {
    showAboutImage(index);
    aboutLightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    lightboxClose.focus();
  };

  const closeAboutLightbox = () => {
    aboutLightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    aboutWorkCards[activeAboutImage]?.focus();
  };

  aboutWorkCards.forEach((card, index) => {
    card.addEventListener('click', (event) => {
      event.stopPropagation();
      openAboutLightbox(index);
    });
  });
  lightboxClose.addEventListener('click', closeAboutLightbox);
  lightboxPrev.addEventListener('click', () => showAboutImage(activeAboutImage - 1));
  lightboxNext.addEventListener('click', () => showAboutImage(activeAboutImage + 1));
  aboutLightbox.addEventListener('click', (event) => {
    if (event.target === aboutLightbox) closeAboutLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (aboutLightbox.hidden) return;
    if (event.key === 'Escape') closeAboutLightbox();
    if (event.key === 'ArrowLeft') showAboutImage(activeAboutImage - 1);
    if (event.key === 'ArrowRight') showAboutImage(activeAboutImage + 1);
  });
}

const profileFolder = document.querySelector('#profileFolder');
const profileFolderToggle = profileFolder?.querySelector('.profile-folder-toggle');

if (profileFolder && profileFolderToggle) {
  profileFolderToggle.addEventListener('click', () => {
    const isOpen = profileFolder.classList.toggle('is-open');
    profileFolderToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Interactive typographic tree: it grows from the trunk, then selected words
// detach, sway and settle like dry leaves. The cursor can still disturb it.
const wordTreeCanvas = document.querySelector('#wordTree');

if (wordTreeCanvas) {
  const context = wordTreeCanvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: -9999, y: -9999, active: false };
  const particles = [];
  const leaves = [];
  let startedAt = performance.now();
  let previousFrame = startedAt;
  const vocabulary = [
    'LIFE', 'CONTINUE', 'GROW', 'SPACE', 'STORY', 'MEMORY', 'LIGHT',
    'PURE', 'CURIOUS', 'THINK', 'EXPLORE', 'FEEL', 'TIME', 'HUMAN',
    '叙事', '空间', '感知', '好奇', '生长', '思考', '连接', '体验'
  ];

  // All paths run from a trunk/junction toward a tip, matching the new tree
  // artwork on the right side of the cover.
  const branches = [
    [[.92, .89], [.90, .70], [.84, .48], [.77, .29]],
    [[.79, .42], [.70, .31], [.59, .18], [.47, .07]],
    [[.77, .32], [.70, .22], [.62, .14], [.55, .04]],
    [[.82, .49], [.72, .45], [.62, .39], [.51, .35]],
    [[.78, .36], [.75, .24], [.73, .13], [.73, .02]],
    [[.80, .38], [.84, .27], [.87, .16], [.89, .04]],
    [[.82, .43], [.88, .33], [.93, .23], [.97, .12]],
    [[.84, .51], [.90, .46], [.95, .40], [1.01, .34]],
    [[.88, .61], [.79, .60], [.68, .63], [.56, .70]],
    [[.81, .61], [.73, .69], [.66, .77], [.57, .84]],
    [[.90, .66], [.93, .75], [.96, .84], [1.01, .93]],
    [[.84, .47], [.78, .42], [.70, .43], [.62, .47]]
  ];

  function bezier(points, t) {
    const mt = 1 - t;
    return {
      x: mt ** 3 * points[0][0] + 3 * mt ** 2 * t * points[1][0] + 3 * mt * t ** 2 * points[2][0] + t ** 3 * points[3][0],
      y: mt ** 3 * points[0][1] + 3 * mt ** 2 * t * points[1][1] + 3 * mt * t ** 2 * points[2][1] + t ** 3 * points[3][1]
    };
  }

  function buildTree() {
    const rect = wordTreeCanvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    wordTreeCanvas.width = Math.round(rect.width * ratio);
    wordTreeCanvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles.length = 0;
    leaves.length = 0;
    startedAt = performance.now();

    branches.forEach((branch, branchIndex) => {
      const points = branch.map(([x, y]) => [x * rect.width, y * rect.height]);
      const amount = branchIndex === 0 ? 68 : 27;
      for (let index = 0; index < amount; index += 1) {
        const t = index / (amount - 1);
        const point = bezier(points, t);
        const ahead = bezier(points, Math.min(1, t + .012));
        const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x);
        const jitter = branchIndex === 0 ? 4.5 : 3;
        const normalX = -Math.sin(angle) * ((index % 3) - 1) * jitter;
        const normalY = Math.cos(angle) * ((index % 3) - 1) * jitter;
        const x = point.x + normalX;
        const y = point.y + normalY;
        const mayFall = branchIndex > 0 && t > .32 && (index + branchIndex) % 3 !== 0;
        particles.push({
          homeX: x, homeY: y, x, y, vx: 0, vy: 0, angle, spin: 0,
          text: vocabulary[(index + branchIndex * 3) % vocabulary.length],
          size: branchIndex === 0 ? 7 + (1 - t) * 2 : 6 + (1 - t) * 1.3,
          alpha: branchIndex === 0 ? .58 : .42 + (index % 4) * .045,
          birth: 160 + branchIndex * 70 + t * 2450,
          release: mayFall ? 3700 + ((index * 271 + branchIndex * 613) % 5800) : Infinity,
          floor: rect.height * (.91 + ((index + branchIndex) % 7) * .011),
          state: 'attached'
        });
      }
    });

    branches.slice(1).forEach((branch, tipIndex) => {
      const [tipX, tipY] = branch[3];
      const count = 3 + (tipIndex % 4);
      for (let index = 0; index < count; index += 1) {
        const x = tipX * rect.width + Math.cos(index * 2.1) * (8 + index * 3);
        const y = tipY * rect.height + Math.sin(index * 1.7) * (6 + index * 2);
        leaves.push({
          homeX: x, homeY: y, x, y, vx: 0, vy: 0,
          angle: index * .72 + tipIndex, size: 5 + index % 3,
          birth: 2200 + tipIndex * 75 + index * 80
        });
      }
    });
  }

  function disturb(item, radius, strength) {
    if (pointer.active) {
      const dx = item.x - pointer.x;
      const dy = item.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < radius) {
        const force = (1 - distance / radius) ** 2 * strength;
        item.vx += (dx / distance) * force;
        item.vy += (dy / distance) * force;
      }
    }
    item.vx += (item.homeX - item.x) * .045;
    item.vy += (item.homeY - item.y) * .045;
    item.vx *= .84;
    item.vy *= .84;
    item.x += item.vx;
    item.y += item.vy;
  }

  function drawGrowingBranches(rect, elapsed) {
    const growth = reduceMotion ? 1 : Math.min(1, elapsed / 3000);
    context.save();
    context.strokeStyle = 'rgba(81, 70, 57, .13)';
    context.lineWidth = .72;
    branches.forEach((branch, branchIndex) => {
      const localGrowth = Math.max(0, Math.min(1, growth * 1.35 - branchIndex * .018));
      if (!localGrowth) return;
      const points = branch.map(([x, y]) => [x * rect.width, y * rect.height]);
      context.beginPath();
      for (let step = 0; step <= 34 * localGrowth; step += 1) {
        const point = bezier(points, step / 34);
        if (step === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.stroke();
    });
    context.restore();
  }

  function drawTree(now) {
    const rect = wordTreeCanvas.getBoundingClientRect();
    const elapsed = reduceMotion ? 10000 : now - startedAt;
    const delta = Math.min(2, (now - previousFrame) / 16.67 || 1);
    previousFrame = now;
    context.clearRect(0, 0, rect.width, rect.height);
    drawGrowingBranches(rect, elapsed);

    particles.forEach((particle, index) => {
      if (elapsed < particle.birth) return;
      if (particle.state === 'attached' && elapsed > particle.release && !reduceMotion) {
        particle.state = 'falling';
        particle.vx = -0.15 + ((index * 17) % 11) * .035;
        particle.vy = .1 + (index % 5) * .035;
        particle.spin = ((index % 7) - 3) * .0025;
      }

      if (particle.state === 'attached') {
        disturb(particle, 105, 5.8);
      } else if (particle.state === 'falling') {
        particle.vx += Math.sin(now * .0014 + index) * .012 * delta;
        particle.vy += .032 * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.angle += particle.spin * delta;
        if (particle.y >= particle.floor) {
          particle.y = particle.floor;
          particle.state = 'settled';
          particle.angle *= .35;
        }
      }

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.angle);
      context.font = `${particle.size}px Georgia, "Times New Roman", "Portfolio Qingke Fallback", serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const fade = Math.min(1, (elapsed - particle.birth) / 350);
      context.fillStyle = `rgba(66, 58, 49, ${particle.alpha * fade})`;
      context.fillText(particle.text, 0, 0);
      context.restore();
    });

    leaves.forEach((leaf, index) => {
      if (elapsed < leaf.birth) return;
      disturb(leaf, 118, 6.5);
      context.save();
      context.translate(leaf.x, leaf.y);
      context.rotate(leaf.angle + Math.sin(now * .001 + index) * .08);
      context.beginPath();
      context.ellipse(0, 0, leaf.size * 1.7, leaf.size, 0, 0, Math.PI * 2);
      context.fillStyle = index % 3 === 0 ? '#506944' : index % 3 === 1 ? '#70845b' : '#88956c';
      context.fill();
      context.restore();
    });

    requestAnimationFrame(drawTree);
  }

  function updatePointer(event) {
    const rect = wordTreeCanvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }

  wordTreeCanvas.addEventListener('pointermove', updatePointer);
  wordTreeCanvas.addEventListener('pointerdown', updatePointer);
  wordTreeCanvas.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('resize', buildTree);
  buildTree();
  document.fonts?.ready.then(buildTree);
  requestAnimationFrame(drawTree);
}
