import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, Edit, Trash2, Reply, ThumbsUp, User } from 'lucide-react';

interface Comment {
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
  replies?: Comment[];
}

interface CommentSystemProps {
  contentId: string;
  className?: string;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({ contentId, className = '' }) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error('댓글 로딩 오류:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/comments/${contentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment.trim() })
      });

      if (response.ok) {
        setNewComment('');
        await fetchComments();
      } else {
        const error = await response.json();
        alert(error.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user || !replyText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/comments/${contentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: replyText.trim(),
          parentId 
        })
      });

      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        await fetchComments();
      } else {
        const error = await response.json();
        alert(error.error || '답글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('답글 작성 오류:', error);
      alert('답글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    if (!session?.user || !newText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/comments/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, text: newText.trim() })
      });

      if (response.ok) {
        setEditingComment(null);
        await fetchComments();
      } else {
        const error = await response.json();
        alert(error.error || '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user || !confirm('이 댓글을 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/comments/${contentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });

      if (response.ok) {
        await fetchComments();
      } else {
        const error = await response.json();
        alert(error.error || '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const canEdit = session?.user?.email === comment.userEmail;
    const isEditing = editingComment?.id === comment.id;
    
    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  {comment.userEmail.split('@')[0]}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {formatDate(comment.createdAt)}
                  {comment.isEdited && ' (수정됨)'}
                </span>
              </div>
            </div>
            {canEdit && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingComment({ id: comment.id, text: comment.text })}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  disabled={loading}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditComment(comment.id, editingComment.text);
              }}
              className="space-y-3"
            >
              <textarea
                value={editingComment.text}
                onChange={(e) => setEditingComment({ id: comment.id, text: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={1000}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading || !editingComment.text.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-gray-800 mb-3 whitespace-pre-wrap">{comment.text}</p>
              <div className="flex items-center space-x-4 text-sm">
                <button
                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                  disabled={loading}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{comment.likes}</span>
                </button>
                {session?.user && level < 2 && (
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setReplyText('');
                    }}
                    className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                    disabled={loading}
                  >
                    <Reply className="h-4 w-4" />
                    <span>답글</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {replyingTo === comment.id && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitReply(comment.id);
              }}
              className="mt-4 space-y-3"
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 작성하세요..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                maxLength={1000}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading || !replyText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>답글 작성</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        {comment.replies && comment.replies.map(reply => renderComment(reply, level + 1))}
      </div>
    );
  };

  if (!session?.user) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
        <a 
          href="/auth/signin"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          로그인
        </a>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-3">
        <MessageCircle className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          댓글 {totalCount > 0 && `(${totalCount})`}
        </h3>
      </div>

      <form onSubmit={handleSubmitComment} className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 작성하세요..."
          className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          maxLength={1000}
          required
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {newComment.length}/1000
          </span>
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>댓글 작성</span>
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <div className="text-center py-8 text-gray-500">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </div>
        )}
      </div>
    </div>
  );
};