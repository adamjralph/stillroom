// STILLROOM_CREATE_ROOM_VERSION: v-real-405-first-2025-12-26-0906AEST

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

function getBearerToken(request) {
  const h =
    request.headers.get("authorization") ||
    request.headers.get("Authorization") ||
    "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

export default async function createRoom(request) {
  try {
    // ✅ METHOD CHECK FIRST (so GET must be 405, never 401)
    if (request.method !== "POST") {
      return json(405, {
        ok: false,
        message: "Method Not Allowed",
        allow: ["POST"],
      });
    }

    const expected = process.env.STILLROOM_ADMIN_KEY;
    if (!expected) {
      return json(500, {
        ok: false,
        message: "Server misconfigured: STILLROOM_ADMIN_KEY is not set",
      });
    }

    const token = getBearerToken(request);
    if (!token || token !== expected) {
      return json(401, { ok: false, message: "Unauthorized", method: request.method });
    }

    let room;
    try {
      room = await request.json();
    } catch {
      return json(400, { ok: false, message: "Invalid JSON body" });
    }

    const id = crypto.randomUUID();
    const key = `room:${id}`;

    const store = getStore({ name: "stillroom", consistency: "strong" });

    await store.setJSON(key, {
      ...room,
      id,
      createdAt: new Date().toISOString(),
    });

    return json(200, { ok: true, id });
  } catch (err) {
    console.error("createRoom failed", err);
    return json(500, {
      ok: false,
      message: "createRoom failed",
      error: String(err?.message || err),
      name: err?.name,
      stack: err?.stack,
    });
  }
}

