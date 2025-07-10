import { 
  StrategyLog, 
  StrategyLogCreateRequest, 
  StrategyLogUpdateRequest, 
  StrategyLogSearchRequest,
  StrategyLogAnalytics 
} from '@/types/strategy-log';

class StrategyLogService {
  private logs: Map<string, StrategyLog> = new Map();
  private userLogs: Map<string, string[]> = new Map();

  async createLog(request: StrategyLogCreateRequest): Promise<StrategyLog> {
    const id = this.generateId();
    const now = new Date();
    
    const log: StrategyLog = {
      id,
      userId: request.userId,
      analysisRequestId: request.analysisRequestId,
      strategyType: request.strategyType,
      strategySummary: request.strategySummary,
      fullReport: request.fullReport,
      confidence: request.confidence,
      language: request.language || 'ko',
      jurisdiction: request.jurisdiction,
      createdAt: now,
      updatedAt: now,
      tags: request.tags || [],
      isActive: true,
      metadata: request.metadata || {}
    };

    this.logs.set(id, log);
    
    // Update user logs index
    const userLogIds = this.userLogs.get(request.userId) || [];
    userLogIds.push(id);
    this.userLogs.set(request.userId, userLogIds);

    console.log(`Strategy log created: ${id} for user ${request.userId}`);
    return log;
  }

  async updateLog(request: StrategyLogUpdateRequest): Promise<StrategyLog | null> {
    const log = this.logs.get(request.id);
    if (!log) {
      return null;
    }

    const updatedLog: StrategyLog = {
      ...log,
      strategySummary: request.strategySummary || log.strategySummary,
      fullReport: request.fullReport || log.fullReport,
      confidence: request.confidence || log.confidence,
      tags: request.tags || log.tags,
      metadata: { ...log.metadata, ...request.metadata },
      updatedAt: new Date()
    };

    this.logs.set(request.id, updatedLog);
    console.log(`Strategy log updated: ${request.id}`);
    return updatedLog;
  }

  async getLog(id: string): Promise<StrategyLog | null> {
    return this.logs.get(id) || null;
  }

  async searchLogs(request: StrategyLogSearchRequest): Promise<StrategyLog[]> {
    const userLogIds = this.userLogs.get(request.userId) || [];
    let logs = userLogIds.map(id => this.logs.get(id)).filter(log => log !== undefined) as StrategyLog[];

    // Filter by strategy type
    if (request.strategyType) {
      logs = logs.filter(log => log.strategyType === request.strategyType);
    }

    // Filter by language
    if (request.language) {
      logs = logs.filter(log => log.language === request.language);
    }

    // Filter by jurisdiction
    if (request.jurisdiction) {
      logs = logs.filter(log => log.jurisdiction === request.jurisdiction);
    }

    // Filter by tags
    if (request.tags && request.tags.length > 0) {
      logs = logs.filter(log => 
        request.tags!.some(tag => log.tags.includes(tag))
      );
    }

    // Filter by date range
    if (request.dateFrom) {
      const fromDate = new Date(request.dateFrom);
      logs = logs.filter(log => log.createdAt >= fromDate);
    }

    if (request.dateTo) {
      const toDate = new Date(request.dateTo);
      logs = logs.filter(log => log.createdAt <= toDate);
    }

    // Sort by creation date (newest first)
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = request.offset || 0;
    const limit = request.limit || 50;
    
    return logs.slice(offset, offset + limit);
  }

  async getLogsByAnalysisRequest(analysisRequestId: string): Promise<StrategyLog[]> {
    const allLogs = Array.from(this.logs.values());
    return allLogs.filter(log => log.analysisRequestId === analysisRequestId);
  }

  async getUserLogAnalytics(userId: string): Promise<StrategyLogAnalytics> {
    const userLogIds = this.userLogs.get(userId) || [];
    const logs = userLogIds.map(id => this.logs.get(id)).filter(log => log !== undefined) as StrategyLog[];

    if (logs.length === 0) {
      return {
        totalReports: 0,
        averageConfidence: 0,
        mostUsedLanguage: 'ko',
        topTags: [],
        strategyTypeDistribution: [],
        monthlyTrends: []
      };
    }

    // Calculate analytics
    const totalReports = logs.length;
    const averageConfidence = logs.reduce((sum, log) => sum + log.confidence, 0) / logs.length;
    
    // Most used language
    const languageCount = new Map<string, number>();
    logs.forEach(log => {
      languageCount.set(log.language, (languageCount.get(log.language) || 0) + 1);
    });
    const mostUsedLanguage = Array.from(languageCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'ko';

    // Top tags
    const tagCount = new Map<string, number>();
    logs.forEach(log => {
      log.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    const topTags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Strategy type distribution
    const typeCount = new Map<string, number>();
    logs.forEach(log => {
      typeCount.set(log.strategyType, (typeCount.get(log.strategyType) || 0) + 1);
    });
    const strategyTypeDistribution = Array.from(typeCount.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalReports) * 100)
      }));

    // Monthly trends
    const monthlyCount = new Map<string, { count: number; totalConfidence: number }>();
    logs.forEach(log => {
      const month = log.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyCount.get(month) || { count: 0, totalConfidence: 0 };
      monthlyCount.set(month, {
        count: current.count + 1,
        totalConfidence: current.totalConfidence + log.confidence
      });
    });
    const monthlyTrends = Array.from(monthlyCount.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        count: data.count,
        averageConfidence: Math.round(data.totalConfidence / data.count)
      }));

    return {
      totalReports,
      averageConfidence: Math.round(averageConfidence),
      mostUsedLanguage,
      topTags,
      strategyTypeDistribution,
      monthlyTrends
    };
  }

  async deleteLog(id: string): Promise<boolean> {
    const log = this.logs.get(id);
    if (!log) {
      return false;
    }

    this.logs.delete(id);
    
    // Update user logs index
    const userLogIds = this.userLogs.get(log.userId) || [];
    const updatedUserLogIds = userLogIds.filter(logId => logId !== id);
    this.userLogs.set(log.userId, updatedUserLogIds);

    console.log(`Strategy log deleted: ${id}`);
    return true;
  }

  async deactivateLog(id: string): Promise<boolean> {
    const log = this.logs.get(id);
    if (!log) {
      return false;
    }

    const updatedLog = { ...log, isActive: false, updatedAt: new Date() };
    this.logs.set(id, updatedLog);
    
    console.log(`Strategy log deactivated: ${id}`);
    return true;
  }

  private generateId(): string {
    return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper method to get recent logs for quick access
  async getRecentLogs(userId: string, limit: number = 10): Promise<StrategyLog[]> {
    const userLogIds = this.userLogs.get(userId) || [];
    const logs = userLogIds
      .map(id => this.logs.get(id))
      .filter(log => log !== undefined && log.isActive) as StrategyLog[];

    return logs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Helper method to get strategy log summary for update recommendations
  async getStrategySummaryForUpdate(analysisRequestId: string): Promise<string | null> {
    const logs = await this.getLogsByAnalysisRequest(analysisRequestId);
    if (logs.length === 0) {
      return null;
    }

    // Get the most recent log for this analysis request
    const recentLog = logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return recentLog.strategySummary;
  }
}

export const strategyLogService = new StrategyLogService();
export default StrategyLogService;