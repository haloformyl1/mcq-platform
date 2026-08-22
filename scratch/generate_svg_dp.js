const fs = require('fs');
const path = require('path');

const targetPath = 'C:/Users/arghy/.gemini/antigravity-ide/brain/750e9abf-be52-4a2a-9095-2ab964f91f8f/piechem_official_dp.svg';

const svgContent = `<svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Square Background for Email Profile DP -->
  <rect width="800" height="800" fill="#061325"/>

  <!-- Subtle Radial Backdrop Glow -->
  <radialGradient id="bgGlow" cx="50%" cy="40%" r="50%">
    <stop offset="0%" stop-color="#0066ff" stop-opacity="0.25" />
    <stop offset="100%" stop-color="#061325" stop-opacity="0" />
  </radialGradient>
  <rect width="800" height="800" fill="url(#bgGlow)"/>

  <g transform="translate(400, 360)">
    <defs>
      <!-- Outer Hex Gradient -->
      <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe" />
        <stop offset="50%" stop-color="#0066ff" />
        <stop offset="100%" stop-color="#7b2cbf" />
      </linearGradient>

      <!-- Core Slice Gradient -->
      <linearGradient id="coreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3a7bd5" />
        <stop offset="100%" stop-color="#00d2ff" />
      </linearGradient>

      <!-- Glowing Center Accent -->
      <radialGradient id="glowAccent" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#00f2fe" stop-opacity="0" />
      </radialGradient>

      <!-- Drop Shadow Filter -->
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#00f2fe" flood-opacity="0.45"/>
      </filter>
    </defs>

    <!-- Outer Hexagonal Structure Frame (Scaled up x3.8) -->
    <g filter="url(#shadow)">
      <polygon points="0,-180 144,-97 144,97 0,180 -144,97 -144,-97" fill="none" stroke="url(#hexGrad)" stroke-width="16" stroke-linejoin="round"/>
      
      <!-- Inner Shield -->
      <polygon points="0,-140 114,-75 114,75 0,140 -114,75 -114,-75" fill="#081b33" fill-opacity="0.95" stroke="url(#hexGrad)" stroke-width="5" stroke-opacity="0.7"/>

      <!-- Corner Node Circles -->
      <circle cx="0" cy="-180" r="12" fill="#00f2fe" />
      <circle cx="144" cy="-97" r="12" fill="#0066ff" />
      <circle cx="144" cy="97" r="12" fill="#7b2cbf" />
      <circle cx="0" cy="180" r="12" fill="#00f2fe" />
      <circle cx="-144" cy="97" r="12" fill="#0066ff" />
      <circle cx="-144" cy="-97" r="12" fill="#7b2cbf" />

      <!-- Pie Slice 1 - Main Body -->
      <path d="M0 0 L0 -98 A98 98 0 1 1 -98 0 Z" fill="url(#coreGrad)" opacity="0.95"/>

      <!-- Pie Slice 2 - Floating Accent Wedge -->
      <path d="M15 -15 L92 -15 A98 98 0 0 0 15 -92 Z" fill="#00f2fe"/>

      <!-- Center Orbital Core -->
      <circle cx="0" cy="0" r="20" fill="#ffffff" />
      <circle cx="0" cy="0" r="42" fill="url(#glowAccent)" />

      <!-- Electron Orbital Rings -->
      <ellipse cx="0" cy="0" rx="122" ry="52" fill="none" stroke="#00f2fe" stroke-width="6" stroke-dasharray="14 10" transform="rotate(-30)" opacity="0.85"/>
    </g>
  </g>

  <!-- High Impact Typography -->
  <text x="400" y="660" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="64" letter-spacing="4">
    <tspan fill="#00f2fe">PIE</tspan><tspan fill="#ffffff">CHEM</tspan>
  </text>
  <text x="400" y="710" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="14" fill="rgba(0, 242, 254, 0.85)">
    EXAM PLATFORM
  </text>
</svg>`;

fs.writeFileSync(targetPath, svgContent);
console.log('Generated SVG DP successfully!');
