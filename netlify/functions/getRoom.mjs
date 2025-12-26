import { getStore } from "@netlify/blobs";

const VERSION = "v1-get-room";

function json(status, data) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-stillroom-version": VERSION,
    },
  });
}

function normaliseTimestamp(value, fallback) {
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function getRoom(request) {
  if (request.method !== "GET") {
    return json(405, { ok: false, message: "Method Not Allowed", allow: ["GET"] });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return json(400, { ok: false, message: "Missing id" });
  }

  try {
    const store = getStore({ name: "stillroom", consistency: "strong" });
    const key = `room:${id}`;
    const stored = await store.getJSON(key);

    if (!stored) {
      return json(404, { ok: false, message: "Room not found" });
    }

    const createdAt = normaliseTimestamp(stored.createdAt, Date.now());
    const expiresAt = normaliseTimestamp(stored.expiresAt, createdAt);
    const status =
      stored.status === "paused"
        ? "paused"
        : Date.now() > expiresAt
        ? "expired"
        : stored.status || "active";

    const room = {
      ...stored,
      id,
      createdAt,
      expiresAt,
      status,
    };

    return json(200, room);
  } catch (err) {
    console.error("getRoom failed", err);
    return json(500, {
      ok: false,
      message: "getRoom failed",
      error: String(err?.message || err),
    });
  }
}
