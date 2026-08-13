import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  const blob = file as File;
  const id = randomUUID();
  const pathname = `frames/${id}.png`;

  try {
    const stored = await put(pathname, blob.stream(), {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: "image/png",
    });
    return Response.json({ id, url: stored.url });
  } catch {
    return Response.json({ error: "Storage not configured" }, { status: 503 });
  }
}