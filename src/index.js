import express from 'express';
import path from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';
import cache from 'memory-cache'; // Import memory-cache package
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
const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl || req.url;
  const cachedData = cache.get(key);
  if (cachedData) {
    res.send(cachedData);
    return;
  }res.sendResponse = res.send;
  res.send = (body) => {
    cache.put(key, body); // Cache the response
    res.sendResponse(body);
  };
  next();
};
getPgVersion();
const __dirname = path.resolve();

const app = express();
const port = import.meta.env.PORT || 3001;

app.use(express.json()); // Middleware to parse JSON request bodies

app.get('/api/shoes',cacheMiddleware, async (req, res) => {
  try {
    const data = await sql`SELECT * FROM shoes`; // Use template literals for SQL queries
    res.json(data);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/navbar', cacheMiddleware, async (req, res) => {
  try {
    const response = await sql`SELECT * FROM navbar`;
    res.json(response);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/createuser', cacheMiddleware, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const response = await sql`INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${password})`;
    res.json({ message: 'User created successfully', data: response });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.put('/api/updateuser/:id', cacheMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { name, email, password } = req.body;
  try {
    const response = await sql`UPDATE users SET name = ${name}, email = ${email}, password = ${password} WHERE id = ${userId}`;
    res.json({ message: 'User updated successfully', data: response });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/deleteuser/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const response = await sql`DELETE FROM users WHERE id = ${userId}`;
    res.json({ message: 'User deleted successfully', data: response });
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

export { app };
