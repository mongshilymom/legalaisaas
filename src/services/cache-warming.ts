import { claudeCache } from '@/services/claude-cache';
import { strategyLogService } from '@/services/strategy-log-service';

interface WarmupPrompt {
  id: string;
  prompt: string;
  systemPrompt?: string;
  metadata: {
    requestType: string;
    contractType?: string;
    language?: string;
    jurisdiction?: string;
    priority: 'high' | 'medium' | 'low';
  };
  schedule?: {
    frequency: 'startup' | 'daily' | 'weekly' | 'on-demand';
    time?: string; // HH:MM format
    lastRun?: Date;
  };
  conditions?: {
    minUserCount?: number;
    minUsageFrequency?: number;
    seasonality?: string[];
  };
}

interface WarmupJob {
  id: string;
  promptId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

interface WarmupStats {
  totalPrompts: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  avgWarmupTime: number;
  cacheHitImprovement: number;
  upcomingJobs: WarmupJob[];
}

class CacheWarmingService {
  private warmupPrompts: Map<string, WarmupPrompt> = new Map();
  private activeJobs: Map<string, WarmupJob> = new Map();
  private jobQueue: WarmupJob[] = [];
  private isProcessing = false;
  private maxConcurrentJobs = 3;

  constructor() {
    this.initializeDefaultPrompts();
    this.startJobProcessor();
    this.schedulePeriodicWarmups();
  }

  private initializeDefaultPrompts(): void {
    // High-priority strategic report prompts
    this.addWarmupPrompt({
      id: 'strategic_report_employment',
      prompt: '근로계약서의 주요 리스크를 분석하고 대응 전략을 제시해주세요.',
      systemPrompt: this.getStrategicReportSystemPrompt(),
      metadata: {
        requestType: 'strategic-report',
        contractType: '근로계약서',
        language: 'ko',
        priority: 'high'
      },
      schedule: {
        frequency: 'daily',
        time: '08:00'
      },
      conditions: {
        minUserCount: 10,
        minUsageFrequency: 5
      }
    });

    this.addWarmupPrompt({
      id: 'strategic_report_service',
      prompt: '용역계약서 분석 결과를 바탕으로 리스크 완화 방안을 제안해주세요.',
      systemPrompt: this.getStrategicReportSystemPrompt(),
      metadata: {
        requestType: 'strategic-report',
        contractType: '용역계약서',
        language: 'ko',
        priority: 'high'
      },
      schedule: {
        frequency: 'daily',
        time: '08:05'
      }
    });

    // Compliance check prompts
    this.addWarmupPrompt({
      id: 'compliance_check_general',
      prompt: '개인정보보호법과 근로기준법 준수 사항을 체크해주세요.',
      metadata: {
        requestType: 'compliance-check',
        language: 'ko',
        priority: 'medium'
      },
      schedule: {
        frequency: 'daily',
        time: '09:00'
      }
    });

    // Multi-language prompts
    this.addWarmupPrompt({
      id: 'strategic_report_en',
      prompt: 'Analyze the key risks in employment contracts and provide strategic recommendations.',
      systemPrompt: this.getStrategicReportSystemPrompt(),
      metadata: {
        requestType: 'strategic-report',
        contractType: 'employment',
        language: 'en',
        jurisdiction: 'US',
        priority: 'medium'
      },
      schedule: {
        frequency: 'weekly',
        time: '10:00'
      }
    });

    // Upselling recommendation prompts
    this.addWarmupPrompt({
      id: 'upsell_basic_to_pro',
      prompt: '기본 플랜 사용자의 이용 패턴을 분석하여 프로페셔널 플랜 업그레이드를 추천해주세요.',
      systemPrompt: this.getUpsellSystemPrompt(),
      metadata: {
        requestType: 'upsell-recommendation',
        language: 'ko',
        priority: 'medium'
      },
      schedule: {
        frequency: 'weekly',
        time: '11:00'
      }
    });

    // Industry-specific prompts
    this.addWarmupPrompt({
      id: 'it_industry_compliance',
      prompt: 'IT 업계의 특수한 컴플라이언스 요구사항을 분석해주세요.',
      metadata: {
        requestType: 'compliance-check',
        language: 'ko',
        priority: 'low'
      },
      schedule: {
        frequency: 'weekly'
      },
      conditions: {
        seasonality: ['Q1', 'Q3'] // Quarterly compliance reviews
      }
    });
  }

  addWarmupPrompt(prompt: WarmupPrompt): void {
    this.warmupPrompts.set(prompt.id, prompt);
    console.log(`Added warmup prompt: ${prompt.id}`);
  }

  removeWarmupPrompt(promptId: string): boolean {
    const removed = this.warmupPrompts.delete(promptId);
    if (removed) {
      console.log(`Removed warmup prompt: ${promptId}`);
    }
    return removed;
  }

