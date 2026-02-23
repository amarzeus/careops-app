import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Parse the connection string from .env or use the hardcoded one we found earlier
// postgres://careops_db_h3v3_user:TSIYRqQNNTIrZufrY2qZpVce3vg9TCi8@dpg-d688gher433s73cgaaqg-a.oregon-postgres.render.com/careops_db_h3v3
const connectionString =
  "postgres://careops_db_h3v3_user:TSIYRqQNNTIrZufrY2qZpVce3vg9TCi8@dpg-d688gher433s73cgaaqg-a.oregon-postgres.render.com/careops_db_h3v3?ssl=true";

console.log("🔌 Testing connection to Render PostgreSQL...");
console.log(`Target: dpg-d688gher433s73cgaaqg-a.oregon-postgres.render.com`);

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Render's self-signed/internal certs sometimes, or just standard SSL
  },
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Successfully connected to the database!");

    const res = await client.query("SELECT NOW()");
    console.log("Encrypted response from DB:", res.rows[0]);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed!");
    console.error(err);
    process.exit(1);
  }
}

testConnection();
