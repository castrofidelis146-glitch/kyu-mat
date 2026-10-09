import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { require_ } from '../middleware/validate.js';
const r = Router();
r.post('/register', require_('full_name', 'email', 'phone_number', 'password'), register);
r.post('/login', require_('identifier', 'password'), login);
export default r;
