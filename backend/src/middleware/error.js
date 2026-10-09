export const notFound = (req, res) => res.status(404).json({ error: 'Route not found.' });
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ error: 'That email or phone number is already registered.' });
  if (err.code === '23503' || err.code === '22P02') return res.status(400).json({ error: 'Invalid reference or id.' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Each photo must be under 5 MB.' });
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'You can upload up to 4 photos.' });
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong.' });
};
