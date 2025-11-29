import express from 'express';
import dotenv from 'dotenv';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Optional: quick DB connection test
pool
  .connect()
  .then((client) => {
    console.log('✅ Connected to Neon PostgreSQL');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Error connecting to DB:', err);
  });

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Helper functions
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function generateCode(length = 6) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Create new short link
app.post('/api/links', async (req, res) => {
  try {
    const { url, code: customCode } = req.body;

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    let code = customCode?.trim();

    // If custom code is provided, validate and check uniqueness
    if (code) {
      if (!isValidCode(code)) {
        return res.status(400).json({
          error: 'Code must be 6–8 characters, letters/numbers only',
        });
      }

      const existing = await pool.query('SELECT 1 FROM links WHERE code = $1', [
        code,
      ]);
      if (existing.rowCount > 0) {
        return res.status(409).json({ error: 'Code already exists' });
      }
    } else {
      // Generate a unique code
      let unique = false;
      while (!unique) {
        const candidate = generateCode(6);
        const existing = await pool.query(
          'SELECT 1 FROM links WHERE code = $1',
          [candidate]
        );
        if (existing.rowCount === 0) {
          code = candidate;
          unique = true;
        }
      }
    }

    // Insert into DB
    const insert = await pool.query(
      `INSERT INTO links (code, target_url)
       VALUES ($1, $2)
       RETURNING code, target_url, total_clicks, last_clicked, created_at`,
      [code, url]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error('Error creating link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all links (with optional search)
app.get('/api/links', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT code, target_url, total_clicks, last_clicked, created_at
      FROM links
    `;
    const values = [];

    if (search) {
      query += ` WHERE code ILIKE $1 OR target_url ILIKE $1`;
      values.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stats for a single short code
app.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT code, target_url, total_clicks, last_clicked, created_at
       FROM links
       WHERE code = $1`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching link stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a short link
app.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query('DELETE FROM links WHERE code = $1', [
      code,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // No content
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== PAGE ROUTES =================== //

// Stats page: serve stats.html for a given code
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    ok: true,
    version: '1.0',
    uptime: process.uptime(),
  });
});

// Redirect route – must be after /api, /code, /healthz
app.get('/:code', async (req, res) => {
  const { code } = req.params;

  // Avoid treating known paths as codes
  if (code === 'api' || code === 'healthz' || code === 'code') {
    return res.status(404).send('Not found');
  }

  try {
    // Find link by code
    const result = await pool.query(
      'SELECT target_url FROM links WHERE code = $1',
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Short link not found');
    }

    const targetUrl = result.rows[0].target_url;

    // Update click count and last_clicked
    await pool.query(
      `UPDATE links
       SET total_clicks = total_clicks + 1,
           last_clicked = NOW()
       WHERE code = $1`,
      [code]
    );

    // Redirect to original URL
    res.redirect(302, targetUrl);
  } catch (err) {
    console.error('Error in redirect route:', err);
    res.status(500).send('Internal server error');
  }
});

// =================== START SERVER =================== //

app.listen(port, () => {
  console.log(`TinyLink server running on http://localhost:${port}`);
});
