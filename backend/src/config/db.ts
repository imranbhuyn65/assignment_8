import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let embedded: MongoMemoryServer | null = null;

// Embedded MongoDB: no installation needed. Data is saved in backend/data (persists across restarts).
async function startEmbedded(): Promise<string> {
  const dbPath = path.resolve(__dirname, '../../data');
  fs.mkdirSync(dbPath, { recursive: true });
  console.log('[MongoDB] Starting embedded database (first run downloads MongoDB once, needs internet)...');
  embedded = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger', port: 27018 },
  });
  return embedded.getUri('diu_academic_portal');
}

export async function connectDB(uri?: string): Promise<void> {
  try {
    if (uri) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log('[MongoDB] Connected to', uri);
        return;
      } catch {
        console.warn('[MongoDB] Could not reach', uri, '- using embedded database instead.');
      }
    }
    await mongoose.connect(await startEmbedded());
    console.log('[MongoDB] Connected to embedded database (backend/data)');
  } catch (err) {
    console.error('[MongoDB] Connection error:', err);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    await mongoose.disconnect();
    if (embedded) await embedded.stop();
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
