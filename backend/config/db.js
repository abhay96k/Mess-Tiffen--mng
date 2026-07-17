import mongoose from 'mongoose';
import dns from 'dns';

// Configure process-level DNS resolver servers to query Google DNS (8.8.8.8) 
// to bypass local ISP DNS resolution issues with MongoDB Atlas SRV records.
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server configuration failed, falling back to system defaults:', e.message);
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};
