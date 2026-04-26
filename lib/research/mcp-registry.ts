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
    "map.location": `${call.query} 기준으로 핵심 동선을 짧게 잡고 숙소 주변 거점을 먼저 확인해야 합니다.`,
    "places.food": `${call.query}에서는 예약이 필요한 인기 식당과 대기 시간이 짧은 대안을 함께 비교하는 편이 좋습니다.`,
    "transport.route": `${call.query} 이동은 오전 장거리 이동을 줄이고 오후에는 같은 권역 안에서 묶는 방식이 안정적입니다.`,
    "lodging.search": `${call.query} 숙소는 주요 역이나 중심 상권 근처를 잡으면 휴식과 이동 편의가 좋아집니다.`
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
    "map.location": "지도 위치 탐색",
    "places.food": "음식점 탐색",
    "transport.route": "교통편 탐색",
    "lodging.search": "숙소 탐색"
  };
  return labels[slot];
}
