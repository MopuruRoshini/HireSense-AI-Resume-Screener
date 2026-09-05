import { Request, Response } from 'express';
export declare const uploadMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadResumes: (req: Request, res: Response) => Promise<void>;
export declare const getResume: (req: Request, res: Response) => Promise<void>;
export declare const streamProgress: (req: Request, res: Response) => void;
//# sourceMappingURL=resumes.controller.d.ts.map