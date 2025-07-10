import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { crawlPage, isUrlCrawlable } from '../../../lib/seo/crawler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to use the crawling service'
      });
    }

    // Check if user is admin (for now, restrict to admins)
    const isAdmin = session.user.email.includes('admin') || 
                   session.user.email === 'developer@legalaisaas.com';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'Only administrators can use the crawling service'
      });
    }

    console.log('🕷️ Crawl request from:', session.user.email);

    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid URL to crawl'
      });
    }

    // Validate URL
    const urlValidation = isUrlCrawlable(url);
    if (!urlValidation.valid) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: urlValidation.reason
      });
    }

    console.log('🔍 Crawling URL:', url);

    // Perform crawling
    const crawlResult = await crawlPage(url, {
      maxContentLength: options.maxContentLength || 10000,
      extractImages: options.extractImages || false,
      extractLinks: options.extractLinks || false,
      timeout: options.timeout || 10000,
    });

    const executionTime = Date.now() - startTime;

    if (crawlResult.success) {
      console.log('✅ Crawling successful:', {
        url,
        titleLength: crawlResult.title?.length || 0,
        contentLength: crawlResult.content?.length || 0,
        keywordCount: crawlResult.keywords?.length || 0,
        executionTime: `${executionTime}ms`,
      });

      res.status(200).json({
        success: true,
        data: {
          url: crawlResult.url,
          title: crawlResult.title,
          description: crawlResult.description,
          content: crawlResult.content,
          keywords: crawlResult.keywords,
          images: crawlResult.images,
          links: crawlResult.links,
          metadata: crawlResult.metadata,
        },
        meta: {
          executionTime,
          timestamp: new Date().toISOString(),
          crawledBy: session.user.email,
        }
      });
    } else {
      console.error('❌ Crawling failed:', crawlResult.error);
      
      res.status(500).json({
        success: false,
        error: 'Crawling failed',
        message: crawlResult.error,
        meta: {
          executionTime,
          timestamp: new Date().toISOString(),
        }
      });
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ Crawl API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      }
    });
  }
}