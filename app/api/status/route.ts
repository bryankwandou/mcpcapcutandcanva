export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ready: Boolean(process.env.XAI_API_KEY) });
}
