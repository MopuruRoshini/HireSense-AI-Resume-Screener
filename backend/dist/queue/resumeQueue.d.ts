import { Queue } from 'bullmq';
export interface ResumeProcessingJob {
    resumeId: string;
    candidateId: string;
    jobId: string;
    filePath: string;
    mimeType: string;
    batchId?: string;
    totalInBatch?: number;
    indexInBatch?: number;
}
export declare const sseClients: Map<string, Set<(data: string) => void>>;
export declare function getResumeQueue(): Queue | null;
export declare function queueResume(data: ResumeProcessingJob): Promise<void>;
export declare function processResume(data: ResumeProcessingJob): Promise<void>;
export declare function startResumeWorker(): void;
export declare function stopQueues(): Promise<void>;
//# sourceMappingURL=resumeQueue.d.ts.map