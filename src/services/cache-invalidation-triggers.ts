import { claudeCache } from '@/services/claude-cache';
import { strategyLogService } from '@/services/strategy-log-service';

interface InvalidationTrigger {
  id: string;
  name: string;
  description: string;
  conditions: InvalidationCondition[];
  actions: InvalidationAction[];
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

interface InvalidationCondition {
  type: 'content_change' | 'time_based' | 'user_action' | 'system_event' | 'data_update';
  parameters: Record<string, any>;
  threshold?: number;
}

interface InvalidationAction {
  type: 'invalidate_by_tag' | 'invalidate_by_user' | 'invalidate_by_pattern' | 'partial_invalidate' | 'full_clear';
  parameters: Record<string, any>;
  delay?: number; // Delay in milliseconds
}

interface TriggerEvent {
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
}

class CacheInvalidationService {
  private triggers: Map<string, InvalidationTrigger> = new Map();
  private eventQueue: TriggerEvent[] = [];
  private isProcessing = false;

  constructor() {
    this.setupDefaultTriggers();
    this.startEventProcessor();
  }

  private setupDefaultTriggers(): void {
    // Contract analysis invalidation trigger
    this.addTrigger({
      id: 'contract_analysis_update',
      name: 'Contract Analysis Update',
      description: 'Invalidate cache when contract analysis templates are updated',
      conditions: [
        {
          type: 'content_change',
          parameters: {
            entityType: 'contract_template',
            changeType: 'update'
          }
        }
      ],
      actions: [
        {
          type: 'invalidate_by_tag',
          parameters: {
            tags: ['contract-analysis', 'risk-analysis']
          }
        }
      ],
      isActive: true,
      triggerCount: 0
    });

    // Compliance rules update trigger
    this.addTrigger({
      id: 'compliance_rules_update',
      name: 'Compliance Rules Update',
      description: 'Invalidate compliance-related cache when rules are updated',
      conditions: [
        {
          type: 'data_update',
          parameters: {
            dataType: 'compliance_rules',
            regions: ['all']
          }
        }
      ],
      actions: [
        {
          type: 'invalidate_by_tag',
          parameters: {
            tags: ['compliance', 'strategy']
          }
        }
      ],
      isActive: true,
      triggerCount: 0
    });

    // User plan change trigger
    this.addTrigger({
      id: 'user_plan_change',
      name: 'User Plan Change',
      description: 'Invalidate user-specific cache when plan changes',
      conditions: [
        {
          type: 'user_action',
          parameters: {
            actionType: 'plan_change'
          }
        }
      ],
      actions: [
        {
          type: 'invalidate_by_user',
          parameters: {
            clearStrategy: 'user_specific'
          }
        }
      ],
      isActive: true,
      triggerCount: 0
    });

    // Time-based invalidation for strategic reports
    this.addTrigger({
      id: 'strategic_report_time_invalidation',
      name: 'Strategic Report Time Invalidation',
      description: 'Invalidate strategic reports older than 7 days',
      conditions: [
        {
          type: 'time_based',
          parameters: {
            interval: '24h',
            maxAge: '7d'
          },
          threshold: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        }
      ],
      actions: [
        {
          type: 'invalidate_by_tag',
          parameters: {
            tags: ['strategy', 'strategic-report'],
            ageThreshold: 7 * 24 * 60 * 60 * 1000
          }
        }
      ],
      isActive: true,
      triggerCount: 0
    });

    // Legal jurisdiction update trigger
    this.addTrigger({
      id: 'jurisdiction_law_update',
      name: 'Jurisdiction Law Update',
      description: 'Invalidate jurisdiction-specific cache when laws are updated',
      conditions: [
        {
          type: 'system_event',
          parameters: {
            eventType: 'law_update',
            scope: 'jurisdiction'
          }
        }
      ],
      actions: [
        {
          type: 'partial_invalidate',
          parameters: {
            matchCriteria: {
              jurisdiction: 'affected_jurisdiction'
            }
          },
          delay: 300000 // 5 minutes delay to allow for system updates
        }
      ],
      isActive: true,
      triggerCount: 0
    });

    // High usage user cache optimization
    this.addTrigger({
      id: 'high_usage_optimization',
      name: 'High Usage User Optimization',
      description: 'Optimize cache for high-usage users',
      conditions: [
        {
          type: 'user_action',
          parameters: {
            actionType: 'api_request',
            frequency: 'high'
          },
          threshold: 50 // 50 requests per hour
        }
      ],
      actions: [
        {
          type: 'invalidate_by_pattern',
          parameters: {
            pattern: 'old_responses',
            keepRecent: 20,
            userSpecific: true
          }
        }
      ],
      isActive: true,
      triggerCount: 0
    });
  }

