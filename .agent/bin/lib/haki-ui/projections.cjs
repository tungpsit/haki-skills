function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (a.timestamp === b.timestamp) {
      return String(a.id).localeCompare(String(b.id));
    }
    return String(a.timestamp).localeCompare(String(b.timestamp));
  });
}

function buildGraphProjection(events) {
  const nodes = new Map();
  const edges = new Map();
  let previous = null;

  for (const event of sortEvents(events)) {
    const nodeId = `${event.entityType}:${event.entityId}`;
    if (!nodes.has(nodeId)) {
      nodes.set(nodeId, {
        id: nodeId,
        entityType: event.entityType,
        entityId: event.entityId,
        phase: event.phase || null,
        status: event.status || null,
        label: event.payload?.taskTitle || event.payload?.workflowName || event.entityId,
        lastEventType: event.type,
        count: 0,
      });
    }

    const node = nodes.get(nodeId);
    node.phase = event.phase || node.phase;
    node.status = event.status || node.status;
    node.lastEventType = event.type;
    node.count += 1;

    if (previous) {
      const edgeId = `${previous}->${nodeId}`;
      if (!edges.has(edgeId)) {
        edges.set(edgeId, { id: edgeId, from: previous, to: nodeId, count: 0 });
      }
      edges.get(edgeId).count += 1;
    }

    previous = nodeId;
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    activeNodeId: previous,
  };
}

function buildStageProjection(events) {
  const lanes = new Map();

  for (const event of sortEvents(events)) {
    const phase = event.phase || "unassigned";
    if (!lanes.has(phase)) {
      lanes.set(phase, {
        id: phase,
        phase,
        total: 0,
        statuses: {},
        latestEventType: null,
      });
    }

    const lane = lanes.get(phase);
    lane.total += 1;
    lane.latestEventType = event.type;
    if (event.status) {
      lane.statuses[event.status] = (lane.statuses[event.status] || 0) + 1;
    }
  }

  return {
    lanes: Array.from(lanes.values()),
  };
}

function buildTimelineProjection(events) {
  const ordered = sortEvents(events);
  return {
    events: ordered.map((event, index) => ({
      index,
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      phase: event.phase || null,
      status: event.status || null,
      entityId: event.entityId,
      entityType: event.entityType,
    })),
    playhead: ordered.length > 0 ? ordered.length - 1 : 0,
  };
}

function buildProjections(events) {
  return {
    graph: buildGraphProjection(events),
    stage: buildStageProjection(events),
    timeline: buildTimelineProjection(events),
  };
}

module.exports = {
  sortEvents,
  buildGraphProjection,
  buildStageProjection,
  buildTimelineProjection,
  buildProjections,
};
