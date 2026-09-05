import { Router } from 'express';
import * as candidates from '../controllers/candidates.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateCandidateSchema, compareCandidatesSchema, addTagSchema } from '../schemas';

const router = Router();
router.use(authenticate);

router.get('/', candidates.getCandidates);
router.get('/export', candidates.exportCandidates);
router.post('/compare', validate(compareCandidatesSchema), candidates.compareCandidates);
router.get('/:id', candidates.getCandidate);
router.put('/:id', validate(updateCandidateSchema), candidates.updateCandidate);
router.post('/:id/shortlist', candidates.shortlistCandidate);
router.post('/:id/reject', candidates.rejectCandidate);
router.post('/:id/tags', validate(addTagSchema), candidates.addTag);
router.delete('/:id/tags/:tag', candidates.removeTag);

export default router;
