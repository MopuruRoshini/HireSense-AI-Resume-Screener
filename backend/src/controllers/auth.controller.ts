import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { config } from '../config';
import { sendSuccess, sendError } from '../utils/response';
import { AuthPayload } from '../middleware/auth.middleware';

function generateToken(payload: AuthPayload, expiresIn: string = config.jwtExpiresIn): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn } as jwt.SignOptions);
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, role, organizationName } = req.body;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    sendError(res, 'An account with this email already exists', 'EMAIL_TAKEN', 409);
    return;
  }

  // Create org first
  const org = await prisma.organization.create({
    data: { name: organizationName },
  });

  // Hash password
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: role || 'RECRUITER',
      organizationId: org.id,
    },
  });

  const tokenPayload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId || undefined,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateToken(tokenPayload, config.jwtRefreshExpiresIn);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
    },
  });

  sendSuccess(res, {
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

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    sendError(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    sendError(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
    return;
  }

  const tokenPayload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId || undefined,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateToken(tokenPayload, config.jwtRefreshExpiresIn);

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'USER_LOGGED_IN', entityType: 'USER', entityId: user.id },
  });

  sendSuccess(res, {
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

export const logout = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: 'USER_LOGGED_OUT', entityType: 'USER', entityId: req.user.userId },
    }).catch(() => {});
  }
  sendSuccess(res, null, 'Logged out successfully');
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) {
    sendError(res, 'Refresh token required', 'MISSING_TOKEN', 400);
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      sendError(res, 'User not found or inactive', 'INVALID_TOKEN', 401);
      return;
    }

    const tokenPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    };

    const newToken = generateToken(tokenPayload);
    sendSuccess(res, { token: newToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Invalid or expired refresh token', 'INVALID_TOKEN', 401);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { organization: true },
  });

  if (!user) {
    sendError(res, 'User not found', 'NOT_FOUND', 404);
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  sendSuccess(res, safeUser);
};

export const updateOnboarding = async (req: Request, res: Response): Promise<void> => {
  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { onboardingDone: true },
  });
  sendSuccess(res, { onboardingDone: true }, 'Onboarding completed');
};
