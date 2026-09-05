import { Response } from 'express';
export declare const sendSuccess: (res: Response, data: unknown, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, message: string, code?: string, statusCode?: number, details?: unknown) => Response<any, Record<string, any>>;
export declare const sendPaginated: (res: Response, data: unknown[], total: number, page: number, limit: number, message?: string) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map