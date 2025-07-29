// JavaScript to drive the parallax/tilt effect

// Get references to the elements
const container = document.getElementById('container');
const bg = document.querySelector('.parallax-bg');
const logo = document.getElementById('logo');

/**
 * Apply transforms to the background image only. The logo and socials stay fixed
 * so they remain easy to click. We also tone down the effect so it is more subtle.
 *
 * @param {number} offsetX Horizontal offset (positive to the right)
 * @param {number} offsetY Vertical offset (positive downwards)
 */
function applyParallax(offsetX, offsetY) {
  // Limit the offset to avoid extreme translations
  const clampVal = (val, limit) => Math.min(Math.max(val, -limit), limit);
  const x = clampVal(offsetX, 150);
  const y = clampVal(offsetY, 150);

  // Apply a subtle translation to the background only
  // Smaller multipliers yield a less intense effect
  bg.style.transform = `translate(${x * 0.02}px, ${y * 0.02}px) scale(1.03)`;
}

// Mouse move handler for desktop
function handleMouseMove(event) {
  const rect = container.getBoundingClientRect();
  const offsetX = event.clientX - (rect.left + rect.width / 2);
  const offsetY = event.clientY - (rect.top + rect.height / 2);
  applyParallax(offsetX, offsetY);
}

// Device orientation handler for mobile
function handleDeviceOrientation(event) {
  const { beta = 0, gamma = 0 } = event;
  /*
    beta (device tilt forward/back) typically ranges [-180,180]
    gamma (device tilt left/right) typically ranges [-90,90]
    We scale these values down and clamp them so the effect remains subtle.
  */
  const clampValue = (val, max) => Math.min(Math.max(val, -max), max);
  const scaleFactor = 5; // reduce scale factor for smoother motion
  const x = clampValue(gamma * scaleFactor, 150);
  const y = clampValue(beta * scaleFactor, 150);
  applyParallax(x, y);
}

// Register event listeners
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('deviceorientation', handleDeviceOrientation);