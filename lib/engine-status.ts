export async function getEngineStatus(): Promise<{ ready: boolean }> {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    return (await res.json()) as { ready: boolean };
  } catch {
    return { ready: false };
  }
}
