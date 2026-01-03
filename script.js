// JavaScript to drive the parallax/tilt effect

// Get references to the elements
const container = document.getElementById('container');
const bg = document.querySelector('.parallax-bg');
const logo = document.getElementById('logo');

// Check if user prefers reduced motion for accessibility
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Detect if the user is on a mobile device using modern feature detection.
 * We use user-agent sniffing and touch capability detection as a heuristic.
 * This enables us to adjust the base scale of the background image on mobile
 * devices to provide more vertical real estate for the parallax effect.
 */
const isMobile = (() => {
  // Check for mobile-specific substrings in the user agent
  const ua = navigator.userAgent || '';
  const mobileRegex = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|BB|PlayBook/i;
  // Check for touch support as an additional indicator
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return mobileRegex.test(ua) || (hasTouch && window.innerWidth < 1024);
})();

// Define the base scale applied to the background. On mobile, we zoom in by
// about 20% (scale of 1.2) so there is more room for vertical motion. On
// desktop, we keep a smaller zoom for clarity.
const baseScale = isMobile ? 1.2 : 1.05;

// Current and target positions for smooth animation
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;

// Current and target rotations for tilt card effect
let currentRotateX = 0;
let currentRotateY = 0;
let targetRotateX = 0;
let targetRotateY = 0;

/**
 * Apply 3D tilt rotation to the container, creating a "floating card" effect.
 * The rotation is inverted (mouse on right tilts left) to create depth illusion.
 * Only applied on desktop for best experience.
 *
 * @param {number} rotateX Rotation around X axis (degrees)
 * @param {number} rotateY Rotation around Y axis (degrees)
 */
function applyTilt(rotateX, rotateY) {
  // Skip tilt on mobile or if user prefers reduced motion
  if (isMobile || prefersReducedMotion) {
    container.style.transform = '';
    return;
  }

  // Apply 3D rotation to container
  container.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

/**
 * Apply transforms to the background image only. The logo and socials stay
 * fixed so they remain easy to click. We also control the intensity via
 * translation multipliers. The scale factor is determined by `baseScale`,
 * which is larger on mobile devices to provide more vertical space for
 * parallax motion.
 *
 * @param {number} offsetX Horizontal offset (positive to the right)
 * @param {number} offsetY Vertical offset (positive downwards)
 */
function applyParallax(offsetX, offsetY) {
  // If user prefers reduced motion, don't apply parallax effect
  if (prefersReducedMotion) {
    bg.style.transform = `scale(${baseScale})`;
    return;
  }

  // Limit the offset to avoid extreme translations
  const clampVal = (val, limit) => Math.min(Math.max(val, -limit), limit);
  const x = clampVal(offsetX, 150);
  const y = clampVal(offsetY, 150);

  // Increased translation factor for more noticeable effect
  // Desktop gets a stronger effect, mobile uses the zoomed background for motion
  const translationFactor = isMobile ? 0.08 : 0.15;

  // Apply translation and scale to the background only
  bg.style.transform = `translate(${x * translationFactor}px, ${y * translationFactor}px) scale(${baseScale})`;
}

// Mouse move handler for desktop - update target position and rotation
function handleMouseMove(event) {
  const rect = container.getBoundingClientRect();
  targetX = event.clientX - (rect.left + rect.width / 2);
  targetY = event.clientY - (rect.top + rect.height / 2);

  // Calculate target rotation for tilt effect
  // Normalize to -1 to 1 range, then scale to degrees
  const normalizedX = targetX / (rect.width / 2);
  const normalizedY = targetY / (rect.height / 2);

  // Invert and scale rotations for natural tilt feel
  // Max rotation of ~8 degrees for subtle effect
  const maxTilt = 8;
  targetRotateY = normalizedX * maxTilt; // Horizontal mouse = Y rotation
  targetRotateX = -normalizedY * maxTilt; // Vertical mouse = X rotation (inverted)
}

// Mouse leave handler - reset to center
function handleMouseLeave() {
  targetX = 0;
  targetY = 0;
  targetRotateX = 0;
  targetRotateY = 0;
}

// Animation loop for smooth parallax and tilt using requestAnimationFrame
function animate() {
  // Lerp (linear interpolation) for smooth movement
  const lerp = (start, end, factor) => start + (end - start) * factor;
  const smoothFactor = 0.1; // Lower = smoother but slower, higher = faster but less smooth

  // Update parallax position
  currentX = lerp(currentX, targetX, smoothFactor);
  currentY = lerp(currentY, targetY, smoothFactor);

  // Update tilt rotation
  currentRotateX = lerp(currentRotateX, targetRotateX, smoothFactor);
  currentRotateY = lerp(currentRotateY, targetRotateY, smoothFactor);

  // Apply both effects
  applyTilt(currentRotateX, currentRotateY);
  applyParallax(currentX, currentY);

  requestAnimationFrame(animate);
}

// Start the animation loop
if (!prefersReducedMotion) {
  requestAnimationFrame(animate);
}

// Device orientation handler for mobile - update target position
function handleDeviceOrientation(event) {
  const { beta = 0, gamma = 0 } = event;
  /*
    beta (device tilt forward/back) typically ranges [-180,180]
    gamma (device tilt left/right) typically ranges [-90,90]
    We scale these values down and clamp them so the effect remains subtle.
  */
  const clampValue = (val, max) => Math.min(Math.max(val, -max), max);
  const scaleFactor = 6; // Slightly increased for more noticeable effect
  targetX = clampValue(gamma * scaleFactor, 150);
  targetY = clampValue(beta * scaleFactor, 150);
}

// Register event listeners
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mouseleave', handleMouseLeave);

/*
 * Mobile device orientation handling
 *
 * On iOS 13+ devices, access to the device's accelerometer/gyroscope data
 * requires an explicit permission request triggered by a user gesture. If we
 * attempt to listen to `deviceorientation` without permission, no data will
 * be delivered and the parallax will appear to "not work" on mobile. To
 * address this, we request permission after the first user interaction
 * (touchstart or click). On other platforms that do not require a
 * permission request, we simply attach the event listener directly.
 */

function enableDeviceOrientation() {
  // If the API or requestPermission is undefined, just attach the listener
  if (typeof DeviceOrientationEvent === 'undefined') return;

  const attachListener = () => {
    // Avoid adding multiple listeners
    if (!enableDeviceOrientation.listenerAttached) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      enableDeviceOrientation.listenerAttached = true;
    }
  };

  // iOS 13+ requires a permission prompt
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((response) => {
        if (response === 'granted') {
          attachListener();
        }
      })
      .catch((err) => {
        console.warn('DeviceOrientation permission error:', err);
      });
  } else {
    // Other platforms attach immediately
    attachListener();
  }
}

// Request permission on first user gesture
document.addEventListener('touchstart', enableDeviceOrientation, { once: true });
document.addEventListener('click', enableDeviceOrientation, { once: true });