import pool from '../../db.js';

export default async function handler(req, res) {
  const {
    query: { code },
    method,
  } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  if (!code) {
    res.status(400).send('Code is required');
    return;
  }

  try {
    const result = await pool.query(
      'SELECT target_url FROM links WHERE code = $1',
      [code]
    );

    if (result.rowCount === 0) {
      res.status(404).send('Short link not found');
      return;
    }

    const targetUrl = result.rows[0].target_url;

    await pool.query(
      `UPDATE links
       SET total_clicks = total_clicks + 1,
           last_clicked = NOW()
       WHERE code = $1`,
      [code]
    );

    res.writeHead(302, { Location: targetUrl });
    res.end();
  } catch (err) {
    console.error('Error in redirect:', err);
    res.status(500).send('Internal server error');
  }
}
