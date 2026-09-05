import { Router } from 'express';
import * as copilot from '../controllers/copilot.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { copilotChatSchema } from '../schemas';

const router = Router();
router.use(authenticate);

router.post('/chat', validate(copilotChatSchema), copilot.chat);
router.get('/conversations', copilot.getConversations);
router.get('/conversations/:id', copilot.getConversation);
router.delete('/conversations/:id', copilot.deleteConversation);

export default router;
