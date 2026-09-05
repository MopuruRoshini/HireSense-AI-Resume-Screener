import { Router } from 'express';
import * as jobs from '../controllers/jobs.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createJobSchema, updateJobSchema, analyzeJobSchema } from '../schemas';

const router = Router();
router.use(authenticate);

router.get('/', jobs.getJobs);
router.post('/', validate(createJobSchema), jobs.createJob);
router.post('/analyze', validate(analyzeJobSchema), jobs.analyzeJobDescription);
router.get('/:id', jobs.getJob);
router.put('/:id', validate(updateJobSchema), jobs.updateJob);
router.delete('/:id', jobs.deleteJob);

export default router;
