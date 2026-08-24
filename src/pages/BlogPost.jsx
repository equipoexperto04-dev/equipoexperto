import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getPostBySlug } from '../data/blogPosts';

const Block = ({ block }) => {
    switch (block.type) {
        case 'h2':
            return <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '2rem 0 1rem', color: '#3b82f6' }}>{block.text}</h2>;
        case 'ul':
            return (
                <ul style={{ color: '#94a3b8', lineHeight: 1.9, paddingLeft: '1.25rem', marginBottom: '1rem' }}>
                    {block.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            );
        case 'quote':
            return (
                <blockquote style={{ borderLeft: '3px solid #3b82f6', margin: '1.5rem 0', padding: '0.5rem 0 0.5rem 1.25rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.7 }}>
                    {block.text}
                </blockquote>
            );
        case 'p':
        default:
            return <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '1rem' }}>{block.text}</p>;
    }
};

const BlogPost = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const post = getPostBySlug(slug);

    if (!post) {
        return <Navigate to="/blog" replace />;
    }

    return (
        <div style={{ background: '#0a0b10', minHeight: '100vh', color: '#fff', padding: '4rem 2rem' }}>
            <SEO
                title={`${post.title} | Equipo Experto`}
                description={post.description}
                path={`/blog/${post.slug}`}
            />
            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/blog')}
                    style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '2rem', padding: 0 }}
                >
                    <ArrowLeft size={18} /> Back to blog
                </button>

                <header style={{ marginBottom: '2.5rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        {post.date} · {post.readTime}
                    </p>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.2 }}>
                        {post.title}
                    </h1>
                </header>

                <article>
                    {post.content.map((block, i) => <Block key={i} block={block} />)}
                </article>

                <section style={{ textAlign: 'center', padding: '2.5rem', marginTop: '2.5rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                        Want this running automatically?
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                        Equipo Experto handles review requests, lead capture, and follow-up — so this happens without you lifting a finger.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => { window.location.href = '/register'; }}
                            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.875rem 2rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                        >
                            Get Started Free
                        </button>
                        <Link
                            to="/blog"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 600, textDecoration: 'none', padding: '0.875rem 0' }}
                        >
                            More articles <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default BlogPost;
