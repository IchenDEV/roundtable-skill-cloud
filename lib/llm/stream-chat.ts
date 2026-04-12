import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { LlmRuntime } from "./types";

export type Msg = { role: "system" | "user" | "assistant"; content: string };

type ToolSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

type ToolCallResult = {
  input: unknown;
  text: string;
};

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

function parseToolArguments(args: string | null | undefined): unknown {
  if (!args?.trim()) return null;
  try {
    return JSON.parse(args);
  } catch {
    return null;
  }
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

export async function chatToolCall(
  runtime: LlmRuntime,
  model: string,
  messages: Msg[],
  toolName: string,
  inputSchema: ToolSchema,
  description: string,
  signal?: AbortSignal
): Promise<ToolCallResult> {
  if (runtime.kind === "anthropic") {
    const client = new Anthropic({ apiKey: runtime.apiKey });
    const { system, msgs } = anthropicMessages(messages);
    const res = await client.messages.create({
      model,
      max_tokens: 8192,
      ...(system ? { system } : {}),
      messages: msgs,
      tools: [{ name: toolName, description, input_schema: inputSchema }],
      tool_choice: { type: "tool", name: toolName },
      ...(signal ? { signal } : {}),
    });
    const text = res.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    const toolUse = res.content.find((block) => block.type === "tool_use" && block.name === toolName);
    return { input: toolUse && toolUse.type === "tool_use" ? toolUse.input : null, text };
  }

  const client = new OpenAI({ apiKey: runtime.apiKey, baseURL: runtime.baseURL });
  const res = await client.chat.completions.create({
    model,
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: toolName,
          description,
          parameters: inputSchema,
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: toolName },
    },
    ...(signal ? { signal } : {}),
  });
  const message = res.choices[0]?.message;
  const toolCall = message?.tool_calls?.find((call) => call.type === "function" && call.function?.name === toolName);
  const text = typeof message?.content === "string" ? message.content.trim() : "";
  return {
    input: toolCall?.type === "function" ? parseToolArguments(toolCall.function?.arguments) : null,
    text,
  };
}
