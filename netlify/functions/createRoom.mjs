import { getStore } from "@netlify/blobs";

function json(statusCode, data) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isAuthed(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token && token === process.env.STILLROOM_ADMIN_KEY;
}

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!isAuthed(req)) {
    return json(401, { error: "Unauthorised" });
  }

  let room;
  try {
    room = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const store = getStore("stillroom-rooms");
  await store.setJSON(`room:${id}`, {
    ...room,
    id,
    createdAt,
  });

  return json(200, { id });
};

