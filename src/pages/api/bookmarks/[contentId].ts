import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import { userInteractionTracker } from '../../../lib/userInteractionTracker';
import fs from 'fs';
import path from 'path';

export interface Bookmark {
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

const bookmarksLogPath = path.join(process.cwd(), 'logs', 'interactions', 'bookmarks.log');

function ensureBookmarksLogExists() {
  const logDir = path.dirname(bookmarksLogPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function generateBookmarkId(): string {
  return `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { contentId } = req.query;
  
  if (!contentId || typeof contentId !== 'string') {
    return res.status(400).json({ error: '콘텐츠 ID가 필요합니다.' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    ensureBookmarksLogExists();

    switch (req.method) {
      case 'GET':
        return await getBookmarkStatus(contentId, session.user.email, res);
      
      case 'POST':
        return await addBookmark(contentId, req.body, session.user.email, res);
      
      case 'DELETE':
        return await removeBookmark(contentId, session.user.email, res);
      
      case 'PUT':
        return await updateBookmark(contentId, req.body, session.user.email, res);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('북마크 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

async function getBookmarkStatus(contentId: string, userEmail: string, res: NextApiResponse) {
  try {
    if (!fs.existsSync(bookmarksLogPath)) {
      return res.status(200).json({ 
        isBookmarked: false,
        bookmark: null 
      });
    }

    const logContent = fs.readFileSync(bookmarksLogPath, 'utf-8');
    const bookmarks = logContent
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
      .filter(bookmark => 
        bookmark!.contentId === contentId && 
        bookmark!.userEmail === userEmail
      )
      .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime());

    const latestBookmark = bookmarks[0];
    const isBookmarked = latestBookmark?.isActive || false;

    return res.status(200).json({ 
      isBookmarked,
      bookmark: isBookmarked ? latestBookmark : null
    });
  } catch (error) {
    console.error('북마크 상태 조회 오류:', error);
    return res.status(500).json({ error: '북마크 상태를 확인할 수 없습니다.' });
  }
}

async function addBookmark(
  contentId: string,
  data: {
    contentTitle?: string;
    contentType?: string;
    tags?: string[];
    notes?: string;
  },
  userEmail: string,
  res: NextApiResponse
) {
  try {
    const { contentTitle, contentType, tags, notes } = data;

    if (notes && notes.length > 500) {
      return res.status(400).json({ error: '노트는 500자 이내로 작성해주세요.' });
    }

    const bookmark: Bookmark = {
      id: generateBookmarkId(),
      contentId,
      userId: userEmail,
      userEmail,
      contentTitle,
      contentType,
      tags: tags || [],
      notes: notes?.trim(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    fs.appendFileSync(bookmarksLogPath, JSON.stringify(bookmark) + '\n', 'utf-8');

    await userInteractionTracker.trackInteraction({
      userId: userEmail,
      sessionId: `session_${Date.now()}`,
      contentId,
      interactionType: 'bookmark',
      metadata: { 
        bookmarkId: bookmark.id,
        contentTitle,
        contentType,
        hasNotes: !!notes,
        tagsCount: tags?.length || 0
      }
    });

    return res.status(201).json({ 
      bookmark,
      message: '북마크에 추가되었습니다.' 
    });
  } catch (error) {
    console.error('북마크 추가 오류:', error);
    return res.status(500).json({ error: '북마크 추가 중 오류가 발생했습니다.' });
  }
}

async function removeBookmark(contentId: string, userEmail: string, res: NextApiResponse) {
  try {
    const removedBookmark: Bookmark = {
      id: generateBookmarkId(),
      contentId,
      userId: userEmail,
      userEmail,
      createdAt: new Date().toISOString(),
      isActive: false
    };

    fs.appendFileSync(bookmarksLogPath, JSON.stringify(removedBookmark) + '\n', 'utf-8');

    await userInteractionTracker.trackInteraction({
      userId: userEmail,
      sessionId: `session_${Date.now()}`,
      contentId,
      interactionType: 'bookmark',
      value: 'removed',
      metadata: { 
        bookmarkId: removedBookmark.id,
        action: 'remove'
      }
    });

    return res.status(200).json({ message: '북마크에서 제거되었습니다.' });
  } catch (error) {
    console.error('북마크 제거 오류:', error);
    return res.status(500).json({ error: '북마크 제거 중 오류가 발생했습니다.' });
  }
}

async function updateBookmark(
  contentId: string,
  data: { notes?: string; tags?: string[] },
  userEmail: string,
  res: NextApiResponse
) {
  try {
    const { notes, tags } = data;

    if (notes && notes.length > 500) {
      return res.status(400).json({ error: '노트는 500자 이내로 작성해주세요.' });
    }

    if (!fs.existsSync(bookmarksLogPath)) {
      return res.status(404).json({ error: '업데이트할 북마크를 찾을 수 없습니다.' });
    }

    const logContent = fs.readFileSync(bookmarksLogPath, 'utf-8');
    const bookmarks = logContent
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
      .filter(bookmark => 
        bookmark!.contentId === contentId && 
        bookmark!.userEmail === userEmail
      )
      .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime());

    const latestBookmark = bookmarks[0];
    if (!latestBookmark || !latestBookmark.isActive) {
      return res.status(404).json({ error: '업데이트할 북마크를 찾을 수 없습니다.' });
    }

    const updatedBookmark: Bookmark = {
      ...latestBookmark,
      id: generateBookmarkId(),
      notes: notes?.trim(),
      tags: tags || latestBookmark.tags,
      createdAt: new Date().toISOString()
    };

    fs.appendFileSync(bookmarksLogPath, JSON.stringify(updatedBookmark) + '\n', 'utf-8');

    return res.status(200).json({ 
      bookmark: updatedBookmark,
      message: '북마크가 업데이트되었습니다.' 
    });
  } catch (error) {
    console.error('북마크 업데이트 오류:', error);
    return res.status(500).json({ error: '북마크 업데이트 중 오류가 발생했습니다.' });
  }
}