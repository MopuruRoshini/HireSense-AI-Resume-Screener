import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as resumes from '../controllers/resumes.controller';

const router = Router();

router.get('/progress/:batchId', authenticate, resumes.streamProgress);

// Multer upload wrapped in a middleware-compatible function
router.post(
  '/upload',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    resumes.uploadMiddleware(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } });
        return;
      }
      next();
    });
  },
  resumes.uploadResumes
);

router.get('/:id', authenticate, resumes.getResume);

export default router;
