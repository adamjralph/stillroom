// STILLROOM_GET_ASSET_VERSION: v-real-405-first-2025-12-26-0906AEST

import { getStore } from "@netlify/blobs";

const VERSION = "v-real-405-first-2025-12-26-0906AEST";

function json(status, data) {
  return new Response(JSON.stringify({ version: VERSION, ...data }, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-stillroom-version": VERSION,
    },
  });
}

export default async function getAsset(request) {
  try {
    if (request.method !== "GET") {
      return json(405, { ok: false, message: "Method Not Allowed", allow: ["GET"] });
    }

    const url = new URL(request.url);
    const roomId = url.searchParams.get("roomId")?.trim();
    const assetId = url.searchParams.get("assetId")?.trim();

    if (!roomId || !assetId) {
      return json(400, { ok: false, message: "Missing roomId or assetId" });
    }

    const key = `${roomId}/${assetId}`;

    const roomStore = getStore({ name: "rooms", consistency: "strong" });
    const assetStore = getStore({ name: "room-assets", consistency: "strong" });

    const [roomRaw, assetRaw] = await Promise.all([roomStore.get(roomId), assetStore.get(key)]);

    if (assetRaw == null) {
      return json(404, { ok: false, message: "Asset not found" });
    }

    let room = roomRaw;
    if (typeof roomRaw === "string") {
      room = JSON.parse(roomRaw);
    } else if (roomRaw instanceof Uint8Array || ArrayBuffer.isView(roomRaw)) {
      room = JSON.parse(new TextDecoder().decode(roomRaw));
    }

    const foundAsset = room?.assets?.find?.((a) => a.id === assetId);
    const contentType = typeof foundAsset?.mime === "string" && foundAsset.mime.trim()
      ? foundAsset.mime.trim()
      : "application/octet-stream";

    let body = assetRaw;
    if (typeof assetRaw === "string") {
      body = Buffer.from(assetRaw, "base64");
    } else if (assetRaw instanceof ArrayBuffer) {
      body = new Uint8Array(assetRaw);
    }

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
        "x-stillroom-version": VERSION,
      },
    });
  } catch (err) {
    console.error("getAsset failed", err);
    return json(500, {
      ok: false,
      message: "getAsset failed",
      error: String(err?.message || err),
      name: err?.name,
      stack: err?.stack,
    });
  }
}
