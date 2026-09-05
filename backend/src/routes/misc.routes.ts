import { Router } from 'express';
import * as misc from '../controllers/misc.controller';
import * as analytics from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { analyzeResumeSchema } from '../schemas';

const router = Router();
router.use(authenticate);

// Analytics
router.get('/analytics', analytics.getAnalytics);
router.get('/analytics/insights', analytics.getAIInsights);

// Notifications
router.get('/notifications', misc.getNotifications);
router.put('/notifications/:id/read', misc.markRead);
router.put('/notifications/read-all', misc.markAllRead);

// Resume analyzer
router.post('/resume-analyzer', validate(analyzeResumeSchema), misc.analyzeResumeQuality);

// Audit logs
router.get('/audit-logs', misc.getAuditLogs);

export default router;
