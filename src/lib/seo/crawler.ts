import * as cheerio from 'cheerio';
import { URL } from 'url';

// Crawler interfaces
export interface CrawlResult {
  success: boolean;
  url: string;
  title?: string;
  description?: string;
  content?: string;
  keywords?: string[];
  images?: string[];
  links?: string[];
  metadata?: Record<string, string>;
  error?: string;
}

export interface CrawlOptions {
  maxContentLength?: number;
  extractImages?: boolean;
  extractLinks?: boolean;
  userAgent?: string;
  timeout?: number;
}

// Default configuration
const DEFAULT_CRAWL_OPTIONS: Required<CrawlOptions> = {
  maxContentLength: 10000,
  extractImages: false,
  extractLinks: false,
  userAgent: 'Legal AI SaaS SEO Crawler/1.0',
  timeout: 10000,
};

// Fetch page content
async function fetchPageContent(url: string, options: Required<CrawlOptions>): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': options.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Extract text content from HTML
function extractTextContent(html: string, maxLength: number): string {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style, nav, header, footer, aside').remove();
  
  // Extract main content areas first
  const mainSelectors = [
    'main',
    '[role="main"]',
    '.main-content',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    'article',
    '.container .row',
  ];
  
  let content = '';
  
  // Try to find main content area
  for (const selector of mainSelectors) {
    const mainElement = $(selector).first();
    if (mainElement.length > 0) {
      content = mainElement.text();
      break;
    }
  }
  
  // Fallback to body if no main content found
  if (!content) {
    content = $('body').text();
  }
  
  // Clean up whitespace
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Limit length
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }
  
  return content;
}

// Extract keywords from content
function extractKeywords(title: string, description: string, content: string): string[] {
  const text = `${title} ${description} ${content}`.toLowerCase();
  
  // Common Korean and English stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    '이', '그', '저', '것', '수', '있', '없', '하', '되', '된', '될', '와', '과', '을', '를', '이', '가', '에', '에서', '으로', '로', '의', '은', '는', '도', '만', '부터', '까지', '보다', '처럼', '같이', '위해', '때문', '통해', '대한', '관한', '위한', '등', '및'
  ]);
  
  // Extract words (2+ characters, alphanumeric + Korean)
  const words = text.match(/[a-zA-Z가-힣]{2,}/g) || [];
  
  // Count frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    if (!stopWords.has(word) && word.length >= 2) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// Extract images from HTML
function extractImages(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const images: string[] = [];
  
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    if (src) {
      try {
        const absoluteUrl = new URL(src, baseUrl).href;
        images.push(absoluteUrl);
      } catch (error) {
        // Invalid URL, skip
      }
    }
  });
  
  // Remove duplicates and return first 10
  return [...new Set(images)].slice(0, 10);
}

// Extract links from HTML
function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push(absoluteUrl);
      } catch (error) {
        // Invalid URL, skip
      }
    }
  });
  
  // Remove duplicates and return first 20
  return [...new Set(links)].slice(0, 20);
}

// Extract metadata from HTML
function extractMetadata(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const metadata: Record<string, string> = {};
  
  // Meta tags
  $('meta').each((_, element) => {
    const name = $(element).attr('name') || $(element).attr('property') || $(element).attr('http-equiv');
    const content = $(element).attr('content');
    
    if (name && content) {
      metadata[name] = content;
    }
  });
  
  // Title
  const title = $('title').text().trim();
  if (title) {
    metadata.title = title;
  }
  
  // Language
  const lang = $('html').attr('lang') || $('html').attr('xml:lang');
  if (lang) {
    metadata.language = lang;
  }
  
  // Canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) {
    metadata.canonical = canonical;
  }
  
  return metadata;
}

// Main crawler function
export async function crawlPage(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
  const mergedOptions = { ...DEFAULT_CRAWL_OPTIONS, ...options };
  
  try {
    // Validate URL
    new URL(url);
    
    console.log('🕷️ Crawling URL:', url);
    
    // Fetch page content
    const html = await fetchPageContent(url, mergedOptions);
    
    // Extract metadata
    const metadata = extractMetadata(html);
    
    // Extract basic information
    const title = metadata.title || '';
    const description = metadata.description || metadata['og:description'] || '';
    
    // Extract content
    const content = extractTextContent(html, mergedOptions.maxContentLength);
    
    // Extract keywords
    const keywords = extractKeywords(title, description, content);
    
    // Extract images if requested
    const images = mergedOptions.extractImages ? extractImages(html, url) : undefined;
    
    // Extract links if requested
    const links = mergedOptions.extractLinks ? extractLinks(html, url) : undefined;
    
    const result: CrawlResult = {
      success: true,
      url,
      title,
      description,
      content,
      keywords,
      images,
      links,
      metadata,
    };
    
    console.log('✅ Crawling completed:', {
      title: title.substring(0, 50) + '...',
      contentLength: content.length,
      keywordCount: keywords.length,
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Crawling failed:', error);
    
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown crawling error',
    };
  }
}

// Batch crawl multiple URLs
export async function crawlMultiplePages(
  urls: string[],
  options: CrawlOptions = {},
  maxConcurrent: number = 3
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  
  // Process URLs in batches to avoid overwhelming the server
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(url => crawlPage(url, options));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          url: batch[index],
          error: result.reason?.message || 'Crawling failed',
        });
      }
    });
    
    // Add delay between batches to be respectful
    if (i + maxConcurrent < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Validate if URL is crawlable
export function isUrlCrawlable(url: string): { valid: boolean; reason?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, reason: 'Only HTTP and HTTPS protocols are supported' };
    }
    
    // Check for common non-crawlable patterns
    const nonCrawlablePatterns = [
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg)$/i,
      /^mailto:/,
      /^tel:/,
      /^ftp:/,
    ];
    
    for (const pattern of nonCrawlablePatterns) {
      if (pattern.test(url)) {
        return { valid: false, reason: 'File type or protocol not supported for crawling' };
      }
    }
    
    return { valid: true };
    
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

// Extract domain from URL
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    return 'unknown';
  }
}