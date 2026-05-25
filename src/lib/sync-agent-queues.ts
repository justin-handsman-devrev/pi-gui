import { parseQueuesFromState } from "@/lib/queue-utils";
import { useAgentStore } from "@/stores/agentStore";

export function syncAgentQueuesFromState(state: Record<string, unknown>): void {
  const { steering, followUp } = parseQueuesFromState(state);
  useAgentStore.getState().setQueues(steering, followUp);
}
