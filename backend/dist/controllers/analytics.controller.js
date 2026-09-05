"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIInsights = exports.getAnalytics = void 0;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const getAnalytics = async (req, res) => {
    const { days = '30' } = req.query;
    const orgId = req.user.organizationId;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days, 10));
    const [totalCandidates, totalJobs, shortlisted, hired, avgScore, statusBreakdown, categoryBreakdown, recentApplications, topSkills, skillGaps,] = await Promise.all([
        // Total candidates
        prisma_1.prisma.candidate.count({
            where: { NOT: { firstName: 'Processing' }, createdAt: { gte: since } },
        }),
        // Active jobs
        prisma_1.prisma.job.count({
            where: { status: 'ACTIVE', ...(orgId ? { organizationId: orgId } : {}) },
        }),
        // Shortlisted
        prisma_1.prisma.candidate.count({
            where: { isShortlisted: true, createdAt: { gte: since } },
        }),
        // Hired
        prisma_1.prisma.candidate.count({
            where: { status: 'HIRED', createdAt: { gte: since } },
        }),
        // Average score
        prisma_1.prisma.candidate.aggregate({
            where: { overallScore: { not: null }, createdAt: { gte: since } },
            _avg: { overallScore: true },
        }),
        // Status breakdown
        prisma_1.prisma.candidate.groupBy({
            by: ['status'],
            where: { NOT: { firstName: 'Processing' } },
            _count: { status: true },
        }),
        // Match category breakdown
        prisma_1.prisma.candidate.groupBy({
            by: ['matchCategory'],
            where: { matchCategory: { not: null }, createdAt: { gte: since } },
            _count: { matchCategory: true },
        }),
        // Applications per day (last N days)
        prisma_1.prisma.$queryRaw `
      SELECT DATE(created_at)::text as date, COUNT(*)::text as count
      FROM candidates
      WHERE created_at >= ${since}
        AND first_name != 'Processing'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
        // Top candidate skills
        prisma_1.prisma.candidateSkill.groupBy({
            by: ['skill'],
            where: { isMatched: true },
            _count: { skill: true },
            orderBy: { _count: { skill: 'desc' } },
            take: 15,
        }),
        // Most common missing skills (skill gaps)
        prisma_1.prisma.candidateSkill.groupBy({
            by: ['skill'],
            where: { isMissing: true },
            _count: { skill: true },
            orderBy: { _count: { skill: 'desc' } },
            take: 10,
        }),
    ]);
    const funnelData = [
        { stage: 'Applied', count: totalCandidates },
        { stage: 'Screening', count: statusBreakdown.find((s) => s.status === 'SCREENING')?._count.status || 0 },
        { stage: 'Shortlisted', count: shortlisted },
        { stage: 'Interview', count: statusBreakdown.find((s) => s.status === 'INTERVIEW')?._count.status || 0 },
        { stage: 'Offer', count: statusBreakdown.find((s) => s.status === 'OFFER')?._count.status || 0 },
        { stage: 'Hired', count: hired },
    ];
    (0, response_1.sendSuccess)(res, {
        summary: {
            totalCandidates,
            totalJobs,
            shortlisted,
            hired,
            averageScore: avgScore._avg.overallScore ? Math.round(avgScore._avg.overallScore * 10) / 10 : 0,
            period: `${days} days`,
        },
        funnel: funnelData,
        statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.status })),
        categoryBreakdown: categoryBreakdown.map((c) => ({
            category: c.matchCategory,
            count: c._count.matchCategory,
        })),
        applicationTrend: recentApplications.map((r) => ({
            date: r.date,
            count: parseInt(r.count, 10),
        })),
        topSkills: topSkills.map((s) => ({ skill: s.skill, count: s._count.skill })),
        skillGaps: skillGaps.map((s) => ({ skill: s.skill, count: s._count.skill })),
    });
};
exports.getAnalytics = getAnalytics;
const getAIInsights = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayScreened, excellentToday, topCandidate, trendingSkill] = await Promise.all([
        prisma_1.prisma.candidate.count({ where: { updatedAt: { gte: today }, status: 'SCREENING' } }),
        prisma_1.prisma.candidate.count({ where: { matchCategory: 'EXCELLENT', createdAt: { gte: today } } }),
        prisma_1.prisma.candidate.findFirst({
            where: { overallScore: { not: null }, NOT: { firstName: 'Processing' } },
            orderBy: { overallScore: 'desc' },
            include: { job: { select: { title: true } } },
        }),
        prisma_1.prisma.candidateSkill.groupBy({
            by: ['skill'],
            _count: { skill: true },
            orderBy: { _count: { skill: 'desc' } },
            take: 1,
        }),
    ]);
    const insights = [
        {
            type: 'TALENT_SIGNAL',
            title: 'Talent Signal',
            message: excellentToday > 0
                ? `${excellentToday} excellent-match candidate${excellentToday > 1 ? 's' : ''} detected today.`
                : 'No excellent matches today yet. Keep screening!',
            icon: 'zap',
        },
        {
            type: 'SCREENING_MOMENTUM',
            title: 'Screening Momentum',
            message: todayScreened > 0
                ? `${todayScreened} resume${todayScreened > 1 ? 's' : ''} analyzed today.`
                : 'No screenings today yet. Upload resumes to get started.',
            icon: 'activity',
        },
        {
            type: 'BEST_MATCH',
            title: 'Top Candidate',
            message: topCandidate
                ? `${topCandidate.firstName} ${topCandidate.lastName} leads with ${Math.round(topCandidate.overallScore || 0)}% for ${topCandidate.job.title}.`
                : 'No screened candidates yet.',
            icon: 'star',
        },
        {
            type: 'SKILL_TREND',
            title: 'Skill Trend',
            message: trendingSkill[0]
                ? `${trendingSkill[0].skill} is the most common skill across your candidate pool.`
                : 'Not enough data for skill trends.',
            icon: 'trending-up',
        },
    ];
    (0, response_1.sendSuccess)(res, insights);
};
exports.getAIInsights = getAIInsights;
//# sourceMappingURL=analytics.controller.js.map