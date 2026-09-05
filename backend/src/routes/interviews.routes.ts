import { Router } from 'express';
import * as interviews from '../controllers/interviews.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { generateInterviewSchema } from '../schemas';

const router = Router();
router.use(authenticate);

router.post('/generate', validate(generateInterviewSchema), interviews.generateInterviewQuestions);
router.get('/:id', interviews.getInterview);
router.get('/candidate/:candidateId', interviews.getCandidateInterviews);

export default router;
