export type EngineStatus = { ready: boolean; models: string[] };

export async function getEngineStatus(): Promise<EngineStatus> {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    const j = (await res.json()) as Partial<EngineStatus>;
    return { ready: Boolean(j.ready), models: Array.isArray(j.models) ? j.models : [] };
  } catch {
    return { ready: false, models: [] };
  }
}