  addTrigger(trigger: Omit<InvalidationTrigger, 'lastTriggered' | 'triggerCount'>): void {
    const fullTrigger: InvalidationTrigger = {
      ...trigger,
      triggerCount: 0
    };
    
    this.triggers.set(trigger.id, fullTrigger);
    console.log(`Added invalidation trigger: ${trigger.name}`);
  }

  removeTrigger(triggerId: string): boolean {
    const removed = this.triggers.delete(triggerId);
    if (removed) {
      console.log(`Removed invalidation trigger: ${triggerId}`);
    }
    return removed;
  }

  async triggerEvent(event: TriggerEvent): Promise<void> {
    this.eventQueue.push({
      ...event,
      timestamp: new Date()
    });

    console.log(`Trigger event queued: ${event.type}`);
  }

  private startEventProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        await this.processEventQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  private async processEventQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing invalidation event queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: TriggerEvent): Promise<void> {
    const matchingTriggers = this.findMatchingTriggers(event);

    for (const trigger of matchingTriggers) {
      if (!trigger.isActive) continue;

      try {
        await this.executeTrigger(trigger, event);
        
        trigger.lastTriggered = new Date();
        trigger.triggerCount++;
        
        console.log(`Executed invalidation trigger: ${trigger.name}`);
      } catch (error) {
        console.error(`Error executing trigger ${trigger.name}:`, error);
      }
    }
  }

  private findMatchingTriggers(event: TriggerEvent): InvalidationTrigger[] {
    const matchingTriggers: InvalidationTrigger[] = [];

    for (const trigger of this.triggers.values()) {
      if (this.doesEventMatchTrigger(event, trigger)) {
        matchingTriggers.push(trigger);
      }
    }

    return matchingTriggers;
  }

  private doesEventMatchTrigger(event: TriggerEvent, trigger: InvalidationTrigger): boolean {
    return trigger.conditions.some(condition => {
      switch (condition.type) {
        case 'content_change':
          return this.matchContentChange(event, condition);
        case 'time_based':
          return this.matchTimeBased(event, condition);
        case 'user_action':
          return this.matchUserAction(event, condition);
        case 'system_event':
          return this.matchSystemEvent(event, condition);
        case 'data_update':
          return this.matchDataUpdate(event, condition);
        default:
          return false;
      }
    });
  }

  private matchContentChange(event: TriggerEvent, condition: InvalidationCondition): boolean {
    return event.type === 'content_change' &&
           event.data.entityType === condition.parameters.entityType &&
           (condition.parameters.changeType === 'any' || 
            event.data.changeType === condition.parameters.changeType);
  }

  private matchTimeBased(event: TriggerEvent, condition: InvalidationCondition): boolean {
    return event.type === 'time_check' && 
           condition.threshold !== undefined &&
           (Date.now() - event.timestamp.getTime()) >= condition.threshold;
  }

  private matchUserAction(event: TriggerEvent, condition: InvalidationCondition): boolean {
    if (event.type !== 'user_action') return false;
    
    const actionMatches = event.data.actionType === condition.parameters.actionType;
    
    if (condition.parameters.frequency === 'high' && condition.threshold) {
      const requestCount = event.data.requestCount || 0;
      return actionMatches && requestCount >= condition.threshold;
    }
    
    return actionMatches;
  }

  private matchSystemEvent(event: TriggerEvent, condition: InvalidationCondition): boolean {
    return event.type === 'system_event' &&
           event.data.eventType === condition.parameters.eventType;
  }

  private matchDataUpdate(event: TriggerEvent, condition: InvalidationCondition): boolean {
    return event.type === 'data_update' &&
           event.data.dataType === condition.parameters.dataType;
  }

  private async executeTrigger(trigger: InvalidationTrigger, event: TriggerEvent): Promise<void> {
    for (const action of trigger.actions) {
      if (action.delay) {
        setTimeout(async () => {
          await this.executeAction(action, event);
        }, action.delay);
      } else {
        await this.executeAction(action, event);
      }
    }
  }

  private async executeAction(action: InvalidationAction, event: TriggerEvent): Promise<void> {
    switch (action.type) {
      case 'invalidate_by_tag':
        await this.invalidateByTag(action, event);
        break;
      case 'invalidate_by_user':
        await this.invalidateByUser(action, event);
        break;
      case 'invalidate_by_pattern':
        await this.invalidateByPattern(action, event);
        break;
      case 'partial_invalidate':
        await this.partialInvalidate(action, event);
        break;
      case 'full_clear':
        await this.fullClear(action, event);
        break;
    }
  }

