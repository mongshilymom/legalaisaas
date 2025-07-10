import { NextApiRequest, NextApiResponse } from 'next';
import { strategyLogService } from '@/services/strategy-log-service';
import { claudeAPI } from '@/services/claude-api';
import { sanitizeInput } from '@/utils/sanitizeInput';
import { 
  StrategyLogCreateRequest, 
  StrategyLogUpdateRequest, 
  StrategyLogSearchRequest 
} from '@/types/strategy-log';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    switch (req.method) {
      case 'POST':
        return await handleCreateLog(req, res);
      case 'GET':
        return await handleGetLogs(req, res);
      case 'PUT':
        return await handleUpdateLog(req, res);
      case 'DELETE':
        return await handleDeleteLog(req, res);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Strategy log API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function handleCreateLog(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const {
    userId,
    analysisRequestId,
    strategyType,
    strategySummary,
    fullReport,
    confidence,
    language,
    jurisdiction,
    tags,
    metadata
  }: StrategyLogCreateRequest = req.body;

  // Validate required fields
  if (!userId || !analysisRequestId || !strategyType || !strategySummary || !fullReport) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  // Sanitize inputs
  const sanitizedUserId = sanitizeInput(userId);
  const sanitizedAnalysisRequestId = sanitizeInput(analysisRequestId);
  const sanitizedStrategySummary = sanitizeInput(strategySummary);

  const createRequest: StrategyLogCreateRequest = {
    userId: sanitizedUserId,
    analysisRequestId: sanitizedAnalysisRequestId,
    strategyType,
    strategySummary: sanitizedStrategySummary,
    fullReport,
    confidence: confidence || 0,
    language: language || 'ko',
    jurisdiction: jurisdiction ? sanitizeInput(jurisdiction) : undefined,
    tags: tags || [],
    metadata: metadata || {}
  };

  const log = await strategyLogService.createLog(createRequest);

  return res.status(201).json({
    success: true,
    data: log
  });
}

async function handleGetLogs(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const {
    userId,
    id,
    analysisRequestId,
    strategyType,
    language,
    jurisdiction,
    tags,
    dateFrom,
    dateTo,
    limit,
    offset,
    action
  } = req.query;

  // Handle specific actions
  if (action === 'analytics' && userId) {
    const analytics = await strategyLogService.getUserLogAnalytics(userId as string);
    return res.status(200).json({
      success: true,
      data: analytics
    });
  }

  if (action === 'recent' && userId) {
    const recentLogs = await strategyLogService.getRecentLogs(
      userId as string,
      parseInt(limit as string) || 10
    );
    return res.status(200).json({
      success: true,
      data: recentLogs
    });
  }

  // Get single log by ID
  if (id) {
    const log = await strategyLogService.getLog(id as string);
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: log
    });
  }

  // Get logs by analysis request ID
  if (analysisRequestId) {
    const logs = await strategyLogService.getLogsByAnalysisRequest(analysisRequestId as string);
    return res.status(200).json({
      success: true,
      data: logs
    });
  }

  // Search logs
  if (userId) {
    const searchRequest: StrategyLogSearchRequest = {
      userId: userId as string,
      strategyType: strategyType as any,
      language: language as string,
      jurisdiction: jurisdiction as string,
      tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const logs = await strategyLogService.searchLogs(searchRequest);
    return res.status(200).json({
      success: true,
      data: logs
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Missing required parameters'
  });
}

async function handleUpdateLog(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const {
    id,
    strategySummary,
    fullReport,
    confidence,
    tags,
    metadata,
    regenerateFromClause
  }: StrategyLogUpdateRequest & { regenerateFromClause?: string } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Missing log ID'
    });
  }

  // Handle regeneration request
  if (regenerateFromClause) {
    const existingLog = await strategyLogService.getLog(id);
    if (!existingLog) {
      return res.status(404).json({
        success: false,
        error: 'Log not found'
      });
    }

    try {
      // Generate updated strategy using Claude API
      const systemPrompt = `
기존 전략 요약을 바탕으로 최신 전략을 업데이트해주세요.
기존 전략의 핵심 내용을 유지하면서 새로운 정보나 변경사항을 반영해주세요.
`;

      const prompt = `
기존 전략 요약:
${existingLog.strategySummary}

업데이트 요청 사항:
${sanitizeInput(regenerateFromClause)}

위 정보를 바탕으로 전략을 업데이트해주세요.
`;

      const response = await claudeAPI.generateWithRetry(prompt, systemPrompt);
      
      const updateRequest: StrategyLogUpdateRequest = {
        id,
        strategySummary: response.content,
        confidence: Math.min(existingLog.confidence + 5, 100), // Slight confidence boost for updates
        metadata: {
          ...existingLog.metadata,
          lastUpdated: new Date().toISOString(),
          updateReason: regenerateFromClause
        }
      };

      const updatedLog = await strategyLogService.updateLog(updateRequest);
      
      return res.status(200).json({
        success: true,
        data: updatedLog
      });
    } catch (error) {
      console.error('Strategy regeneration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to regenerate strategy'
      });
    }
  }

  // Regular update
  const updateRequest: StrategyLogUpdateRequest = {
    id,
    strategySummary: strategySummary ? sanitizeInput(strategySummary) : undefined,
    fullReport,
    confidence,
    tags,
    metadata
  };

  const updatedLog = await strategyLogService.updateLog(updateRequest);
  
  if (!updatedLog) {
    return res.status(404).json({
      success: false,
      error: 'Log not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: updatedLog
  });
}

async function handleDeleteLog(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id, action } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Missing log ID'
    });
  }

  // Handle deactivation instead of deletion
  if (action === 'deactivate') {
    const success = await strategyLogService.deactivateLog(id as string);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Log not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: { message: 'Log deactivated successfully' }
    });
  }

  // Permanent deletion
  const success = await strategyLogService.deleteLog(id as string);
  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'Log not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: { message: 'Log deleted successfully' }
  });
}