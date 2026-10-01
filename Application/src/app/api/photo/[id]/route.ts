import { prisma } from "@/lib/db";
import { verifyPhotoSig } from "@/lib/photo";

// Photo on file, served only with a valid short-lived signature (F6, PRIV-11).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const exp = Number(url.searchParams.get("e"));
  const sig = url.searchParams.get("s") ?? "";
  if (!verifyPhotoSig(params.id, exp, sig)) return new Response("Expired", { status: 403 });
  const photo = await prisma.photo.findUnique({ where: { identityId: params.id } });
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: { "Content-Type": photo.mime, "Cache-Control": "private, no-store" },
  });
}
