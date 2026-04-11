import type { RunRoundtableParams } from "../spec/orchestrator-port";
import type { RoundtableState, StreamEvent } from "../spec/schema";
import { runRoundtableGraph } from "./run-roundtable-graph";
import { runRoundtableDeepAgent } from "./run-roundtable-deepagent";

export async function* runRoundtableStream(params: RunRoundtableParams): AsyncGenerator<StreamEvent, RoundtableState> {
  const mode = params.mode ?? "graph";
  const stopLike = params.state.userCommand === "stop" || params.state.round >= params.state.maxRounds;

  if (mode === "deepagent" && !stopLike) {
    return yield* runRoundtableDeepAgent(params);
  }
  return yield* runRoundtableGraph(params);
}

export { runRoundtableGraph, runRoundtableDeepAgent };
