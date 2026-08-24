import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogPosts';

const Blog = () => {
    const navigate = useNavigate();

    return (
        <div style={{ background: '#0a0b10', minHeight: '100vh', color: '#fff', padding: '4rem 2rem' }}>
            <SEO
                title="Blog | Equipo Experto"
                description="Practical guides on getting more reviews, responding to feedback, and following up with leads — for small, single-location businesses."
                path="/blog"
            />
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '2rem', padding: 0 }}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '1rem' }}>
                        Blog
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                        Practical guides on reviews, lead capture, and follow-up for small businesses.
                    </p>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {blogPosts.map((post) => (
                        <Link
                            key={post.slug}
                            to={`/blog/${post.slug}`}
                            style={{
                                display: 'block',
                                padding: '1.75rem',
                                borderRadius: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                textDecoration: 'none',
                                color: 'inherit',
                            }}
                        >
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                {post.date} · {post.readTime}
                            </p>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                {post.title}
                            </h2>
                            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                                {post.description}
                            </p>
                            <span style={{ color: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                Read more <ArrowRight size={16} />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blog;
