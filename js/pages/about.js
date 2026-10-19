import { parallax } from '../motion.js';

export default function ({ site }) {
  document.getElementById('area-text').textContent = site.serviceArea;
  parallax('.about-wide', 6);
}
