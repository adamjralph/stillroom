// services/roomsApi.ts
import type { Room } from "../types";

const ADMIN_KEY = ((import.meta as any).env?.VITE_STILLROOM_KEY ?? "").trim();

function adminHeaders() {
  if (!ADMIN_KEY) {
    console.warn("VITE_STILLROOM_KEY is empty at runtime.");
  }

  return {
    "content-type": "application/json",
    "accept": "application/json",
    "Authorization": `Bearer ${ADMIN_KEY}`,
    "cache-control": "no-store",
  };
}

async function readBody(res: Response) {
  const text = await res.text();
  try {
    return { text, json: text ? JSON.parse(text) : null };
  } catch {
    return { text, json: null };
  }
}

export async function apiCreateRoom(room: Room): Promise<{ id: string }> {
  const res = await fetch("/.netlify/functions/createRoom", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(room),
  });

  const { text, json } = await readBody(res);

  if (!res.ok) {
    throw new Error(
      `createRoom failed: ${res.status} ${res.statusText}\n` +
      (json ? JSON.stringify(json, null, 2) : text)
    );
  }

  return (json ?? JSON.parse(text)) as { id: string };
}

export async function apiDeleteRoom(id: string): Promise<void> {
  const res = await fetch("/.netlify/functions/deleteRoom", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });

  const { text, json } = await readBody(res);

  if (!res.ok) {
    throw new Error(
      `deleteRoom failed: ${res.status} ${res.statusText}\n` +
      (json ? JSON.stringify(json, null, 2) : text)
    );
  }
}

export async function apiGetRoom(id: string): Promise<Room | null> {
  const res = await fetch(
    `/.netlify/functions/getRoom?id=${encodeURIComponent(id)}`,
    { headers: { "accept": "application/json", "cache-control": "no-store" } }
  );

  if (res.status === 404) return null;

  const { text, json } = await readBody(res);

  if (!res.ok) {
    throw new Error(
      `getRoom failed: ${res.status} ${res.statusText}\n` +
      (json ? JSON.stringify(json, null, 2) : text)
    );
  }

  return (json ?? JSON.parse(text)) as Room;
}

