export const require_ = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => req.body[f] === undefined || req.body[f] === '');
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  next();
};
