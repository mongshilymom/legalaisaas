import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// SEO cache interface
interface SeoMetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  twitterTitle: string;
  twitterDescription: string;
  structuredData: any;
  recommendations: string[];
  score: number;
}

interface CachedSeoItem {
  data: SeoMetaTags;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
  cacheKey: string;
}

interface SeoCacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  averageResponseTime: number;
  mostUsedKeys: Array<{ key: string; count: number; lastAccessed: string }>;
  oldestEntry: string;
  newestEntry: string;
}

// Cache configuration
const SEO_CACHE_CONFIG = {
  // 24 hours default TTL
  defaultTTL: parseInt(process.env.SEO_CACHE_TTL || '86400000'),
  // Maximum cache size (100MB default)
  maxSize: parseInt(process.env.SEO_CACHE_MAX_SIZE || '104857600'),
  // Cache directory
  cacheDir: path.join(process.cwd(), '.cache', 'seo'),
  // Enable compression for entries larger than 1KB
  compressionThreshold: parseInt(process.env.SEO_CACHE_COMPRESSION_THRESHOLD || '1024'),
  // Maximum entries before cleanup
  maxEntries: parseInt(process.env.SEO_CACHE_MAX_ENTRIES || '10000'),
  // Enable cache analytics
  enableAnalytics: process.env.SEO_CACHE_ENABLE_ANALYTICS !== 'false',
};

// Ensure cache directory exists
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(SEO_CACHE_CONFIG.cacheDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create SEO cache directory:', error);
  }
}

// Generate file path for cache key
function getCacheFilePath(cacheKey: string): string {
  const hash = crypto.createHash('sha256').update(cacheKey).digest('hex');
  const subDir = hash.substring(0, 2);
  const fileName = `${hash.substring(2)}.json`;
  return path.join(SEO_CACHE_CONFIG.cacheDir, subDir, fileName);
}

// Ensure subdirectory exists
async function ensureSubDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache subdirectory:', error);
  }
}

// Compress data if needed
function compressData(data: string): Buffer {
  const buffer = Buffer.from(data, 'utf8');
  if (buffer.length > SEO_CACHE_CONFIG.compressionThreshold) {
    const zlib = require('zlib');
    return zlib.gzipSync(buffer);
  }
  return buffer;
}

// Decompress data if needed
function decompressData(buffer: Buffer): string {
  try {
    const zlib = require('zlib');
    // Try to decompress first
    const decompressed = zlib.gunzipSync(buffer);
    return decompressed.toString('utf8');
  } catch (error) {
    // If decompression fails, assume it's not compressed
    return buffer.toString('utf8');
  }
}

// Save SEO data to cache
export async function saveSeoToCache(cacheKey: string, data: SeoMetaTags, ttl?: number): Promise<boolean> {
  try {
    await ensureCacheDir();
    
    const expiresAt = Date.now() + (ttl || SEO_CACHE_CONFIG.defaultTTL);
    const cacheItem: CachedSeoItem = {
      data,
      createdAt: Date.now(),
      expiresAt,
      accessCount: 0,
      lastAccessedAt: Date.now(),
      cacheKey,
    };

    const filePath = getCacheFilePath(cacheKey);
    await ensureSubDir(filePath);

    const jsonData = JSON.stringify(cacheItem, null, 2);
    const compressedData = compressData(jsonData);

    await fs.writeFile(filePath, compressedData);

    console.log('💾 SEO data cached:', {
      key: cacheKey,
      size: compressedData.length,
      expiresIn: Math.round((expiresAt - Date.now()) / 1000 / 60) + 'min',
    });

    // Cleanup old entries if needed
    await cleanupCache();

    return true;
  } catch (error) {
    console.error('❌ Failed to save SEO cache:', error);
    return false;
  }
}

// Get SEO data from cache
export async function getSeoFromCache(cacheKey: string): Promise<SeoMetaTags | null> {
  try {
    const filePath = getCacheFilePath(cacheKey);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return null; // File doesn't exist
    }

    const buffer = await fs.readFile(filePath);
    const jsonData = decompressData(buffer);
    const cacheItem: CachedSeoItem = JSON.parse(jsonData);

    // Check if cache item has expired
    if (Date.now() > cacheItem.expiresAt) {
      console.log('⏰ SEO cache expired for key:', cacheKey);
      await deleteSeoFromCache(cacheKey);
      return null;
    }

    // Update access statistics
    cacheItem.accessCount += 1;
    cacheItem.lastAccessedAt = Date.now();

    // Save updated statistics back to file
    const updatedJsonData = JSON.stringify(cacheItem, null, 2);
    const updatedCompressedData = compressData(updatedJsonData);
    await fs.writeFile(filePath, updatedCompressedData);

    console.log('✅ SEO cache hit:', {
      key: cacheKey,
      accessCount: cacheItem.accessCount,
      age: Math.round((Date.now() - cacheItem.createdAt) / 1000 / 60) + 'min',
    });

    return cacheItem.data;
  } catch (error) {
    console.error('❌ Failed to get SEO cache:', error);
    return null;
  }
}

// Delete SEO data from cache
export async function deleteSeoFromCache(cacheKey: string): Promise<boolean> {
  try {
    const filePath = getCacheFilePath(cacheKey);
    await fs.unlink(filePath);
    console.log('🗑️ SEO cache deleted for key:', cacheKey);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete SEO cache:', error);
    return false;
  }
}

// Clear all SEO cache
export async function clearSeoCache(): Promise<boolean> {
  try {
    await fs.rm(SEO_CACHE_CONFIG.cacheDir, { recursive: true, force: true });
    await ensureCacheDir();
    console.log('🧹 SEO cache cleared completely');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear SEO cache:', error);
    return false;
  }
}

