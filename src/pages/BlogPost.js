import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './BlogPost.css';

function BlogPost() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/blog/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPost(response.data);
    } catch (err) {
      console.error('Failed to fetch blog post', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`/api/blog/${postId}/comments`, { content: comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComment('');
      fetchPost();
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (!post) return <div className="container">Post not found</div>;

  return (
    <div className="blog-post-page">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link to="/blog" className="btn btn-secondary" style={{ marginBottom: '30px', padding: '8px 15px' }}>
          &lt; BACK TO LOG
        </Link>

        <article className="full-post card">
          <div className="post-header">
            <span className="post-date">[{new Date(post.created_at).toLocaleString()}]</span>
            <h1 className="post-title" style={{ color: 'var(--neon-cyan)' }}>{post.title}</h1>
            <span className="post-author" style={{ display: 'block', marginTop: '10px' }}>
              BROADCAST BY: {post.author}
            </span>
          </div>
          <div className="post-content">
            {post.content.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </article>

        <section className="feedback-section">
          <h2 className="card-title">FEEDBACK THREAD</h2>
          
          <div className="comment-form card">
            <form onSubmit={handleAddComment}>
              <textarea 
                className="form-input" 
                placeholder="Enter feedback or response..."
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              ></textarea>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }} disabled={isSubmitting}>
                {isSubmitting ? 'TRANSMITTING...' : 'SEND FEEDBACK'}
              </button>
            </form>
          </div>

          <div className="comments-list">
            {post.comments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No feedback entries yet.</p>
            ) : (
              post.comments.map(c => (
                <div key={c.id} className="comment-card">
                  <div className="comment-header">
                    <span className="comment-user">{c.username}</span>
                    <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="comment-text">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default BlogPost;



