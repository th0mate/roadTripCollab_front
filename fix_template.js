const fs = require('fs');
const f = 'src/views/TripDashboardView.vue';
let t = fs.readFileSync(f, 'utf8');

const MARKER_START = '      <!-- Stop modal -->\n';
const MARKER_END = '      <AppModal v-model="showStopModal"';

const i1 = t.indexOf(MARKER_START);
const i2 = t.indexOf(MARKER_END);

if (i1 === -1 || i2 === -1) {
  console.log('Markers not found! i1=' + i1 + ' i2=' + i2);
  process.exit(1);
}

console.log('Found orphan block from char', i1, 'to', i2, '(', i2 - i1, 'chars to remove)');

// Keep everything up to and including the comment, then jump straight to AppModal
const cleaned = t.substring(0, i1) + MARKER_START + '\n' + t.substring(i2);

fs.writeFileSync(f, cleaned, 'utf8');
console.log('Done! New size:', cleaned.length);

