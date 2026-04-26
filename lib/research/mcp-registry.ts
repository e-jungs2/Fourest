import { makeId } from "../mock";
import type { McpToolCall, McpToolResult, ResearchToolSlot } from "../types";

type RegistryEntry = {
  serverName?: string;
  toolName?: string;
  endpoint?: string;
  method?: "GET" | "POST";
};

type RegistryConfig = Partial<Record<ResearchToolSlot, RegistryEntry>>;

const defaultSlots: ResearchToolSlot[] = ["map.location", "places.food", "transport.route", "lodging.search"];

export function buildMcpToolCalls(query: string, context: { destination: string; personaId: string; roundIndex: number; turnIndex: number }) {
  return defaultSlots.map((slot) => {
    const entry = getRegistryConfig()[slot];
    return {
      id: makeId("tool_call"),
      slot,
      serverName: entry?.serverName,
      toolName: entry?.toolName,
      query,
      input: {
        query,
        destination: context.destination,
        personaId: context.personaId,
        roundIndex: context.roundIndex,
        turnIndex: context.turnIndex
      }
    } satisfies McpToolCall;
  });
}

export async function runMcpToolCall(call: McpToolCall): Promise<McpToolResult> {
  const entry = getRegistryConfig()[call.slot];
  if (!entry?.endpoint) return mockToolResult(call);

  try {
    const method = entry.method || "POST";
    const response =
      method === "GET"
        ? await fetch(`${entry.endpoint}?query=${encodeURIComponent(call.query)}`)
        : await fetch(entry.endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serverName: entry.serverName, toolName: entry.toolName, input: call.input })
          });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = (await response.json()) as unknown;
    return normalizeExternalResult(call, raw);
  } catch (error) {
    return {
      ...mockToolResult(call),
      ok: false,
      error: error instanceof Error ? error.message : "MCP tool call failed"
    };
  }
}

function getRegistryConfig(): RegistryConfig {
  if (!process.env.MCP_TOOL_REGISTRY_JSON) return {};
  try {
    return JSON.parse(process.env.MCP_TOOL_REGISTRY_JSON) as RegistryConfig;
  } catch {
    return {};
  }
}

function normalizeExternalResult(call: McpToolCall, raw: unknown): McpToolResult {
  const value = raw as { title?: string; summary?: string; url?: string };
  return {
    callId: call.id,
    ok: true,
    title: value.title || labelForSlot(call.slot),
    summary: value.summary || JSON.stringify(raw).slice(0, 500),
    url: value.url,
    raw
  };
}

function mockToolResult(call: McpToolCall): McpToolResult {
  const title = labelForSlot(call.slot);
  const summaries: Record<ResearchToolSlot, string> = {
    "map.location": `${call.query}: keep the route compact and verify the main base around lodging first.`,
    "places.food": `${call.query}: compare reservation-heavy restaurants with lower-wait backup options.`,
    "transport.route": `${call.query}: reduce long morning transfers and group afternoon stops within one area.`,
    "lodging.search": `${call.query}: lodging near a major station or central district improves both rest and mobility.`
  };

  return {
    callId: call.id,
    ok: true,
    title,
    summary: summaries[call.slot],
    url: `mock://${call.slot}/${encodeURIComponent(call.query)}`
  };
}

function labelForSlot(slot: ResearchToolSlot) {
  const labels: Record<ResearchToolSlot, string> = {
    "map.location": "Map location research",
    "places.food": "Food place research",
    "transport.route": "Transport route research",
    "lodging.search": "Lodging research"
  };
  return labels[slot];
}
