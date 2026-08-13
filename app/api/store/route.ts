import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  const blob = file as File;
  const id = randomUUID();
  const ext = extname(blob.name) || ".png";
  const pathname = `frames/${id}${ext}`;

  try {
    const stored = await put(pathname, blob.stream(), {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: blob.type || "image/png",
    });
    return Response.json({ id, url: stored.url });
  } catch {
    return Response.json({ error: "Storage not configured" }, { status: 503 });
  }
}