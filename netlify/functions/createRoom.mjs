import { getStore } from "@netlify/blobs";

// Small helper so every response is readable in Network tab.
function json(status, data) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function getBearerToken(request) {
  const h = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

function randomId() {
  // Works in Node 18+ (Netlify Functions runtime). If this throws, we’ll catch and report it.
  return crypto.randomUUID();
}

export default async function createRoom(request, context) {
  const startedAt = new Date().toISOString();

//  try {
//    if (request.method !== "POST") {
//      return json(405, { ok: false, message: "Method Not Allowed", allow: ["POST"] });
//    }
//
//    const expected = process.env.STILLROOM_ADMIN_KEY;
//  return json(200, {
//    ok: false,
//    debug: {
//      expectedLength: expected?.length ?? null,
//      expectedFirst4: expected?.slice(0, 4) ?? null,
//      hasTrailingWhitespace: expected ? expected !== expected.trim() : null,
//    },
//  });


    const expected = process.env.STILLROOM_ADMIN_KEY;
    if (!expected) {
      // This is a very common “500 cause”. Make it explicit.
      return json(500, {
        ok: false,
        message: "Server misconfigured: STILLROOM_ADMIN_KEY is not set",
        at: startedAt,
      });
    }

    const token = getBearerToken(request);
    if (!token || token !== expected) {
      return json(401, { ok: false, message: "Unauthorized" });
    }

    // Parse JSON body
    let room;
    try {
      room = await request.json();
    } catch {
      return json(400, { ok: false, message: "Invalid JSON body" });
    }

    const id = randomId();
    const key = `room:${id}`;

    // Store name can be any string; keep it stable and explicit.
    // Strong consistency helps immediately-read-after-write flows.
    const store = getStore({ name: "stillroom", consistency: "strong" });

    // If you want strictness, validate minimal shape here without adding features.
    // e.g. require room.expiryAt, room.createdAt, room.items etc. (optional)

    await store.setJSON(key, {
      ...room,
      id,
      createdAt: room?.createdAt ?? startedAt,
    });

    return json(200, { ok: true, id });
  } catch (err) {
    // Make the crash visible in the browser AND logs.
    console.error("createRoom failed", err);

    return json(500, {
      ok: false,
      message: "createRoom failed",
      error: String(err?.message || err),
      name: err?.name,
      stack: err?.stack,
      at: startedAt,
    });
  }
}

