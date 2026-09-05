import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../schemas';

const router = Router();

router.post('/register', validate(registerSchema), auth.register);
router.post('/login', validate(loginSchema), auth.login);
router.post('/logout', authenticate, auth.logout);
router.post('/refresh', auth.refreshToken);
router.get('/me', authenticate, auth.getMe);
router.patch('/onboarding', authenticate, auth.updateOnboarding);

export default router;
