import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import fs from 'fs';
import path from 'path';

interface Bookmark {
  id: string;
  contentId: string;
  userId: string;
  userEmail: string;
  contentTitle?: string;
  contentType?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  isActive: boolean;
}

interface BookmarkListResponse {
  bookmarks: Bookmark[];
  totalCount: number;
  tags: string[];
}

const bookmarksLogPath = path.join(process.cwd(), 'logs', 'interactions', 'bookmarks.log');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { 
      page = '1', 
      limit = '20', 
      tag, 
      contentType, 
      search 
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    await getUserBookmarks(
      session.user.email, 
      pageNum, 
      limitNum, 
      tag as string,
      contentType as string,
      search as string,
      res
    );

  } catch (error) {
    console.error('북마크 목록 조회 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

async function getUserBookmarks(
  userEmail: string,
  page: number,
  limit: number,
  tagFilter?: string,
  contentTypeFilter?: string,
  searchQuery?: string,
  res: NextApiResponse
) {
  try {
    if (!fs.existsSync(bookmarksLogPath)) {
      return res.status(200).json({
        bookmarks: [],
        totalCount: 0,
        tags: []
      });
    }

    const logContent = fs.readFileSync(bookmarksLogPath, 'utf-8');
    const allBookmarks = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as Bookmark;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter(bookmark => bookmark!.userEmail === userEmail);

    const userBookmarkMap = new Map<string, Bookmark>();
    allBookmarks.forEach(bookmark => {
      const existing = userBookmarkMap.get(bookmark!.contentId);
      if (!existing || new Date(bookmark!.createdAt) > new Date(existing.createdAt)) {
        userBookmarkMap.set(bookmark!.contentId, bookmark!);
      }
    });

    let activeBookmarks = Array.from(userBookmarkMap.values())
      .filter(bookmark => bookmark.isActive);

    if (tagFilter) {
      activeBookmarks = activeBookmarks.filter(bookmark => 
        bookmark.tags?.includes(tagFilter)
      );
    }

    if (contentTypeFilter) {
      activeBookmarks = activeBookmarks.filter(bookmark => 
        bookmark.contentType === contentTypeFilter
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      activeBookmarks = activeBookmarks.filter(bookmark => 
        bookmark.contentTitle?.toLowerCase().includes(query) ||
        bookmark.notes?.toLowerCase().includes(query) ||
        bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    activeBookmarks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const allTags = [...new Set(
      activeBookmarks
        .flatMap(bookmark => bookmark.tags || [])
        .filter(Boolean)
    )];

    const totalCount = activeBookmarks.length;
    const startIndex = (page - 1) * limit;
    const paginatedBookmarks = activeBookmarks.slice(startIndex, startIndex + limit);

    const response: BookmarkListResponse = {
      bookmarks: paginatedBookmarks,
      totalCount,
      tags: allTags
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('사용자 북마크 조회 오류:', error);
    return res.status(500).json({ error: '북마크 목록을 불러올 수 없습니다.' });
  }
}