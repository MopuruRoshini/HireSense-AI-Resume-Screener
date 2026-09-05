import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
export interface AuthPayload {
    userId: string;
    email: string;
    role: UserRole;
    organizationId?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorize: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map