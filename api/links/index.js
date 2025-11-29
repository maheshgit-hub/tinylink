import pool from '../../db.js';

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

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // List links (with optional search)
    try {
      const { search } = req.query || {};
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
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching links:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  if (req.method === 'POST') {
    // Create new short link
    try {
      const { url, code: customCode } = req.body || {};

      if (!url || !isValidUrl(url)) {
        res.status(400).json({ error: 'Invalid URL' });
        return;
      }

      let code = customCode?.trim();

      if (code) {
        if (!isValidCode(code)) {
          res.status(400).json({
            error: 'Code must be 6–8 characters, letters/numbers only',
          });
          return;
        }

        const existing = await pool.query(
          'SELECT 1 FROM links WHERE code = $1',
          [code]
        );
        if (existing.rowCount > 0) {
          res.status(409).json({ error: 'Code already exists' });
          return;
        }
      } else {
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
    return;
  }

  // Method not allowed
  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method Not Allowed');
}
