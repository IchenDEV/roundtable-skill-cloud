import type { RunRoundtableParams } from "../spec/orchestrator-port";
import type { RoundtableState, StreamEvent } from "../spec/schema";
import { runRoundtableGraph } from "./run-roundtable-graph";
import { runRoundtableDebate } from "./run-roundtable-debate";

export async function* runRoundtableStream(params: RunRoundtableParams): AsyncGenerator<StreamEvent, RoundtableState> {
  if (params.state.mode === "debate") {
    return yield* runRoundtableDebate(params);
  }
  return yield* runRoundtableGraph(params);
}
