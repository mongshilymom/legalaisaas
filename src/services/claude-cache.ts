import crypto from 'crypto';
import { claudeAPI, ClaudeResponse } from '@/services/claude-api';

interface CacheEntry {
  id: string;
  key: string;
  prompt: string;
  systemPrompt?: string;
  response: ClaudeResponse;
  metadata: {
    userId?: string;
    requestType: string;
    contractType?: string;
    language?: string;
    jurisdiction?: string;
    version: string;
  };
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  expiresAt: Date;
  tags: string[];
  fingerprint: string;
  compressed: boolean;
  size: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in MB
  compressionThreshold: number; // Compress responses larger than this (bytes)
  enableAnalytics: boolean;
  warmUpPrompts: string[]; // Prompts to pre-cache
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  mostAccessedEntries: Array<{
    key: string;
    accessCount: number;
    lastAccessed: Date;
  }>;
  expirationSummary: {
    expiredCount: number;
    expiringInHour: number;
    expiringInDay: number;
  };
}

class ClaudeCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100, // 100MB
      compressionThreshold: 1024, // 1KB
      enableAnalytics: true,
      warmUpPrompts: [
        '계약서 리스크 분석',
        '컴플라이언스 체크',
        '전략 리포트 생성',
        '업셀링 추천'
      ],
      ...config
    };

    // Start cleanup interval
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Run every hour
  }

  async get(
    prompt: string,
    systemPrompt?: string,
    metadata: Partial<CacheEntry['metadata']> = {}
  ): Promise<ClaudeResponse | null> {
    const key = this.generateCacheKey(prompt, systemPrompt, metadata);
    const entry = this.cache.get(key);

    this.stats.totalRequests++;

    if (entry && !this.isExpired(entry)) {
      // Update access information
      entry.lastAccessedAt = new Date();
      entry.accessCount++;
      
      this.stats.hits++;
      
      console.log(`Cache HIT for key: ${key.substring(0, 16)}...`);
      return this.decompressResponse(entry.response, entry.compressed);
    }

    this.stats.misses++;
    console.log(`Cache MISS for key: ${key.substring(0, 16)}...`);
    return null;
  }

  async set(
    prompt: string,
    response: ClaudeResponse,
    systemPrompt?: string,
    metadata: Partial<CacheEntry['metadata']> = {},
    customTTL?: number
  ): Promise<void> {
    const key = this.generateCacheKey(prompt, systemPrompt, metadata);
    const now = new Date();
    const ttl = customTTL || this.config.defaultTTL;
    
    // Compress response if needed
    const { compressedResponse, compressed } = this.compressResponse(response);
    
    // Calculate size
    const size = this.calculateSize(compressedResponse);
    
    const entry: CacheEntry = {
      id: this.generateEntryId(),
      key,
      prompt: this.truncatePrompt(prompt),
      systemPrompt: systemPrompt ? this.truncatePrompt(systemPrompt) : undefined,
      response: compressedResponse,
      metadata: {
        requestType: 'claude-api',
        version: '1.0',
        ...metadata
      },
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      expiresAt: new Date(now.getTime() + ttl),
      tags: this.generateTags(prompt, metadata),
      fingerprint: this.generateFingerprint(prompt, systemPrompt),
      compressed,
      size
    };

    // Check cache size limits
    await this.ensureCacheSize(size);
    
    this.cache.set(key, entry);
    
    console.log(`Cache SET for key: ${key.substring(0, 16)}... (size: ${size} bytes)`);
  }

  async generateWithCache(
    prompt: string,
    systemPrompt?: string,
    metadata: Partial<CacheEntry['metadata']> = {},
    options: {
      temperature?: number;
      maxTokens?: number;
      forceFresh?: boolean;
      customTTL?: number;
    } = {}
  ): Promise<ClaudeResponse> {
    // Check if we should use cache
    if (!options.forceFresh) {
      const cachedResponse = await this.get(prompt, systemPrompt, metadata);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Generate new response
    const response = await claudeAPI.generateText(
      prompt,
      systemPrompt,
      options.temperature,
      options.maxTokens
    );

    // Cache the response
    await this.set(prompt, response, systemPrompt, metadata, options.customTTL);

    return response;
  }

  private generateCacheKey(
    prompt: string,
    systemPrompt?: string,
    metadata: Partial<CacheEntry['metadata']> = {}
  ): string {
    const content = {
      prompt: this.normalizePrompt(prompt),
      systemPrompt: systemPrompt ? this.normalizePrompt(systemPrompt) : '',
      requestType: metadata.requestType || 'default',
      contractType: metadata.contractType || '',
      language: metadata.language || 'ko',
      jurisdiction: metadata.jurisdiction || '',
      version: metadata.version || '1.0'
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(content))
      .digest('hex');
  }

  private generateFingerprint(prompt: string, systemPrompt?: string): string {
    return crypto
      .createHash('md5')
      .update(`${prompt}${systemPrompt || ''}`)
      .digest('hex')
      .substring(0, 16);
  }

  private generateEntryId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTags(prompt: string, metadata: Partial<CacheEntry['metadata']>): string[] {
    const tags: string[] = [];
    
    // Add metadata-based tags
    if (metadata.contractType) tags.push(`contract:${metadata.contractType}`);
    if (metadata.language) tags.push(`lang:${metadata.language}`);
    if (metadata.jurisdiction) tags.push(`jurisdiction:${metadata.jurisdiction}`);
    if (metadata.requestType) tags.push(`type:${metadata.requestType}`);
    
    // Add content-based tags
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('리스크')) tags.push('risk-analysis');
    if (promptLower.includes('컴플라이언스')) tags.push('compliance');
    if (promptLower.includes('전략')) tags.push('strategy');
    if (promptLower.includes('업셀링')) tags.push('upselling');
    if (promptLower.includes('번역')) tags.push('translation');
    
    return tags;
  }

  private normalizePrompt(prompt: string): string {
    return prompt
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private truncatePrompt(prompt: string, maxLength: number = 500): string {
    return prompt.length > maxLength 
      ? prompt.substring(0, maxLength) + '...'
      : prompt;
  }

  private compressResponse(response: ClaudeResponse): { compressedResponse: ClaudeResponse; compressed: boolean } {
    const responseSize = JSON.stringify(response).length;
    
    if (responseSize > this.config.compressionThreshold) {
      // Simple compression simulation (in real implementation, use actual compression)
      const compressedContent = this.simpleCompress(response.content);
      return {
        compressedResponse: {
          ...response,
          content: compressedContent
        },
        compressed: true
      };
    }
    
    return { compressedResponse: response, compressed: false };
  }

  private decompressResponse(response: ClaudeResponse, compressed: boolean): ClaudeResponse {
    if (compressed) {
      return {
        ...response,
        content: this.simpleDecompress(response.content)
      };
    }
    return response;
  }

  private simpleCompress(content: string): string {
    // Simple compression simulation - replace with actual compression
    return Buffer.from(content, 'utf8').toString('base64');
  }

  private simpleDecompress(content: string): string {
    // Simple decompression simulation - replace with actual decompression
    try {
      return Buffer.from(content, 'base64').toString('utf8');
    } catch {
      return content; // Return as-is if decompression fails
    }
  }

  private calculateSize(response: ClaudeResponse): number {
    return JSON.stringify(response).length;
  }

  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  private async ensureCacheSize(newEntrySize: number): Promise<void> {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    let currentSize = this.getCurrentCacheSize();
    
    if (currentSize + newEntrySize <= maxSizeBytes) {
      return;
    }

    // Remove expired entries first
    this.removeExpiredEntries();
    currentSize = this.getCurrentCacheSize();
    
    if (currentSize + newEntrySize <= maxSizeBytes) {
      return;
    }

    // Remove least recently used entries
    const entries = Array.from(this.cache.values())
      .sort((a, b) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime());
    
    for (const entry of entries) {
      this.cache.delete(entry.key);
      currentSize -= entry.size;
      
      if (currentSize + newEntrySize <= maxSizeBytes) {
        break;
      }
    }
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private removeExpiredEntries(): number {
    const now = new Date();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }

  private cleanup(): void {
    const removedCount = this.removeExpiredEntries();
    
    if (removedCount > 0) {
      console.log(`Cache cleanup: removed ${removedCount} expired entries`);
    }
  }

  // Public cache management methods
  async invalidateByTag(tag: string): Promise<number> {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    console.log(`Invalidated ${invalidatedCount} cache entries with tag: ${tag}`);
    return invalidatedCount;
  }

  async invalidateByUser(userId: string): Promise<number> {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.userId === userId) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    console.log(`Invalidated ${invalidatedCount} cache entries for user: ${userId}`);
    return invalidatedCount;
  }

  async invalidateByFingerprint(fingerprint: string): Promise<boolean> {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.fingerprint === fingerprint) {
        this.cache.delete(key);
        console.log(`Invalidated cache entry with fingerprint: ${fingerprint}`);
        return true;
      }
    }
    return false;
  }

  getCacheStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = new Date();
    const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const totalSize = this.getCurrentCacheSize();
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    const missRate = 100 - hitRate;
    
    const mostAccessedEntries = entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(entry => ({
        key: entry.key.substring(0, 16) + '...',
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessedAt
      }));

    const expiredCount = entries.filter(entry => entry.expiresAt <= now).length;
    const expiringInHour = entries.filter(entry => 
      entry.expiresAt > now && entry.expiresAt <= hourFromNow
    ).length;
    const expiringInDay = entries.filter(entry => 
      entry.expiresAt > hourFromNow && entry.expiresAt <= dayFromNow
    ).length;

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      mostAccessedEntries,
      expirationSummary: {
        expiredCount,
        expiringInHour,
        expiringInDay
      }
    };
  }

  async warmUpCache(): Promise<void> {
    console.log('Starting cache warm-up...');
    
    for (const prompt of this.config.warmUpPrompts) {
      try {
        await this.generateWithCache(prompt, undefined, {
          requestType: 'warmup'
        });
        console.log(`Warmed up cache for prompt: ${prompt.substring(0, 30)}...`);
      } catch (error) {
        console.error(`Failed to warm up cache for prompt: ${prompt}`, error);
      }
    }
    
    console.log('Cache warm-up completed');
  }

  clearCache(): void {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.totalRequests = 0;
    
    console.log(`Cleared ${entriesCount} cache entries`);
  }
}

export const claudeCache = new ClaudeCacheService();
export type { CacheEntry, CacheConfig, CacheStats };
export default ClaudeCacheService;