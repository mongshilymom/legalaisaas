import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// SEO Registry interfaces
export interface SeoMetaData {
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

export interface SeoRegistryEntry {
  id: string;
  url: string;
  category: string;
  language: string;
  industry: string;
  seoData: SeoMetaData;
  blogContent?: string;
  createdAt: string;
  updatedAt: string;
  status: 'success' | 'error';
  error?: string;
}

export interface SeoRegistryFilter {
  category?: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'success' | 'error';
}

// Configuration
const SEO_REGISTRY_CONFIG = {
  metaDir: path.join(process.cwd(), 'data', 'seo-meta'),
  blogsDir: path.join(process.cwd(), 'data', 'seo-blogs'),
  registryFile: path.join(process.cwd(), 'data', 'seo-registry.json'),
};

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  try {
    await fs.mkdir(SEO_REGISTRY_CONFIG.metaDir, { recursive: true });
    await fs.mkdir(SEO_REGISTRY_CONFIG.blogsDir, { recursive: true });
    await fs.mkdir(path.dirname(SEO_REGISTRY_CONFIG.registryFile), { recursive: true });
  } catch (error) {
    console.error('Failed to create SEO registry directories:', error);
  }
}

// Generate file names
function generateFileName(url: string, language: string, extension: string): string {
  // Extract page name from URL
  let pageName;
  try {
    const urlObj = new URL(url);
    pageName = urlObj.pathname.split('/').filter(p => p).pop() || 'index';
    // Remove file extensions
    pageName = pageName.split('.')[0];
  } catch (error) {
    // Fallback to hash if URL parsing fails
    pageName = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  }
  
  // Sanitize filename
  pageName = pageName.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase();
  
  return `${pageName}.${language}.${extension}`;
}

// Save SEO meta data as JSON
export async function saveSeoMeta(
  url: string,
  language: string,
  category: string,
  seoData: SeoMetaData
): Promise<string> {
  await ensureDirectories();
  
  const fileName = generateFileName(url, language, 'json');
  const filePath = path.join(SEO_REGISTRY_CONFIG.metaDir, fileName);
  
  const metaFile = {
    url,
    category,
    language,
    ...seoData,
    timestamp: new Date().toISOString(),
    generatedBy: 'Legal AI SaaS SEO System',
  };
  
  await fs.writeFile(filePath, JSON.stringify(metaFile, null, 2), 'utf8');
  
  console.log('💾 SEO meta saved:', fileName);
  return fileName;
}

// Generate and save blog content
export async function generateBlogContent(
  url: string,
  language: string,
  seoData: SeoMetaData
): Promise<string> {
  const languageNames = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    zh: '中文'
  };

  const blogTemplate = `---
title: "${seoData.title}"
description: "${seoData.description}"
keywords: [${seoData.keywords.map(k => `"${k}"`).join(', ')}]
language: "${language}"
url: "${url}"
date: "${new Date().toISOString().split('T')[0]}"
author: "Legal AI SaaS"
category: "SEO Generated Content"
ogImage: "${seoData.ogImage || '/og/default.png'}"
---

# ${seoData.title}

${seoData.description}

## 주요 특징

${seoData.keywords.map(keyword => `- **${keyword}**: AI 기반 최적화로 더 나은 결과를 제공합니다.`).join('\n')}

## SEO 최적화 점수

이 페이지는 **${seoData.score}/100**의 SEO 점수를 달성했습니다.

### 개선 권장사항

${seoData.recommendations.map(rec => `- ${rec}`).join('\n')}

## 구조화된 데이터

이 페이지는 검색 엔진 최적화를 위한 구조화된 데이터를 포함하고 있습니다:

\`\`\`json
${JSON.stringify(seoData.structuredData, null, 2)}
\`\`\`

## 소셜 미디어 최적화

- **Open Graph 제목**: ${seoData.ogTitle}
- **Open Graph 설명**: ${seoData.ogDescription}
- **Twitter 제목**: ${seoData.twitterTitle}
- **Twitter 설명**: ${seoData.twitterDescription}

## 언어 및 현지화

이 콘텐츠는 **${languageNames[language as keyof typeof languageNames]}**로 최적화되었습니다.

---

*이 콘텐츠는 Legal AI SaaS의 AI 기반 SEO 시스템에 의해 자동 생성되었습니다.*
*생성일시: ${new Date().toLocaleString('ko-KR')}*
*원본 URL: [${url}](${url})*
`;

  const fileName = generateFileName(url, language, 'md');
  const filePath = path.join(SEO_REGISTRY_CONFIG.blogsDir, fileName);
  
  await fs.writeFile(filePath, blogTemplate, 'utf8');
  
  console.log('📝 Blog content saved:', fileName);
  return blogTemplate;
}

