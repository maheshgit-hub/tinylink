import pool from '../../db.js';

export default async function handler(req, res) {
  const {
    query: { code },
    method,
  } = req;

  if (!code) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  if (method === 'GET') {
    // Stats for one code
    try {
      const result = await pool.query(
        `SELECT code, target_url, total_clicks, last_clicked, created_at
         FROM links
         WHERE code = $1`,
        [code]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching link stats:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  if (method === 'DELETE') {
    // Delete short link
    try {
      const result = await pool.query('DELETE FROM links WHERE code = $1', [
        code,
      ]);

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      res.status(204).end();
    } catch (err) {
      console.error('Error deleting link:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, DELETE');
  res.status(405).end('Method Not Allowed');
}
