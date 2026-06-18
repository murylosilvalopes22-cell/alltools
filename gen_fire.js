const fs = require('fs');

const frames = [
[
"   1   ",
"  121  ",
" 11311 ",
" 11111 ",
" 12121 ",
"  111  "
],
[
"  1    ",
"  21   ",
" 1111  ",
"113111 ",
" 11211 ",
"  111  "
],
[
"    1  ",
"   12  ",
"  1111 ",
" 111311",
" 11211 ",
"  111  "
]
];

const colors = {
  '1': '#ff4500',
  '2': '#ff8c00',
  '3': '#ffd700'
};

const PIXEL_SIZE = 12;

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

fs.writeFileSync('fire_output.css', css);
console.log("CSS Generated");
