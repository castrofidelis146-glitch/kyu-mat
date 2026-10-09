// Accepts 0712345678, 712345678, +254712345678, 254 712 345 678 (mobile numbers starting 07xx or 01xx).
// Returns '+254712345678', or null if it is not a valid Kenyan mobile number.
export const normalizePhone = (input = '') => {
  const m = String(input).replace(/[\s\-()]/g, '').match(/^(?:\+?254|0)?([17]\d{8})$/);
  return m ? `+254${m[1]}` : null;
};
