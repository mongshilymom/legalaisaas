interface RetryJob {
  id: string;
  type: 'strategic-report' | 'upsell-recommendation' | 'i18n-strategy' | 'strategy-log-update';
  payload: any;
  userId: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  createdAt: Date;
  lastError?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface RetryQueueConfig {
  maxConcurrent: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  cleanupIntervalMs: number;
}

class RetryQueue {
  private jobs: Map<string, RetryJob> = new Map();
  private processing: Set<string> = new Set();
  private config: RetryQueueConfig;
  private isRunning: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(config: Partial<RetryQueueConfig> = {}) {
    this.config = {
      maxConcurrent: 5,
      baseDelay: 1000,
      maxDelay: 300000, // 5 minutes
      backoffMultiplier: 2,
      cleanupIntervalMs: 300000, // 5 minutes
      ...config
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000);

    // Start cleanup process
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);

    console.log('Retry queue started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    console.log('Retry queue stopped');
  }

  async addJob(
    type: RetryJob['type'],
    payload: any,
    userId: string,
    options: {
      priority?: 'low' | 'medium' | 'high';
      maxAttempts?: number;
      delayMs?: number;
    } = {}
  ): Promise<string> {
    const id = this.generateJobId();
    const now = new Date();
    const nextRetryAt = new Date(now.getTime() + (options.delayMs || 0));

    const job: RetryJob = {
      id,
      type,
      payload,
      userId,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      nextRetryAt,
      createdAt: now,
      priority: options.priority || 'medium',
      status: 'pending'
    };

    this.jobs.set(id, job);
    console.log(`Job added to retry queue: ${id} (${type})`);
    return id;
  }

  async getJob(id: string): Promise<RetryJob | null> {
    return this.jobs.get(id) || null;
  }

  async getJobsByUser(userId: string): Promise<RetryJob[]> {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }

  async removeJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) {
      return false;
    }

    this.jobs.delete(id);
    this.processing.delete(id);
    console.log(`Job removed from retry queue: ${id}`);
    return true;
  }

  private async processQueue(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const availableSlots = this.config.maxConcurrent - this.processing.size;
    if (availableSlots <= 0) {
      return;
    }

    const readyJobs = this.getReadyJobs(availableSlots);
    
    for (const job of readyJobs) {
      this.processing.add(job.id);
      job.status = 'processing';
      
      // Process job asynchronously
      this.processJob(job).catch(error => {
        console.error(`Unhandled error processing job ${job.id}:`, error);
      });
    }
  }

  private getReadyJobs(limit: number): RetryJob[] {
    const now = new Date();
    const readyJobs = Array.from(this.jobs.values())
      .filter(job => 
        job.status === 'pending' &&
        job.nextRetryAt <= now &&
        !this.processing.has(job.id)
      )
      .sort((a, b) => {
        // Sort by priority first, then by nextRetryAt
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return a.nextRetryAt.getTime() - b.nextRetryAt.getTime();
      })
      .slice(0, limit);

    return readyJobs;
  }

  private async processJob(job: RetryJob): Promise<void> {
    try {
      job.attempts++;
      console.log(`Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

      const result = await this.executeJob(job);
      
      if (result.success) {
        job.status = 'completed';
        console.log(`Job ${job.id} completed successfully`);
        
        // Remove completed job after a short delay
        setTimeout(() => {
          this.jobs.delete(job.id);
        }, 10000);
      } else {
        await this.handleJobFailure(job, result.error);
      }
    } catch (error) {
      await this.handleJobFailure(job, error);
    } finally {
      this.processing.delete(job.id);
    }
  }

  private async executeJob(job: RetryJob): Promise<{ success: boolean; error?: any }> {
    const { claudeAPI } = await import('@/services/claude-api');
    const { strategyLogService } = await import('@/services/strategy-log-service');

    try {
      switch (job.type) {
        case 'strategic-report':
          return await this.processStrategicReport(job);
        
        case 'upsell-recommendation':
          return await this.processUpsellRecommendation(job);
        
        case 'i18n-strategy':
          return await this.processI18nStrategy(job);
        
        case 'strategy-log-update':
          return await this.processStrategyLogUpdate(job);
        
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
    } catch (error) {
      return { success: false, error };
    }
  }

  private async processStrategicReport(job: RetryJob): Promise<{ success: boolean; error?: any }> {
    const { claudeAPI } = await import('@/services/claude-api');
    
    try {
      const response = await claudeAPI.generateWithRetry(
        job.payload.prompt,
        job.payload.systemPrompt
      );
      
      // Store result in job payload for later retrieval
      job.payload.result = response;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  private async processUpsellRecommendation(job: RetryJob): Promise<{ success: boolean; error?: any }> {
    const { claudeAPI } = await import('@/services/claude-api');
    
    try {
      const response = await claudeAPI.generateWithRetry(
        job.payload.prompt,
        job.payload.systemPrompt
      );
      
      job.payload.result = response;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  private async processI18nStrategy(job: RetryJob): Promise<{ success: boolean; error?: any }> {
    const { claudeAPI } = await import('@/services/claude-api');
    
    try {
      const response = await claudeAPI.generateWithRetry(
        job.payload.prompt,
        job.payload.systemPrompt
      );
      
      job.payload.result = response;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  private async processStrategyLogUpdate(job: RetryJob): Promise<{ success: boolean; error?: any }> {
    const { strategyLogService } = await import('@/services/strategy-log-service');
    
    try {
      const updatedLog = await strategyLogService.updateLog(job.payload.updateRequest);
      
      if (!updatedLog) {
        throw new Error('Failed to update strategy log');
      }
      
      job.payload.result = updatedLog;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  private async handleJobFailure(job: RetryJob, error: any): Promise<void> {
    job.lastError = error?.message || String(error);
    
    if (job.attempts >= job.maxAttempts) {
      job.status = 'failed';
      console.error(`Job ${job.id} failed after ${job.attempts} attempts:`, job.lastError);
    } else {
      job.status = 'pending';
      const delay = Math.min(
        this.config.baseDelay * Math.pow(this.config.backoffMultiplier, job.attempts - 1),
        this.config.maxDelay
      );
      job.nextRetryAt = new Date(Date.now() + delay);
      
      console.warn(`Job ${job.id} failed (attempt ${job.attempts}), retrying in ${delay}ms`);
    }
  }

  private cleanup(): Promise<void> {
    return new Promise((resolve) => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      let cleanedCount = 0;
      for (const [id, job] of this.jobs.entries()) {
        if (
          (job.status === 'completed' || job.status === 'failed') &&
          job.createdAt < cutoff
        ) {
          this.jobs.delete(id);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} old jobs from retry queue`);
      }
      
      resolve();
    });
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for queue management
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }

  async retryFailedJobs(userId?: string): Promise<number> {
    const jobs = Array.from(this.jobs.values()).filter(job => {
      const matchesUser = !userId || job.userId === userId;
      return job.status === 'failed' && matchesUser;
    });

    let retriedCount = 0;
    for (const job of jobs) {
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        job.nextRetryAt = new Date();
        job.lastError = undefined;
        retriedCount++;
      }
    }

    console.log(`Retried ${retriedCount} failed jobs`);
    return retriedCount;
  }
}

export const retryQueue = new RetryQueue();
export default RetryQueue;