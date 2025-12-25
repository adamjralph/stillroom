export type RoomStatus = 'active' | 'paused' | 'expired';

export type CtaType = 'call' | 'email' | 'book';

export interface CTA {
  type: CtaType;
  label: string; // The user-facing button text
  target: string; // Phone number, email address, or URL
}

export interface Asset {
  id: string;
  type: 'image';
  url: string; // Base64 or Blob URL
  order: number;
}

export interface Room {
  id: string; // Random unguessable ID
  clientName: string;
  projectName: string;
  assets: Asset[];
  videoUrl?: string; // Optional embedded video URL (e.g., Loom)
  textBlocks?: string[]; // Optional stacked plain text blocks
  cta: CTA;
  status: RoomStatus;
  createdAt: number; // Timestamp
  expiresAt: number; // Timestamp
}

export interface CreateRoomFormValues {
  clientName: string;
  projectName: string;
  assets: Asset[];
  videoUrl: string;
  textBlocks: { id: string; value: string }[];
  ctaType: CtaType;
  ctaTarget: string;
  expiryDays: number;
}
