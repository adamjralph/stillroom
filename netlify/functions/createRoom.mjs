// DIAGNOSTIC BUILD: proves which code is deployed + what env is available.
// Remove once confirmed.

function json(status, data) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default async function createRoom(request) {
  const expected = process.env.STILLROOM_ADMIN_KEY;

  return json(200, {
    ok: false,
    diagnostic: "createRoom-env-check-v1",
    method: request.method,
    expectedExists: Boolean(expected),
    expectedLength: expected?.length ?? null,
    expectedFirst4: expected?.slice(0, 4) ?? null,
    hasTrailingWhitespace: expected ? expected !== expected.trim() : null,
    timestamp: new Date().toISOString(),
  });
}