  async scheduleWarmup(promptId: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<string> {
    const prompt = this.warmupPrompts.get(promptId);
    if (!prompt) {
      throw new Error(`Warmup prompt not found: ${promptId}`);
    }

    const jobId = this.generateJobId();
    const job: WarmupJob = {
      id: jobId,
      promptId,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    };

    // Insert job based on priority
    if (priority === 'high') {
      this.jobQueue.unshift(job);
    } else {
      this.jobQueue.push(job);
    }

    console.log(`Scheduled warmup job: ${jobId} for prompt: ${promptId}`);
    return jobId;
  }

  async warmupAll(): Promise<void> {
    console.log('Starting comprehensive cache warmup...');
    
    const prompts = Array.from(this.warmupPrompts.values())
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.metadata.priority] - priorityOrder[b.metadata.priority];
      });

    for (const prompt of prompts) {
      if (await this.shouldWarmupPrompt(prompt)) {
        await this.scheduleWarmup(prompt.id, prompt.metadata.priority);
      }
    }
  }

  async warmupByCategory(category: string): Promise<void> {
    const prompts = Array.from(this.warmupPrompts.values())
      .filter(prompt => prompt.metadata.requestType === category);

    for (const prompt of prompts) {
      if (await this.shouldWarmupPrompt(prompt)) {
        await this.scheduleWarmup(prompt.id);
      }
    }

    console.log(`Scheduled warmup for ${prompts.length} prompts in category: ${category}`);
  }

  async warmupForUser(userId: string): Promise<void> {
    // Get user's usage patterns to determine relevant prompts
    const userLogs = await strategyLogService.searchLogs({
      userId,
      limit: 50
    });

    const usagePatterns = this.analyzeUserUsagePatterns(userLogs);
    const relevantPrompts = this.getRelevantPrompts(usagePatterns);

    for (const prompt of relevantPrompts) {
      await this.scheduleWarmup(prompt.id, 'high');
    }

    console.log(`Scheduled personalized warmup for user: ${userId}`);
  }

  private async shouldWarmupPrompt(prompt: WarmupPrompt): Promise<boolean> {
    // Check conditions
    if (prompt.conditions) {
      if (prompt.conditions.minUserCount) {
        // This would require user analytics - simplified for now
        const assumedUserCount = 50; // Replace with actual user count
        if (assumedUserCount < prompt.conditions.minUserCount) {
          return false;
        }
      }

      if (prompt.conditions.seasonality) {
        const currentQuarter = this.getCurrentQuarter();
        if (!prompt.conditions.seasonality.includes(currentQuarter)) {
          return false;
        }
      }
    }

    // Check schedule
    if (prompt.schedule) {
      const now = new Date();
      const lastRun = prompt.schedule.lastRun;

      switch (prompt.schedule.frequency) {
        case 'startup':
          return !lastRun; // Only run once at startup
        case 'daily':
          return !lastRun || this.isNewDay(lastRun, now);
        case 'weekly':
          return !lastRun || this.isNewWeek(lastRun, now);
        case 'on-demand':
          return false; // Only run when explicitly requested
      }
    }

    return true; // Default to warmup if no specific conditions
  }

  private startJobProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.jobQueue.length > 0) {
        await this.processJobQueue();
      }
    }, 2000); // Process every 2 seconds
  }

  private async processJobQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      const concurrentJobs = Math.min(this.maxConcurrentJobs, this.jobQueue.length);
      const jobsToProcess = this.jobQueue.splice(0, concurrentJobs);

      const processPromises = jobsToProcess.map(job => this.processWarmupJob(job));
      await Promise.allSettled(processPromises);
    } catch (error) {
      console.error('Error processing warmup job queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processWarmupJob(job: WarmupJob): Promise<void> {
    const prompt = this.warmupPrompts.get(job.promptId);
    if (!prompt) {
      job.status = 'failed';
      job.error = 'Prompt not found';
      return;
    }

    job.status = 'running';
    job.startTime = new Date();
    this.activeJobs.set(job.id, job);

    try {
      console.log(`Starting warmup job: ${job.id} for prompt: ${job.promptId}`);

      // Generate cache entry
      await claudeCache.generateWithCache(
        prompt.prompt,
        prompt.systemPrompt,
        prompt.metadata,
        {
          forceFresh: false, // Use cache if available
          customTTL: 7 * 24 * 60 * 60 * 1000 // 7 days
        }
      );

      job.status = 'completed';
      job.endTime = new Date();

      // Update schedule last run
      if (prompt.schedule) {
        prompt.schedule.lastRun = new Date();
      }

      console.log(`Completed warmup job: ${job.id}`);
    } catch (error) {
      console.error(`Warmup job failed: ${job.id}`, error);
      
      job.retryCount++;
      if (job.retryCount < job.maxRetries) {
        job.status = 'pending';
        job.error = undefined;
        this.jobQueue.push(job); // Re-queue for retry
      } else {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.endTime = new Date();
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  private analyzeUserUsagePatterns(userLogs: any[]): Record<string, number> {
    const patterns: Record<string, number> = {};

    for (const log of userLogs) {
      const key = `${log.strategyType}_${log.language || 'ko'}`;
      patterns[key] = (patterns[key] || 0) + 1;
    }

    return patterns;
  }

  private getRelevantPrompts(usagePatterns: Record<string, number>): WarmupPrompt[] {
    const relevantPrompts: WarmupPrompt[] = [];

    for (const [pattern, frequency] of Object.entries(usagePatterns)) {
      const [requestType, language] = pattern.split('_');
      
      const matchingPrompts = Array.from(this.warmupPrompts.values())
        .filter(prompt => 
          prompt.metadata.requestType === requestType &&
          prompt.metadata.language === language
        )
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.metadata.priority] - priorityOrder[b.metadata.priority];
        });

      relevantPrompts.push(...matchingPrompts.slice(0, Math.min(2, frequency))); // Limit per pattern
    }

    return relevantPrompts;
  }

  private schedulePeriodicWarmups(): void {
    // Schedule daily warmups
    setInterval(async () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const scheduledPrompts = Array.from(this.warmupPrompts.values())
        .filter(prompt => 
          prompt.schedule?.frequency === 'daily' &&
          prompt.schedule?.time === currentTime
        );

      for (const prompt of scheduledPrompts) {
        if (await this.shouldWarmupPrompt(prompt)) {
          await this.scheduleWarmup(prompt.id);
        }
      }
    }, 60000); // Check every minute

    // Schedule weekly warmups (run on Sundays)
    setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 0) { // Sunday
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const scheduledPrompts = Array.from(this.warmupPrompts.values())
          .filter(prompt => 
            prompt.schedule?.frequency === 'weekly' &&
            (!prompt.schedule?.time || prompt.schedule?.time === currentTime)
          );

        for (const prompt of scheduledPrompts) {
          if (await this.shouldWarmupPrompt(prompt)) {
            await this.scheduleWarmup(prompt.id);
          }
        }
      }
    }, 60000); // Check every minute
  }

  // Utility methods
  private generateJobId(): string {
    return `warmup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isNewDay(lastRun: Date, now: Date): boolean {
    return lastRun.toDateString() !== now.toDateString();
  }

  private isNewWeek(lastRun: Date, now: Date): boolean {
    const lastWeek = this.getWeekNumber(lastRun);
    const currentWeek = this.getWeekNumber(now);
    return lastWeek !== currentWeek;
  }

  private getWeekNumber(date: Date): number {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
  }

  private getCurrentQuarter(): string {
    const month = new Date().getMonth() + 1;
    return `Q${Math.ceil(month / 3)}`;
  }

  private getStrategicReportSystemPrompt(): string {
    return `You are a senior legal strategist providing comprehensive risk analysis and strategic recommendations for contracts.`;
  }

  private getUpsellSystemPrompt(): string {
    return `You are a customer success specialist analyzing user behavior to provide personalized upgrade recommendations.`;
  }

  // Public management methods
  getWarmupStats(): WarmupStats {
    const prompts = Array.from(this.warmupPrompts.values());
    const activeJobs = this.activeJobs.size;
    
    const today = new Date().toDateString();
    const completedToday = Array.from(this.activeJobs.values())
      .filter(job => job.status === 'completed' && job.endTime?.toDateString() === today).length;
    
    const failedToday = Array.from(this.activeJobs.values())
      .filter(job => job.status === 'failed' && job.endTime?.toDateString() === today).length;

    const completedJobs = Array.from(this.activeJobs.values())
      .filter(job => job.status === 'completed' && job.startTime && job.endTime);
    
    const avgWarmupTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => sum + (job.endTime!.getTime() - job.startTime!.getTime()), 0) / completedJobs.length
      : 0;

    const upcomingJobs = this.jobQueue.slice(0, 10); // Next 10 jobs

    return {
      totalPrompts: prompts.length,
      activeJobs,
      completedToday,
      failedToday,
      avgWarmupTime: Math.round(avgWarmupTime),
      cacheHitImprovement: 0, // Would need cache analytics to calculate
      upcomingJobs
    };
  }

  getJobStatus(jobId: string): WarmupJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  cancelJob(jobId: string): boolean {
    const jobIndex = this.jobQueue.findIndex(job => job.id === jobId);
    if (jobIndex !== -1) {
      this.jobQueue.splice(jobIndex, 1);
      console.log(`Cancelled warmup job: ${jobId}`);
      return true;
    }
    return false;
  }

  getPrompts(): WarmupPrompt[] {
    return Array.from(this.warmupPrompts.values());
  }

  updatePromptSchedule(promptId: string, schedule: WarmupPrompt['schedule']): boolean {
    const prompt = this.warmupPrompts.get(promptId);
    if (prompt) {
      prompt.schedule = schedule;
      console.log(`Updated schedule for prompt: ${promptId}`);
      return true;
    }
    return false;
  }
}

export const cacheWarmingService = new CacheWarmingService();
export type { WarmupPrompt, WarmupJob, WarmupStats };
export default CacheWarmingService;