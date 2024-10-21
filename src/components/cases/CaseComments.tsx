import React, { useState, useEffect } from 'react';
import { User, Send } from 'lucide-react';
import { fetchComments, addComment } from '../../services/api';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface CaseCommentsProps {
  caseId: string;
}

const CaseComments: React.FC<CaseCommentsProps> = ({ caseId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCommentData();
  }, [caseId]);

  const fetchCommentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchComments(caseId);
      setComments(response.data);
    } catch (err) {
      setError('Failed to load comments. Please try again later.');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await addComment(caseId, 'Current User', newComment);
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (err) {
      setError('Failed to post comment. Please try again.');
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 mr-2 text-gray-500" />
              <span className="font-semibold">{comment.author}</span>
              <span className="text-sm text-gray-500 ml-2">{new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            <p>{comment.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmitComment} className="flex items-center">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={submitting}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          disabled={submitting}
        >
          {submitting ? 'Posting...' : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default CaseComments;