// Save registry entry
export async function saveRegistryEntry(entry: Omit<SeoRegistryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<SeoRegistryEntry> {
  await ensureDirectories();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const registryEntry: SeoRegistryEntry = {
    id,
    createdAt: now,
    updatedAt: now,
    ...entry,
  };
  
  // Load existing registry
  let registry: SeoRegistryEntry[] = [];
  try {
    const registryData = await fs.readFile(SEO_REGISTRY_CONFIG.registryFile, 'utf8');
    registry = JSON.parse(registryData);
  } catch (error) {
    // File doesn't exist yet, start with empty array
    console.log('Creating new SEO registry file');
  }
  
  // Add new entry
  registry.unshift(registryEntry); // Add to beginning for newest first
  
  // Limit to 1000 entries to prevent file from growing too large
  if (registry.length > 1000) {
    registry = registry.slice(0, 1000);
  }
  
  // Save updated registry
  await fs.writeFile(SEO_REGISTRY_CONFIG.registryFile, JSON.stringify(registry, null, 2), 'utf8');
  
  console.log('📋 Registry entry saved:', id);
  return registryEntry;
}

// Load registry entries with filtering
export async function loadRegistryEntries(filter?: SeoRegistryFilter): Promise<SeoRegistryEntry[]> {
  try {
    const registryData = await fs.readFile(SEO_REGISTRY_CONFIG.registryFile, 'utf8');
    let registry: SeoRegistryEntry[] = JSON.parse(registryData);
    
    // Apply filters
    if (filter) {
      if (filter.category) {
        registry = registry.filter(entry => entry.category === filter.category);
      }
      
      if (filter.language) {
        registry = registry.filter(entry => entry.language === filter.language);
      }
      
      if (filter.status) {
        registry = registry.filter(entry => entry.status === filter.status);
      }
      
      if (filter.dateFrom) {
        const fromDate = new Date(filter.dateFrom);
        registry = registry.filter(entry => new Date(entry.createdAt) >= fromDate);
      }
      
      if (filter.dateTo) {
        const toDate = new Date(filter.dateTo);
        registry = registry.filter(entry => new Date(entry.createdAt) <= toDate);
      }
    }
    
    return registry;
  } catch (error) {
    console.error('Failed to load registry entries:', error);
    return [];
  }
}

// Get registry statistics
export async function getRegistryStats(): Promise<{
  totalEntries: number;
  categoryCounts: Record<string, number>;
  languageCounts: Record<string, number>;
  averageScore: number;
  statusCounts: Record<string, number>;
  recentEntries: SeoRegistryEntry[];
}> {
  const entries = await loadRegistryEntries();
  
  const categoryCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  let totalScore = 0;
  let scoreCount = 0;
  
  entries.forEach(entry => {
    // Category counts
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    
    // Language counts
    languageCounts[entry.language] = (languageCounts[entry.language] || 0) + 1;
    
    // Status counts
    statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
    
    // Average score calculation
    if (entry.status === 'success' && entry.seoData.score) {
      totalScore += entry.seoData.score;
      scoreCount++;
    }
  });
  
  return {
    totalEntries: entries.length,
    categoryCounts,
    languageCounts,
    statusCounts,
    averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    recentEntries: entries.slice(0, 10), // Most recent 10 entries
  };
}

// Update registry entry
export async function updateRegistryEntry(id: string, updates: Partial<SeoRegistryEntry>): Promise<SeoRegistryEntry | null> {
  try {
    const registryData = await fs.readFile(SEO_REGISTRY_CONFIG.registryFile, 'utf8');
    const registry: SeoRegistryEntry[] = JSON.parse(registryData);
    
    const entryIndex = registry.findIndex(entry => entry.id === id);
    if (entryIndex === -1) {
      return null;
    }
    
    // Update entry
    registry[entryIndex] = {
      ...registry[entryIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Save updated registry
    await fs.writeFile(SEO_REGISTRY_CONFIG.registryFile, JSON.stringify(registry, null, 2), 'utf8');
    
    console.log('📝 Registry entry updated:', id);
    return registry[entryIndex];
  } catch (error) {
    console.error('Failed to update registry entry:', error);
    return null;
  }
}

// Delete registry entry
export async function deleteRegistryEntry(id: string): Promise<boolean> {
  try {
    const registryData = await fs.readFile(SEO_REGISTRY_CONFIG.registryFile, 'utf8');
    let registry: SeoRegistryEntry[] = JSON.parse(registryData);
    
    const entryIndex = registry.findIndex(entry => entry.id === id);
    if (entryIndex === -1) {
      return false;
    }
    
    // Remove entry
    registry = registry.filter(entry => entry.id !== id);
    
    // Save updated registry
    await fs.writeFile(SEO_REGISTRY_CONFIG.registryFile, JSON.stringify(registry, null, 2), 'utf8');
    
    console.log('🗑️ Registry entry deleted:', id);
    return true;
  } catch (error) {
    console.error('Failed to delete registry entry:', error);
    return false;
  }
}

// Export registry data
export async function exportRegistryData(format: 'json' | 'csv', filter?: SeoRegistryFilter): Promise<string> {
  const entries = await loadRegistryEntries(filter);
  
  if (format === 'json') {
    return JSON.stringify(entries, null, 2);
  } else if (format === 'csv') {
    const headers = [
      'ID', 'URL', 'Category', 'Language', 'Industry', 
      'Title', 'Description', 'Score', 'Status', 'Created At'
    ];
    
    const rows = entries.map(entry => [
      entry.id,
      entry.url,
      entry.category,
      entry.language,
      entry.industry,
      entry.seoData?.title || '',
      entry.seoData?.description || '',
      entry.seoData?.score || 0,
      entry.status,
      entry.createdAt
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
  
  throw new Error('Unsupported export format');
}

// Clean up old entries
export async function cleanupOldEntries(olderThanDays: number = 90): Promise<number> {
  try {
    const registryData = await fs.readFile(SEO_REGISTRY_CONFIG.registryFile, 'utf8');
    let registry: SeoRegistryEntry[] = JSON.parse(registryData);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const originalLength = registry.length;
    registry = registry.filter(entry => new Date(entry.createdAt) > cutoffDate);
    
    // Save cleaned registry
    await fs.writeFile(SEO_REGISTRY_CONFIG.registryFile, JSON.stringify(registry, null, 2), 'utf8');
    
    const deletedCount = originalLength - registry.length;
    console.log(`🧹 Cleaned up ${deletedCount} old registry entries`);
    
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old entries:', error);
    return 0;
  }
}