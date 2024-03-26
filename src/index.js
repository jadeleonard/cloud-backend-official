import express from 'express';
import path from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: 'require',
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

async function getPgVersion() {
  try {
    const result = await sql`select version()`;
    console.log(result);
  } catch (error) {
    console.error('Error fetching PostgreSQL version:', error);
  }
}

getPgVersion();
const __dirname = path.resolve();

const app = express();
const port = 3001;

app.get('/api/shoes', async (req, res) => {
    try {
        const data = await sql`SELECT * FROM shoes`; // Use template literals for SQL queries
        res.json(data);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