// Get cache statistics
export async function getSeoCacheStats(): Promise<SeoCacheStats> {
  try {
    await ensureCacheDir();
    
    const stats: SeoCacheStats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      averageResponseTime: 0,
      mostUsedKeys: [],
      oldestEntry: '',
      newestEntry: '',
    };

    // Walk through cache directory
    async function walkDir(dirPath: string): Promise<CachedSeoItem[]> {
      const items: CachedSeoItem[] = [];
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            const subItems = await walkDir(fullPath);
            items.push(...subItems);
          } else if (entry.isFile() && entry.name.endsWith('.json')) {
            try {
              const buffer = await fs.readFile(fullPath);
              const jsonData = decompressData(buffer);
              const cacheItem: CachedSeoItem = JSON.parse(jsonData);
              
              // Add file size to item
              const fileStats = await fs.stat(fullPath);
              (cacheItem as any).fileSize = fileStats.size;
              
              items.push(cacheItem);
            } catch (error) {
              console.warn('Failed to read cache file:', fullPath, error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to read cache directory:', dirPath, error);
      }
      
      return items;
    }

    const cacheItems = await walkDir(SEO_CACHE_CONFIG.cacheDir);
    
    // Calculate statistics
    stats.totalEntries = cacheItems.length;
    stats.totalSize = cacheItems.reduce((sum, item) => sum + ((item as any).fileSize || 0), 0);
    
    // Calculate hit rate (simplified - based on access count)
    const totalAccesses = cacheItems.reduce((sum, item) => sum + item.accessCount, 0);
    stats.hitRate = cacheItems.length > 0 ? (totalAccesses / cacheItems.length) : 0;
    
    // Most used keys
    stats.mostUsedKeys = cacheItems
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(item => ({
        key: item.cacheKey.substring(0, 50) + '...',
        count: item.accessCount,
        lastAccessed: new Date(item.lastAccessedAt).toISOString(),
      }));
    
    // Oldest and newest entries
    if (cacheItems.length > 0) {
      const sorted = [...cacheItems].sort((a, b) => a.createdAt - b.createdAt);
      stats.oldestEntry = new Date(sorted[0].createdAt).toISOString();
      stats.newestEntry = new Date(sorted[sorted.length - 1].createdAt).toISOString();
    }

    return stats;
  } catch (error) {
    console.error('❌ Failed to get SEO cache stats:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      averageResponseTime: 0,
      mostUsedKeys: [],
      oldestEntry: '',
      newestEntry: '',
    };
  }
}

// Cleanup old cache entries
export async function cleanupCache(): Promise<void> {
  try {
    const stats = await getSeoCacheStats();
    
    // Check if cleanup is needed
    if (stats.totalEntries < SEO_CACHE_CONFIG.maxEntries && 
        stats.totalSize < SEO_CACHE_CONFIG.maxSize) {
      return;
    }

    console.log('🧹 Starting SEO cache cleanup...', {
      totalEntries: stats.totalEntries,
      totalSize: stats.totalSize,
      maxEntries: SEO_CACHE_CONFIG.maxEntries,
      maxSize: SEO_CACHE_CONFIG.maxSize,
    });

    // Walk through cache and remove expired entries
    async function cleanupDir(dirPath: string): Promise<number> {
      let removedCount = 0;
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            removedCount += await cleanupDir(fullPath);
            
            // Remove empty directories
            try {
              const subEntries = await fs.readdir(fullPath);
              if (subEntries.length === 0) {
                await fs.rmdir(fullPath);
              }
            } catch (error) {
              // Ignore errors when removing directories
            }
          } else if (entry.isFile() && entry.name.endsWith('.json')) {
            try {
              const buffer = await fs.readFile(fullPath);
              const jsonData = decompressData(buffer);
              const cacheItem: CachedSeoItem = JSON.parse(jsonData);
              
              // Remove expired entries
              if (Date.now() > cacheItem.expiresAt) {
                await fs.unlink(fullPath);
                removedCount++;
              }
            } catch (error) {
              // Remove corrupted files
              await fs.unlink(fullPath);
              removedCount++;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to cleanup cache directory:', dirPath, error);
      }
      
      return removedCount;
    }

    const removedCount = await cleanupDir(SEO_CACHE_CONFIG.cacheDir);
    
    console.log('✅ SEO cache cleanup completed:', {
      removedEntries: removedCount,
    });

  } catch (error) {
    console.error('❌ Failed to cleanup SEO cache:', error);
  }
}

// Cache warmup for common SEO requests
export async function warmupSeoCache(): Promise<void> {
  console.log('🔥 SEO cache warmup started...');
  
  // This is a placeholder for cache warmup logic
  // In production, you might want to pre-generate SEO for common pages
  
  const commonPages = [
    { url: '/', title: 'Legal AI SaaS - AI 기반 법률 서비스', language: 'ko' },
    { url: '/pricing', title: 'Pricing - Legal AI SaaS', language: 'ko' },
    { url: '/about', title: 'About Us - Legal AI SaaS', language: 'ko' },
  ];

  console.log('✅ SEO cache warmup completed (placeholder)');
}

// Initialize cache system
export async function initializeSeoCache(): Promise<void> {
  console.log('🚀 Initializing SEO cache system...');
  
  await ensureCacheDir();
  
  // Cleanup expired entries on startup
  await cleanupCache();
  
  // Warmup cache if enabled
  if (process.env.SEO_CACHE_WARMUP_ON_START === 'true') {
    await warmupSeoCache();
  }
  
  console.log('✅ SEO cache system initialized');
}