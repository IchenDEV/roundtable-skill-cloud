import type { RoundtableState, StreamEvent } from "../spec/schema";
import type { RunRoundtableParams } from "../spec/orchestrator-port";
import { runRoundtableGraph } from "./run-roundtable-graph";

/**
 * 与「多代理逐席」同轨：不再使用单一体代理统摄，保证每席独立 Skill 调用。
 * 保留 deepagent 模式名仅兼容旧 API。
 */
export async function* runRoundtableDeepAgent(
  params: RunRoundtableParams
): AsyncGenerator<StreamEvent, RoundtableState> {
  return yield* runRoundtableGraph(params);
}
