import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('Attempting to connect to:', process.env.DATABASE_URL?.split('@')[1] || 'URL not found');

client.connect()
    .then(() => {
        console.log('Successfully connected to the database!');
        return client.query('SELECT NOW()');
    })
    .then(res => {
        console.log('Database time:', res.rows[0].now);
        return client.end();
    })
    .catch(err => {
        console.error('Connection error details:', err);
        console.error('Stack:', err.stack);
        process.exit(1);
    });
