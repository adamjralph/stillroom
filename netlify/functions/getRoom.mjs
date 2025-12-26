// STILLROOM_GET_ROOM_VERSION: v-real-405-first-2025-12-26-0906AEST-BUMP1

import { getStore } from "@netlify/blobs";

const VERSION = "v-real-405-first-2025-12-26-0906AEST-BUMP1";

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

export default async function getRoom(request) {
  try {
    if (request.method !== "GET") {
      return json(405, { ok: false, message: "Method Not Allowed", allow: ["GET"] });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();
    if (!id) {
      return json(400, { ok: false, message: "Missing id" });
    }

    const store = getStore({ name: "rooms", consistency: "strong" });
    const raw = await store.get(id);

    if (raw == null) {
      return json(404, { ok: false, message: "Room not found" });
    }

    let room = raw;
    if (typeof raw === "string") {
      room = JSON.parse(raw);
    } else if (raw instanceof Uint8Array || ArrayBuffer.isView(raw)) {
      room = JSON.parse(new TextDecoder().decode(raw));
    }

    return json(200, { ok: true, room });
  } catch (err) {
    console.error("getRoom failed", err);
    return json(500, {
      ok: false,
      message: "getRoom failed",
      error: String(err?.message || err),
      name: err?.name,
      stack: err?.stack,
    });
  }
}
