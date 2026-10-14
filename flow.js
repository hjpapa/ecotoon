(function () {
  const steps = [
    { key: 'comic', label: '웹툰', target: 'stage-comic' },
    { key: 'summary', label: '정리', target: 'stage-summary' },
    { key: 'quiz', label: '퀴즈', target: 'stage-quiz' },
    { key: 'activity', label: '활동', target: 'stage-activity' },
    { key: 'game', label: '게임', target: 'miniGameZone' }
  ];
  function parseRoute(hash, stories) {
    const match = /^#\/(g[1-6]-\d{2})(?:\/(comic|summary|quiz|activity|game))?$/.exec(hash);
    if (!match || !stories.some(story => story.id === match[1])) return null;
    return { id: match[1], step: match[2] || 'comic' };
  }
  function storyHash(id, step = 'comic') {
    return '#/' + id + (step === 'comic' ? '' : '/' + step);
  }
  function progressFlags(record = {}) {
    record = record && typeof record === 'object' ? record : {};
    // v3 marks reading and the optional written/oral activity together.
    // A blank note still represents a completed activity when read is true.
    return { read: record.read === true, quiz: record.quiz === true,
      activity: record.read === true, game: record.gameDone === true };
  }
  function nextStory(stories, current, category = '전체') {
    return stories.filter(story => story.grade === current.grade && story.number > current.number &&
      (category === '전체' || category !== current.area || story.area === category))
      .sort((a, b) => a.number - b.number)[0] || null;
  }
  function gradeProgress(stories, grade, records) {
    const group = stories.filter(story => story.grade === grade);
    const completed = group.filter(story => Object.values(progressFlags(records[story.id])).every(Boolean));
    return { total: group.length, completed: completed.length,
      next: group.find(story => !completed.includes(story)) || null };
  }
  window.LearningFlow = { steps, parseRoute, storyHash, progressFlags, nextStory, gradeProgress };
})();
