// JavaScript to drive the parallax/tilt effect

// Get references to the elements
const container = document.getElementById('container');
const bg = document.querySelector('.parallax-bg');
const logo = document.getElementById('logo');

/**
 * Detect if the user is on a mobile device. We use a combination of
 * user-agent sniffing and orientation detection as a heuristic. This
 * enables us to adjust the base scale of the background image on mobile
 * devices to provide more vertical real estate for the parallax effect.
 */
const isMobile = (() => {
  // Check for mobile-specific substrings in the user agent
  const ua = navigator.userAgent || '';
  const mobileRegex = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|BB|PlayBook/i;
  // Some desktop browsers expose orientation API but we only want to treat
  // devices with a window.orientation property as mobile if UA also matches
  return mobileRegex.test(ua) || typeof window.orientation !== 'undefined';
})();

// Define the base scale applied to the background. On mobile, we zoom in by
// about 20% (scale of 1.2) so there is more room for vertical motion. On
// desktop, we keep a smaller zoom for clarity.
const baseScale = isMobile ? 1.2 : 1.03;

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
  // Limit the offset to avoid extreme translations
  const clampVal = (val, limit) => Math.min(Math.max(val, -limit), limit);
  const x = clampVal(offsetX, 150);
  const y = clampVal(offsetY, 150);

  // We use a stronger translation multiplier on desktop; on mobile the
  // multiplier remains the same but the background is zoomed in so the
  // relative motion appears more pronounced. Feel free to adjust these
  // values if you want to further tweak the effect.
  const translationFactor = 0.05;

  // Apply translation and scale to the background only
  bg.style.transform = `translate(${x * translationFactor}px, ${y * translationFactor}px) scale(${baseScale})`;
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