import { useEffect } from 'react';

const SITE_URL = 'https://equipoexperto.com';

function setMetaTag(attrName, attrValue, content) {
    let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setLinkTag(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

/**
 * Sets per-route title, meta description, canonical, OG/Twitter tags, and (optionally)
 * hreflang alternate links. `alternates` maps hreflang codes (e.g. 'en', 'es', 'x-default')
 * to site-relative paths.
 */
const SEO = ({ title, description, path = '/', alternates }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
            setMetaTag('property', 'og:title', title);
            setMetaTag('name', 'twitter:title', title);
        }
        if (description) {
            setMetaTag('name', 'description', description);
            setMetaTag('property', 'og:description', description);
            setMetaTag('name', 'twitter:description', description);
        }

        const url = `${SITE_URL}${path}`;
        setLinkTag('canonical', url);
        setMetaTag('property', 'og:url', url);

        const addedAlternates = [];
        if (alternates) {
            Object.entries(alternates).forEach(([hreflang, altPath]) => {
                const el = document.createElement('link');
                el.setAttribute('rel', 'alternate');
                el.setAttribute('hreflang', hreflang);
                el.setAttribute('href', `${SITE_URL}${altPath}`);
                document.head.appendChild(el);
                addedAlternates.push(el);
            });
        }

        return () => {
            addedAlternates.forEach((el) => el.remove());
        };
    }, [title, description, path, alternates]);

    return null;
};

export default SEO;