  private async invalidateByTag(action: InvalidationAction, event: TriggerEvent): Promise<void> {
    const tags = action.parameters.tags || [];
    let totalInvalidated = 0;

    for (const tag of tags) {
      const invalidatedCount = await claudeCache.invalidateByTag(tag);
      totalInvalidated += invalidatedCount;
    }

    console.log(`Invalidated ${totalInvalidated} cache entries by tags: ${tags.join(', ')}`);
  }

  private async invalidateByUser(action: InvalidationAction, event: TriggerEvent): Promise<void> {
    const userId = event.data.userId;
    if (!userId) return;

    const invalidatedCount = await claudeCache.invalidateByUser(userId);
    console.log(`Invalidated ${invalidatedCount} cache entries for user: ${userId}`);
  }

  private async invalidateByPattern(action: InvalidationAction, event: TriggerEvent): Promise<void> {
    const pattern = action.parameters.pattern;
    const keepRecent = action.parameters.keepRecent || 10;
    
    // This would require additional implementation in claude-cache service
    console.log(`Pattern invalidation requested: ${pattern}, keeping ${keepRecent} recent entries`);
  }

  private async partialInvalidate(action: InvalidationAction, event: TriggerEvent): Promise<void> {
    const criteria = action.parameters.matchCriteria;
    
    if (criteria.jurisdiction) {
      const jurisdiction = event.data.affectedJurisdiction || criteria.jurisdiction;
      await claudeCache.invalidateByTag(`jurisdiction:${jurisdiction}`);
    }
  }

  private async fullClear(action: InvalidationAction, event: TriggerEvent): Promise<void> {
    claudeCache.clearCache();
    console.log('Full cache clear executed');
  }

  // Convenience methods for common invalidation scenarios
  async invalidateContractAnalysis(contractType?: string): Promise<void> {
    await this.triggerEvent({
      type: 'content_change',
      data: {
        entityType: 'contract_template',
        changeType: 'update',
        contractType
      },
      timestamp: new Date(),
      source: 'manual'
    });
  }

  async invalidateComplianceRules(region?: string): Promise<void> {
    await this.triggerEvent({
      type: 'data_update',
      data: {
        dataType: 'compliance_rules',
        region: region || 'all'
      },
      timestamp: new Date(),
      source: 'manual'
    });
  }

  async invalidateUserCache(userId: string, reason: string): Promise<void> {
    await this.triggerEvent({
      type: 'user_action',
      data: {
        actionType: 'plan_change',
        userId,
        reason
      },
      timestamp: new Date(),
      source: 'manual'
    });
  }

  async invalidateJurisdictionCache(jurisdiction: string): Promise<void> {
    await this.triggerEvent({
      type: 'system_event',
      data: {
        eventType: 'law_update',
        affectedJurisdiction: jurisdiction
      },
      timestamp: new Date(),
      source: 'manual'
    });
  }

  // Trigger management methods
  getTriggers(): InvalidationTrigger[] {
    return Array.from(this.triggers.values());
  }

  getTrigger(triggerId: string): InvalidationTrigger | null {
    return this.triggers.get(triggerId) || null;
  }

  activateTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.isActive = true;
      console.log(`Activated trigger: ${trigger.name}`);
      return true;
    }
    return false;
  }

  deactivateTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.isActive = false;
      console.log(`Deactivated trigger: ${trigger.name}`);
      return true;
    }
    return false;
  }

  getTriggerStats(): Record<string, any> {
    const triggers = Array.from(this.triggers.values());
    const activeTriggers = triggers.filter(t => t.isActive).length;
    const totalTriggers = triggers.length;
    const mostTriggered = triggers
      .sort((a, b) => b.triggerCount - a.triggerCount)
      .slice(0, 5)
      .map(t => ({
        name: t.name,
        count: t.triggerCount,
        lastTriggered: t.lastTriggered
      }));

    return {
      totalTriggers,
      activeTriggers,
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessing,
      mostTriggered
    };
  }

  // Manual trigger for time-based invalidations
  async runTimeBasedInvalidations(): Promise<void> {
    await this.triggerEvent({
      type: 'time_check',
      data: {},
      timestamp: new Date(),
      source: 'scheduled'
    });
  }
}

export const cacheInvalidationService = new CacheInvalidationService();
export type { InvalidationTrigger, InvalidationCondition, InvalidationAction, TriggerEvent };
export default CacheInvalidationService;