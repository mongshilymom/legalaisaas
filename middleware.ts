import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const referer = request.headers.get('referer') || '';
  const userAgent = request.headers.get('user-agent') || '';
  const url = request.nextUrl;
  
  const isSeoTraffic = referer.includes('seo.') || 
                      url.searchParams.get('utm_source') === 'seo' ||
                      referer.includes('google.') ||
                      referer.includes('naver.') ||
                      referer.includes('bing.');
  
  if (isSeoTraffic) {
    const seoTag = url.searchParams.get('seo_tag') || 
                   url.pathname.replace('/', '') || 
                   'general';
    
    response.headers.set('x-seo-source', seoTag);
    
    const logData = {
      timestamp: new Date().toISOString(),
      page: url.pathname,
      seo_tag: seoTag,
      referer: referer,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: userAgent
    };
    
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const logPath = path.join(logDir, 'seo-visits.log');
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      fs.appendFileSync(logPath, JSON.stringify(logData) + '\n', 'utf-8');
    } catch (error) {
      console.error('SEO logging error:', error);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};