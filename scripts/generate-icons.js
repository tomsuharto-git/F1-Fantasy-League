const fs = require('fs');
const path = require('path');

// Generate a simple SVG icon that can be used as a placeholder
// This creates a crown-themed icon for "Grid Kings"

const generateSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#D2B83E"/>
      <stop offset="100%" style="stop-color:#B42518"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#1a1a1a" rx="${size * 0.15}"/>

  <!-- Crown shape -->
  <g transform="translate(${size * 0.15}, ${size * 0.25}) scale(${size / 100})">
    <!-- Crown base -->
    <path d="M5 50 L15 25 L35 40 L50 15 L65 40 L85 25 L95 50 L85 55 L15 55 Z"
          fill="url(#bg)" stroke="#D2B83E" stroke-width="2"/>
    <!-- Crown bottom -->
    <rect x="15" y="55" width="70" height="15" rx="3" fill="url(#bg)"/>
    <!-- Crown jewels -->
    <circle cx="50" cy="35" r="5" fill="#1a1a1a"/>
    <circle cx="30" cy="42" r="3" fill="#1a1a1a"/>
    <circle cx="70" cy="42" r="3" fill="#1a1a1a"/>
  </g>

  <!-- GK text -->
  <text x="${size/2}" y="${size * 0.85}"
        font-family="Arial, sans-serif"
        font-size="${size * 0.12}"
        font-weight="bold"
        fill="#D2B83E"
        text-anchor="middle">GK</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files (these work as icons for most browsers)
sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Also create a favicon.svg
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), generateSVG(32));
console.log('Generated favicon.svg');

console.log('\\nNote: For production, convert these SVGs to PNG using a tool like:');
console.log('  - https://realfavicongenerator.net/');
console.log('  - ImageMagick: convert icon.svg icon.png');
console.log('  - Or use sharp: npm install sharp && node -e "require(\'sharp\')(\'icon.svg\').png().toFile(\'icon.png\')"');
