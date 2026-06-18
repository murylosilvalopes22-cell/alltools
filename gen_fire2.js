import fs from 'fs';

const frames = [
[
"   R    ",
"  R R   ",
"  ROR   ",
" ROOOR  ",
" ROYYOR ",
" RRYYYR ",
" RRRYRR ",
"  RRRR  "
],
[
"  R     ",
"  R     ",
" ROR    ",
" RYOR   ",
" ROOOR  ",
" RRYYYR ",
" RRRYRR ",
"  RRRR  "
],
[
"    R   ",
"    R   ",
"   ROR  ",
"   ROYR ",
"  ROOOR ",
" RYYYRR ",
" RRYRRR ",
"  RRRR  "
]
];

const colors = {
  'R': '#ff4500',
  'O': '#ff8c00',
  'Y': '#ffd700'
};

const PIXEL_SIZE = 8; // 8x8 = 64px max width

let css = `@keyframes bonfire-pixel-fire-anim {\n`;

frames.forEach((frame, idx) => {
  let shadows = [];
  frame.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      let char = row[x];
      if (colors[char]) {
        shadows.push(`${(x+1)*PIXEL_SIZE}px ${(y+1)*PIXEL_SIZE}px 0 ${colors[char]}`);
      }
    }
  });
  
  let percent = idx === 0 ? '0%' : idx === 1 ? '33%' : '66%';
  css += `  ${percent} {\n    box-shadow: \n      ${shadows.join(', ')};\n  }\n`;
});

css += `}\n`;

fs.writeFileSync('fire_output2.css', css);
console.log("CSS Generated");
