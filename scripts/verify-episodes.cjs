const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const stories = vm.runInNewContext(fs.readFileSync(path.join(root, 'catalog.js'), 'utf8') + ';STORIES');
const boards = JSON.parse(fs.readFileSync(path.join(root, 'production/storyboards.json'), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(root, 'production/review.json'), 'utf8'));

function webpSize(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 < bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X') return [1 + bytes.readUIntLE(data + 4, 3), 1 + bytes.readUIntLE(data + 7, 3)];
    if (type === 'VP8 ') return [bytes.readUInt16LE(data + 6) & 0x3fff, bytes.readUInt16LE(data + 8) & 0x3fff];
    if (type === 'VP8L') {
      const bits = bytes.readUInt32LE(data + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error('WebP dimensions missing');
}

assert.equal(stories.length, 90);
assert.equal(boards.length, 90);
assert.equal(new Set(review.reviewed).size, 90, 'visual review incomplete');
for (const correction of review.corrections) assert.equal(correction.status, 'applied', correction.id + ': outstanding artwork correction');
const hashes = new Set(), urls = new Set();
let totalBytes = 0;
for (let grade = 1; grade <= 6; grade++) {
  assert.equal(stories.filter(s => s.grade === grade).length, 15);
  for (const area of ['경제', '노동', '금융']) assert.equal(stories.filter(s => s.grade === grade && s.area === area).length, 5);
}
for (const story of stories) {
  const sheet = story.illustration;
  assert.equal(story.panels.length, 8, story.id);
  assert.ok(review.reviewed.includes(story.id), story.id + ': visual review missing');
  assert.equal(sheet.src, 'assets/episodes/' + story.id + '.webp');
  assert.equal(sheet.columns, 2);
  assert.equal(sheet.rows, 4);
  assert.equal(story.cover, 0);
  assert.ok(!urls.has(sheet.src), story.id + ': reused episode image');
  urls.add(sheet.src);
  const bytes = fs.readFileSync(path.join(root, sheet.src));
  assert.deepEqual(webpSize(bytes), [sheet.width, sheet.height], story.id + ': incorrect cropping dimensions');
  assert.equal(sheet.width % 2, 0);
  assert.equal(sheet.height % 4, 0);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.ok(!hashes.has(hash), story.id + ': duplicate artwork');
  hashes.add(hash);
  const record = JSON.parse(fs.readFileSync(path.join(root, 'production/generated', story.id + '.json'), 'utf8'));
  assert.equal(record.sha256, hash);
  assert.equal(record.bytes, bytes.length);
  assert.equal(record.width, sheet.width);
  assert.equal(record.height, sheet.height);
  totalBytes += bytes.length;
  const board = boards.find(b => b.id === story.id);
  assert.ok(board, story.id + ': missing storyboard');
  assert.equal((board.prompt.match(/CELL [1-8] \(ROW/g) || []).length, 8);
  story.panels.forEach((scene, i) => {
    assert.equal(scene.art, i, story.id + ': wrong chronological frame');
    if (scene.reverseSpeakers !== undefined) assert.equal(typeof scene.reverseSpeakers, 'boolean');
    assert.equal(scene.reverseSpeakers === true, (review.speakerFlips[story.id] || []).includes(i), story.id + ': reviewed speaker position mismatch');
    assert.ok(Array.isArray(scene.lines)&&scene.lines.length<=3, story.id+': zero to three dialogue lines');
    assert.ok(board.prompt.includes('ACTION: ' + scene.caption), story.id + ': storyboard/action mismatch');
    // Original prompts describe the checked-in artwork. Current web dialogue is
    // independently validated and documented by verify-dialogue / dialogue-review.
  });
}
console.log('PASS: 90 distinct WebP story atlases, 720 ordered frames, complete storyboards and matching dimensions/checksums; ' + (totalBytes / 1024 / 1024).toFixed(1) + ' MiB artwork.');
