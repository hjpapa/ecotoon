const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'flow.js'), 'utf8'), context);
const flow = context.window.LearningFlow;
const stories = vm.runInNewContext(fs.readFileSync(path.join(root, 'catalog.js'), 'utf8') + ';STORIES');
for (const story of stories) {
  for (const step of flow.steps) {
    const route = flow.parseRoute(flow.storyHash(story.id, step.key), stories);
    assert.equal(route.id, story.id);
    assert.equal(route.step, step.key);
  }
  const next = flow.nextStory(stories, story);
  if (story.number === 15) assert.equal(next, null, 'Never wrap into another grade');
  else {
    assert.equal(next.grade, story.grade);
    assert.equal(next.number, story.number + 1);
  }
  const filtered = flow.nextStory(stories, story, story.area);
  if (filtered) {
    assert.equal(filtered.grade, story.grade);
    assert.equal(filtered.area, story.area);
    assert.ok(filtered.number > story.number);
  } else assert.equal(story.number % 5, 0);
}
for (const hash of ['', '#library', '#/g1-00', '#/g6-16', '#/g7-01', '#/g1-01/nope', '#/%', '#/g1-01/game/extra']) {
  assert.equal(flow.parseRoute(hash, stories), null, hash);
}
for (const record of [undefined, null, false, {}, {note:'메모만 작성'}]) {
  assert.ok(!Object.values(flow.progressFlags(record)).some(Boolean));
}
const previous = {read:true,quiz:true,note:'',gameDone:true,gameStars:3};
const copy = JSON.stringify(previous);
assert.ok(Object.values(flow.progressFlags(previous)).every(Boolean), 'Optional blank note still completes activity');
assert.equal(JSON.stringify(previous), copy, 'Never mutate existing v3 records');
const partial = flow.progressFlags({read:true,gameDone:false});
assert.equal(partial.activity, true);
assert.equal(partial.quiz, false);
assert.equal(partial.game, false);
for (let grade = 1; grade <= 6; grade++) {
  const records = {};
  records['g'+grade+'-15'] = previous;
  const incomplete = flow.gradeProgress(stories, grade, records);
  assert.equal(incomplete.completed, 1, 'Reading final episode alone is not grade completion');
  assert.equal(incomplete.next.id, 'g'+grade+'-01');
  stories.filter(story => story.grade === grade).forEach(story => {records[story.id] = previous;});
  const complete = flow.gradeProgress(stories, grade, records);
  assert.equal(complete.completed, 15);
  assert.equal(complete.next, null);
}
console.log('PASS: 450 story/stage routes, same-grade/filter navigation, v3 progress compatibility and six grade completion summaries.');
