import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { LlmRuntime } from "./types";

type Msg = { role: "system" | "user" | "assistant"; content: string };

function anthropicMessages(messages: Msg[]): { system: string; msgs: Anthropic.MessageParam[] } {
  const sys: string[] = [];
  const msgs: Anthropic.MessageParam[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      sys.push(m.content);
      continue;
    }
    msgs.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    });
  }
  return { system: sys.join("\n\n").trim(), msgs };
}

export async function* streamChat(
  runtime: LlmRuntime,
  model: string,
  messages: Msg[],
  signal?: AbortSignal
): AsyncGenerator<string> {
  if (runtime.kind === "anthropic") {
    const client = new Anthropic({ apiKey: runtime.apiKey });
    const { system, msgs } = anthropicMessages(messages);
    const stream = await client.messages.stream({
      model,
      max_tokens: 8192,
      ...(system ? { system } : {}),
      messages: msgs,
      ...(signal ? { signal } : {}),
    });
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta" && ev.delta.text) {
        yield ev.delta.text;
      }
    }
    return;
  }

  const client = new OpenAI({ apiKey: runtime.apiKey, baseURL: runtime.baseURL });
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    ...(signal ? { signal } : {}),
  });
  for await (const chunk of stream) {
    const t = chunk.choices[0]?.delta?.content;
    if (t) yield t;
  }
}

export async function chatComplete(
  runtime: LlmRuntime,
  model: string,
  messages: Msg[],
  signal?: AbortSignal
): Promise<string> {
  if (runtime.kind === "anthropic") {
    const client = new Anthropic({ apiKey: runtime.apiKey });
    const { system, msgs } = anthropicMessages(messages);
    const res = await client.messages.create({
      model,
      max_tokens: 8192,
      ...(system ? { system } : {}),
      messages: msgs,
      ...(signal ? { signal } : {}),
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  }

  const client = new OpenAI({ apiKey: runtime.apiKey, baseURL: runtime.baseURL });
  const res = await client.chat.completions.create({ model, messages, ...(signal ? { signal } : {}) });
  return res.choices[0]?.message?.content ?? "";
}
