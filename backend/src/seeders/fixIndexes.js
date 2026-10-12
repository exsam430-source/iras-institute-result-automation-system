import 'dotenv/config';
import mongoose from 'mongoose';

const fixIndexes = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const db = mongoose.connection.db;

    // ─── DROP USERS COLLECTION ENTIRELY ──────────────────────
    // This removes all indexes including the bad cnic_1
    try {
      await db.collection('users').drop();
      console.log('✅ Dropped users collection entirely');
    } catch (e) {
      console.log('ℹ️  Users collection not found');
    }

    // ─── CLEAR ALL OTHER COLLECTIONS ─────────────────────────
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.collection(col.name).drop();
      console.log(`🗑️  Dropped: ${col.name}`);
    }

    console.log('\n✅ All done! Now run: npm run seed\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixIndexes();