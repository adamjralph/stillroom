// services/roomsApi.ts
import type { Room } from "../types"; // if your type name differs, change Room to your actual type

const ADMIN_KEY = import.meta.env.VITE_STILLROOM_KEY as string;

function adminHeaders() {
  return {
    "content-type": "application/json",
    "authorization": `Bearer ${ADMIN_KEY}`,
  };
}

export async function apiCreateRoom(room: Room): Promise<{ id: string }> {
  const res = await fetch("/.netlify/functions/createRoom", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(room),
  });

  if (!res.ok) throw new Error("createRoom failed");
  return res.json();
}

export async function apiDeleteRoom(id: string): Promise<void> {
  const res = await fetch("/.netlify/functions/deleteRoom", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });

  if (!res.ok) throw new Error("deleteRoom failed");
}

export async function apiGetRoom(id: string): Promise<Room | null> {
  const res = await fetch(`/.netlify/functions/getRoom?id=${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("getRoom failed");
  return res.json();
}

