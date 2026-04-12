import { runRoundtableGraph } from "./run-roundtable-graph";
import { runRoundtableDebate } from "./run-roundtable-debate";
import type { RunRoundtableParams } from "../spec/orchestrator-port";
import type { StreamEvent, RoundtableState } from "../spec/schema";

export { runSingleTurn } from "./run-single-turn";
export type { SingleTurnParams } from "./run-single-turn";

/**
 * 圆桌流式调度入口。
 * 根据 state.mode 选择「讨论模式（graph）」或「辩论模式（debate）」。
 */
export async function* runRoundtableStream(params: RunRoundtableParams): AsyncGenerator<StreamEvent, RoundtableState> {
  if (params.state.mode === "debate") {
    return yield* runRoundtableDebate(params);
  }
  return yield* runRoundtableGraph(params);
}
