export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    version: '1.0',
    uptime: process.uptime(),
  });
}
