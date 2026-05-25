export interface AgentQueues {
  steering: string[];
  followUp: string[];
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

/**
 * Parse pi `queue_update` payloads — field names vary by agent version.
 */
export function parseQueueUpdate(payload: Record<string, unknown>): AgentQueues {
  const directSteering = payload.steering ?? payload.steeringQueue;
  const directFollowUp = payload.followUp ?? payload.followUpQueue;
  if (directSteering !== undefined || directFollowUp !== undefined) {
    return {
      steering: asStringArray(directSteering),
      followUp: asStringArray(directFollowUp),
    };
  }

  const queueLength = payload.queueLength;
  if (queueLength && typeof queueLength === "object" && !Array.isArray(queueLength)) {
    const record = queueLength as Record<string, unknown>;
    return {
      steering: asStringArray(record.steering ?? record.steeringQueue),
      followUp: asStringArray(record.followUp ?? record.followUpQueue),
    };
  }

  const queues = payload.queues;
  if (queues && typeof queues === "object" && !Array.isArray(queues)) {
    const record = queues as Record<string, unknown>;
    return {
      steering: asStringArray(record.steering ?? record.steeringQueue),
      followUp: asStringArray(record.followUp ?? record.followUpQueue),
    };
  }

  return { steering: [], followUp: [] };
}

export function parseQueuesFromState(state: Record<string, unknown>): AgentQueues {
  return parseQueueUpdate({
    steering: state.steering ?? state.steeringQueue,
    followUp: state.followUp ?? state.followUpQueue,
    queueLength: state.queueLength,
    queues: state.queues,
  });
}
