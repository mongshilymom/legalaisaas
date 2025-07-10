import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import { userInteractionTracker } from '../../../lib/userInteractionTracker';
import fs from 'fs';
import path from 'path';

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  userEmail: string;
  text: string;
  parentId?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  likes: number;
  isHidden: boolean;
}

export interface CommentRequest {
  text: string;
  parentId?: string;
}

const commentsLogPath = path.join(process.cwd(), 'logs', 'interactions', 'comments.log');

function ensureCommentsLogExists() {
  const logDir = path.dirname(commentsLogPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function generateCommentId(): string {
  return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

    ensureCommentsLogExists();

    switch (req.method) {
      case 'GET':
        return await getComments(contentId, res);
      
      case 'POST':
        return await createComment(contentId, req.body, session.user.email, res);
      
      case 'PUT':
        return await updateComment(req.body, session.user.email, res);
      
      case 'DELETE':
        return await deleteComment(req.body.commentId, session.user.email, res);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('댓글 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

async function getComments(contentId: string, res: NextApiResponse) {
  try {
    if (!fs.existsSync(commentsLogPath)) {
      return res.status(200).json({ comments: [] });
    }

    const logContent = fs.readFileSync(commentsLogPath, 'utf-8');
    const comments = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as Comment;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter(comment => comment!.contentId === contentId && !comment!.isHidden)
      .sort((a, b) => new Date(a!.createdAt).getTime() - new Date(b!.createdAt).getTime());

    const organizedComments = organizeComments(comments);
    
    return res.status(200).json({ 
      comments: organizedComments,
      totalCount: comments.length 
    });
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    return res.status(500).json({ error: '댓글을 불러올 수 없습니다.' });
  }
}

async function createComment(
  contentId: string, 
  data: CommentRequest, 
  userEmail: string, 
  res: NextApiResponse
) {
  try {
    const { text, parentId } = data;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: '댓글은 1000자 이내로 작성해주세요.' });
    }

    const comment: Comment = {
      id: generateCommentId(),
      contentId,
      userId: userEmail,
      userEmail,
      text: text.trim(),
      parentId,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      isHidden: false
    };

    fs.appendFileSync(commentsLogPath, JSON.stringify(comment) + '\n', 'utf-8');

    await userInteractionTracker.trackInteraction({
      userId: userEmail,
      sessionId: `session_${Date.now()}`,
      contentId,
      interactionType: 'comment',
      value: text,
      metadata: { 
        commentId: comment.id,
        isReply: !!parentId,
        textLength: text.length 
      }
    });

    return res.status(201).json({ 
      comment,
      message: '댓글이 작성되었습니다.' 
    });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    return res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  }
}

async function updateComment(
  data: { commentId: string; text: string },
  userEmail: string,
  res: NextApiResponse
) {
  try {
    const { commentId, text } = data;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    if (!fs.existsSync(commentsLogPath)) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    const logContent = fs.readFileSync(commentsLogPath, 'utf-8');
    const comments = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as Comment;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const commentToUpdate = comments.find(c => c!.id === commentId && c!.userEmail === userEmail);
    
    if (!commentToUpdate) {
      return res.status(404).json({ error: '수정할 권한이 없거나 댓글을 찾을 수 없습니다.' });
    }

    const updatedComment: Comment = {
      ...commentToUpdate,
      text: text.trim(),
      isEdited: true,
      updatedAt: new Date().toISOString()
    };

    fs.appendFileSync(commentsLogPath, JSON.stringify(updatedComment) + '\n', 'utf-8');

    return res.status(200).json({ 
      comment: updatedComment,
      message: '댓글이 수정되었습니다.' 
    });
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    return res.status(500).json({ error: '댓글 수정 중 오류가 발생했습니다.' });
  }
}

async function deleteComment(commentId: string, userEmail: string, res: NextApiResponse) {
  try {
    if (!fs.existsSync(commentsLogPath)) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    const logContent = fs.readFileSync(commentsLogPath, 'utf-8');
    const comments = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as Comment;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const commentToDelete = comments.find(c => c!.id === commentId && c!.userEmail === userEmail);
    
    if (!commentToDelete) {
      return res.status(404).json({ error: '삭제할 권한이 없거나 댓글을 찾을 수 없습니다.' });
    }

    const deletedComment: Comment = {
      ...commentToDelete,
      isHidden: true,
      updatedAt: new Date().toISOString()
    };

    fs.appendFileSync(commentsLogPath, JSON.stringify(deletedComment) + '\n', 'utf-8');

    return res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
  }
}

function organizeComments(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment & { replies: Comment[] }>();
  const rootComments: (Comment & { replies: Comment[] })[] = [];

  comments.forEach(comment => {
    const commentWithReplies = { ...comment, replies: [] };
    commentMap.set(comment.id, commentWithReplies);
    
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}