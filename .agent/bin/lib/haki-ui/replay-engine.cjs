const { buildProjections, sortEvents } = require("./projections.cjs");

function eventsAtPlayhead(events, playhead) {
  const ordered = sortEvents(events);
  if (playhead == null || playhead >= ordered.length) return ordered;
  return ordered.slice(0, Math.max(0, playhead) + 1);
}

function buildReplayState(events, playhead) {
  const visibleEvents = eventsAtPlayhead(events, playhead);
  return {
    playhead: visibleEvents.length > 0 ? visibleEvents.length - 1 : 0,
    totalEvents: sortEvents(events).length,
    projections: buildProjections(visibleEvents),
  };
}

module.exports = {
  eventsAtPlayhead,
  buildReplayState,
};
