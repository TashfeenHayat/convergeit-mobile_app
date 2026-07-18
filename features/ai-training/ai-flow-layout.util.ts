import type { FlowBuilderGraph, FlowBuilderNode } from "./ai-flow-builder.types";

export const FLOW_LAYOUT = {
  gapX: 272,
  gapY: 124,
  originX: 400,
  originY: 72,
  minNodeDistance: 40,
};

function nodeOverlaps(a: FlowBuilderNode, b: FlowBuilderNode): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx < FLOW_LAYOUT.minNodeDistance && dy < FLOW_LAYOUT.minNodeDistance;
}

/** True when nodes share the same spot or sit on top of each other. */
export function flowGraphNeedsAutoLayout(graph: FlowBuilderGraph): boolean {
  const { nodes } = graph;
  if (nodes.length <= 1) return false;

  const atOrigin = nodes.filter((n) => n.x === 0 && n.y === 0).length;
  if (atOrigin >= 2) return true;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodeOverlaps(nodes[i], nodes[j])) return true;
    }
  }
  return false;
}

/** Pick a free spot for a newly added block (avoids stacking on existing nodes). */
export function nextFreeNodePosition(nodes: FlowBuilderNode[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: FLOW_LAYOUT.originX, y: FLOW_LAYOUT.originY };
  }

  const NODE_W = 232;
  const NODE_H = 88;
  const pad = FLOW_LAYOUT.minNodeDistance + 8;

  const overlaps = (x: number, y: number) =>
    nodes.some((n) => Math.abs(n.x - x) < NODE_W - pad && Math.abs(n.y - y) < NODE_H - pad);

  const maxY = Math.max(...nodes.map((n) => n.y));
  let y = maxY + FLOW_LAYOUT.gapY;
  let x = FLOW_LAYOUT.originX;

  for (let attempt = 0; attempt < 24; attempt++) {
    if (!overlaps(x, y)) return { x: Math.round(x), y: Math.round(y) };
    x += FLOW_LAYOUT.gapX / 2;
    if (attempt % 4 === 3) {
      x = FLOW_LAYOUT.originX - FLOW_LAYOUT.gapX;
      y += FLOW_LAYOUT.gapY / 2;
    }
  }

  return {
    x: Math.round(FLOW_LAYOUT.originX + nodes.length * 48),
    y: Math.round(FLOW_LAYOUT.originY + nodes.length * 48),
  };
}

/** Layered top-to-bottom layout from trigger → leaves (no overlapping). */
export function autoLayoutFlowGraph(graph: FlowBuilderGraph): FlowBuilderGraph {
  const { nodes, edges } = graph;
  if (nodes.length === 0) return graph;

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  nodes.forEach((n) => {
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  });
  edges.forEach((e) => {
    outgoing.get(e.from)?.push(e.to);
    incoming.get(e.to)?.push(e.from);
  });

  const roots = nodes.filter((n) => (incoming.get(n.id)?.length ?? 0) === 0);
  const start = roots.find((n) => n.type === "trigger") ?? roots[0];
  if (!start) return graph;

  const depth = new Map<string, number>();
  const queue: string[] = [start.id];
  depth.set(start.id, 0);

  while (queue.length > 0) {
    const id = queue.shift()!;
    const d = depth.get(id) ?? 0;
    for (const to of outgoing.get(id) ?? []) {
      const next = Math.max(depth.get(to) ?? 0, d + 1);
      depth.set(to, next);
      if (!queue.includes(to)) queue.push(to);
    }
  }

  nodes.forEach((n) => {
    if (!depth.has(n.id)) depth.set(n.id, 0);
  });

  const layers = new Map<number, string[]>();
  depth.forEach((d, id) => {
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d)!.push(id);
  });

  const typeOrder: Record<string, number> = {
    greeting: 0,
    kb_search: 1,
    handover: 2,
    fallback: 0,
    llm: 1,
  };

  const positioned: FlowBuilderNode[] = nodes.map((n) => {
    const d = depth.get(n.id) ?? 0;
    const layerIds = [...(layers.get(d) ?? [])].sort((a, b) => {
      const na = nodes.find((x) => x.id === a)!;
      const nb = nodes.find((x) => x.id === b)!;
      const oa = typeOrder[na.type] ?? 5;
      const ob = typeOrder[nb.type] ?? 5;
      if (oa !== ob) return oa - ob;
      return na.label.localeCompare(nb.label);
    });
    const index = layerIds.indexOf(n.id);
    const count = layerIds.length;
    const totalWidth = Math.max(0, count - 1) * FLOW_LAYOUT.gapX;
    const startX = FLOW_LAYOUT.originX - totalWidth / 2;

    return {
      ...n,
      x: Math.round(startX + index * FLOW_LAYOUT.gapX),
      y: Math.round(FLOW_LAYOUT.originY + d * FLOW_LAYOUT.gapY),
    };
  });

  return { nodes: positioned, edges };
}
