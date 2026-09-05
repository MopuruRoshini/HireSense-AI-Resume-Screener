"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOnboarding = exports.getMe = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const config_1 = require("../config");
const response_1 = require("../utils/response");
function generateToken(payload, expiresIn = config_1.config.jwtExpiresIn) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn });
}
const register = async (req, res) => {
    const { email, password, firstName, lastName, role, organizationName } = req.body;
    // Check if user exists
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        (0, response_1.sendError)(res, 'An account with this email already exists', 'EMAIL_TAKEN', 409);
        return;
    }
    // Create org first
    const org = await prisma_1.prisma.organization.create({
        data: { name: organizationName },
    });
    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(password, config_1.config.bcryptRounds);
    // Create user
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: role || 'RECRUITER',
            organizationId: org.id,
        },
    });
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || undefined,
    };
    const token = generateToken(tokenPayload);
    const refreshToken = generateToken(tokenPayload, config_1.config.jwtRefreshExpiresIn);
    await prisma_1.prisma.auditLog.create({
        data: {
            userId: user.id,
            action: 'USER_REGISTERED',
            entityType: 'USER',
            entityId: user.id,
        },
    });
    (0, response_1.sendSuccess)(res, {
        token,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            onboardingDone: user.onboardingDone,
        },
        organization: { id: org.id, name: org.name },
    }, 'Account created successfully', 201);
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
        include: { organization: true },
    });
    if (!user || !user.isActive) {
        (0, response_1.sendError)(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
        return;
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid) {
        (0, response_1.sendError)(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
        return;
    }
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || undefined,
    };
    const token = generateToken(tokenPayload);
    const refreshToken = generateToken(tokenPayload, config_1.config.jwtRefreshExpiresIn);
    await prisma_1.prisma.auditLog.create({
        data: { userId: user.id, action: 'USER_LOGGED_IN', entityType: 'USER', entityId: user.id },
    });
    (0, response_1.sendSuccess)(res, {
        token,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            onboardingDone: user.onboardingDone,
            organization: user.organization,
        },
    }, 'Login successful');
};
exports.login = login;
const logout = async (req, res) => {
    if (req.user) {
        await prisma_1.prisma.auditLog.create({
            data: { userId: req.user.userId, action: 'USER_LOGGED_OUT', entityType: 'USER', entityId: req.user.userId },
        }).catch(() => { });
    }
    (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
};
exports.logout = logout;
const refreshToken = async (req, res) => {
    const { refreshToken: token } = req.body;
    if (!token) {
        (0, response_1.sendError)(res, 'Refresh token required', 'MISSING_TOKEN', 400);
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user || !user.isActive) {
            (0, response_1.sendError)(res, 'User not found or inactive', 'INVALID_TOKEN', 401);
            return;
        }
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId || undefined,
        };
        const newToken = generateToken(tokenPayload);
        (0, response_1.sendSuccess)(res, { token: newToken }, 'Token refreshed');
    }
    catch {
        (0, response_1.sendError)(res, 'Invalid or expired refresh token', 'INVALID_TOKEN', 401);
    }
};
exports.refreshToken = refreshToken;
const getMe = async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { organization: true },
    });
    if (!user) {
        (0, response_1.sendError)(res, 'User not found', 'NOT_FOUND', 404);
        return;
    }
    const { passwordHash: _, ...safeUser } = user;
    (0, response_1.sendSuccess)(res, safeUser);
};
exports.getMe = getMe;
const updateOnboarding = async (req, res) => {
    await prisma_1.prisma.user.update({
        where: { id: req.user.userId },
        data: { onboardingDone: true },
    });
    (0, response_1.sendSuccess)(res, { onboardingDone: true }, 'Onboarding completed');
};
exports.updateOnboarding = updateOnboarding;
//# sourceMappingURL=auth.controller.js.map