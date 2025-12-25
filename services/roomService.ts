import { Room } from '../types';

const DB_NAME = 'stillroom_db';
const DB_VERSION = 1;
const STORE_NAME = 'rooms';

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Helper to generate a random ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const roomService = {
  getAllRooms: async (): Promise<Room[]> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const rooms = request.result as Room[];
          // Sort desc by createdAt
          resolve(rooms.sort((a, b) => b.createdAt - a.createdAt));
        };
      });
    } catch (error) {
      console.error('Failed to load rooms from DB', error);
      return [];
    }
  },

  getRoomById: async (id: string): Promise<Room | null> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const room = request.result as Room;
          if (!room) {
             resolve(null);
             return;
          }
          
          // Check dynamic expiry
          if (room.status === 'active' && Date.now() > room.expiresAt) {
            resolve({ ...room, status: 'expired' });
          } else {
            resolve(room);
          }
        };
      });
    } catch (error) {
      console.error('Failed to get room', error);
      return null;
    }
  },

  createRoom: async (roomData: Omit<Room, 'id' | 'createdAt' | 'status'>): Promise<Room> => {
    const db = await openDB();
    const newRoom: Room = {
      ...roomData,
      id: generateId(),
      createdAt: Date.now(),
      status: 'active',
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newRoom);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(newRoom);
    });
  },

  deleteRoom: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  },
};