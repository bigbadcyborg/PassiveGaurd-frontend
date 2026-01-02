import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Blog.css';

function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/blog', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch blog posts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('/api/blog', newPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewPost({ title: '', content: '' });
      setShowForm(false);
      fetchPosts();
    } catch (err) {
      alert('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="blog-page">
      <div className="admin-header" style={{ flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--neon-cyan)', marginBottom: '10px' }}>SYSTEM LOG</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Latest updates and security broadcasts from the core team.</p>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'CANCEL BROADCAST' : 'INITIALIZE BROADCAST'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto 40px auto' }}>
          <h2 className="card-title">NEW ENTRY</h2>
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input 
                type="text" 
                className="form-input" 
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">CONTENT</label>
              <textarea 
                className="form-input" 
                rows="10" 
                style={{ resize: 'vertical' }}
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'TRANSMITTING...' : 'POST LOG ENTRY'}
            </button>
          </form>
        </div>
      )}

      <div className="blog-feed">
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No log entries found.</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="blog-post-card">
              <div className="post-header">
                <span className="post-date">[{new Date(post.created_at).toLocaleString()}]</span>
                <h3 className="post-title">{post.title}</h3>
              </div>
              <p className="post-preview">{post.content}</p>
              <div className="post-footer">
                <span className="post-author">AUTH: {post.author}</span>
                <Link to={`/blog/${post.id}`} className="read-more-btn">
                  VIEW THREAD ({post.comment_count} FEEDBACK)
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Blog;



