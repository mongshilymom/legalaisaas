import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark, BookmarkCheck, Plus, Edit3, X } from 'lucide-react';

interface BookmarkData {
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

interface BookmarkButtonProps {
  contentId: string;
  contentTitle?: string;
  contentType?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  contentId,
  contentTitle,
  contentType,
  className = '',
  variant = 'button',
  size = 'md',
  onBookmarkChange
}) => {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [bookmark, setBookmark] = useState<BookmarkData | null>(null);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (session?.user) {
      checkBookmarkStatus();
    }
  }, [contentId, session]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/bookmarks/${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
        setBookmark(data.bookmark);
        if (data.bookmark) {
          setNotes(data.bookmark.notes || '');
          setTags(data.bookmark.tags || []);
        }
      }
    } catch (error) {
      console.error('북마크 상태 확인 오류:', error);
    }
  };

  const handleToggleBookmark = async () => {
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isBookmarked && !showDetails) {
      setShowDetails(true);
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark();
      } else {
        await addBookmark();
      }
    } catch (error) {
      console.error('북마크 토글 오류:', error);
      alert('북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async () => {
    const response = await fetch(`/api/bookmarks/${contentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentTitle,
        contentType,
        tags,
        notes: notes.trim() || undefined
      })
    });

    if (response.ok) {
      setIsBookmarked(true);
      setShowDetails(false);
      onBookmarkChange?.(true);
      await checkBookmarkStatus();
    } else {
      const error = await response.json();
      alert(error.error || '북마크 추가에 실패했습니다.');
    }
  };

  const removeBookmark = async () => {
    const response = await fetch(`/api/bookmarks/${contentId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      setIsBookmarked(false);
      setShowDetails(false);
      setBookmark(null);
      setNotes('');
      setTags([]);
      onBookmarkChange?.(false);
    } else {
      const error = await response.json();
      alert(error.error || '북마크 제거에 실패했습니다.');
    }
  };

  const updateBookmark = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookmarks/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes.trim() || undefined,
          tags
        })
      });

      if (response.ok) {
        setShowDetails(false);
        await checkBookmarkStatus();
      } else {
        const error = await response.json();
        alert(error.error || '북마크 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('북마크 업데이트 오류:', error);
      alert('북마크 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    return sizeMap[size];
  };

  const getButtonClasses = () => {
    const baseClasses = 'transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    if (variant === 'icon') {
      return `${baseClasses} p-2 rounded-full hover:bg-gray-100`;
    }
    
    if (variant === 'floating') {
      return `${baseClasses} fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50`;
    }
    
    return `${baseClasses} flex items-center space-x-2 px-4 py-2 rounded-lg border ${
      isBookmarked 
        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
    }`;
  };

  if (!session?.user && variant !== 'floating') {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggleBookmark}
        disabled={loading}
        className={getButtonClasses()}
        title={isBookmarked ? '북마크됨' : '북마크 추가'}
      >
        {isBookmarked ? (
          <BookmarkCheck className={`${getSizeClasses()} text-blue-600`} />
        ) : (
          <Bookmark className={getSizeClasses()} />
        )}
        {variant === 'button' && (
          <span className="text-sm font-medium">
            {isBookmarked ? '저장됨' : '저장'}
          </span>
        )}
      </button>

      {showDetails && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900">북마크 설정</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                노트 (선택사항)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="이 콘텐츠에 대한 메모를 남겨보세요..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {notes.length}/500
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="태그 추가..."
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim() || tags.includes(newTag.trim())}
                  className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              {isBookmarked ? (
                <>
                  <button
                    onClick={updateBookmark}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Edit3 className="h-4 w-4 inline mr-2" />
                    업데이트
                  </button>
                  <button
                    onClick={removeBookmark}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    제거
                  </button>
                </>
              ) : (
                <button
                  onClick={addBookmark}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  북마크 추가
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};