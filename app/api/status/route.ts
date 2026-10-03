import { megapromptStats } from "@/lib/megaprompt";
import { engineReady, modelChain } from "@/lib/server/xai";

export const dynamic = "force-dynamic";

export function GET() {
  const ready = engineReady();
  return Response.json(
    {
      ready,
      mode: ready ? "live" : "demo",
      models: ready ? modelChain() : [],
      megaprompt: megapromptStats(),
      version: "1.1.0",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
