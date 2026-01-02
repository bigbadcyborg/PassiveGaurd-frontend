import React, { useState, useEffect } from 'react';

const SecurityNewsFeed = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    // Mock data for MVP - in production this would fetch from an API
    const mockNews = [
      { id: 1, title: "Zero-Day in Popular Java Library", severity: "CRITICAL", date: "2026-01-02" },
      { id: 2, title: "New Ransomware Variant Targeting CI/CD", severity: "HIGH", date: "2026-01-01" },
      { id: 3, title: "Python Package Index Malicious Uploads", severity: "MEDIUM", date: "2025-12-31" },
      { id: 4, title: "Kubernetes Privilege Escalation Flaw", severity: "HIGH", date: "2025-12-30" },
    ];
    setNews(mockNews);
  }, []);

  return (
    <div className="news-feed-container">
      <h3 className="feed-header">
        <span className="blink">●</span> LIVE SECURITY FEED
      </h3>
      <div className="feed-list">
        {news.map((item) => (
          <div key={item.id} className="feed-item">
            <div className="feed-meta">
              <span className="feed-date">{item.date}</span>
              <span className={`feed-severity severity-${item.severity.toLowerCase()}`}>
                {item.severity}
              </span>
            </div>
            <div className="feed-title">{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityNewsFeed;
