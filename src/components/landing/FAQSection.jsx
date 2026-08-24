import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useLandingContent } from '../../context/LandingContentContext';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="faq-item">
            <button className="faq-question" onClick={onClick}>
                <span>{question}</span>
                <ChevronDown size={20} className={`faq-chevron ${isOpen ? 'open' : ''}`} />
            </button>
            {isOpen && <div className="faq-answer">{answer}</div>}
        </div>
    );
};

const FAQSection = () => {
    const { t } = useTranslation();
    const { landing, pick } = useLandingContent();
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const cmsItems = landing?.faq?.items;
    const faqs = useMemo(() => {
        const fallback = [
            { question: t('faqQ1'), answer: t('faqA1') },
            { question: t('faqQ2'), answer: t('faqA2') },
            { question: t('faqQ3'), answer: t('faqA3') },
            { question: t('faqQ4'), answer: t('faqA4') },
            { question: t('faqQ5'), answer: t('faqA5') },
        ];
        if (Array.isArray(cmsItems) && cmsItems.length > 0) {
            const mapped = cmsItems
                .map((item) => ({
                    question: pick(item?.question),
                    answer: pick(item?.answer),
                }))
                .filter((row) => row.question && row.answer);
            if (mapped.length > 0) return mapped;
        }
        return fallback;
    }, [cmsItems, pick, t]);

    const eyebrow = pick(landing?.faq?.eyebrow) || t('gotQuestions');
    const title = pick(landing?.faq?.title) || t('frequentQuestions');
    const desc = pick(landing?.faq?.description) || t('faqSub');

    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'faq-jsonld';
        script.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
        });
        document.head.appendChild(script);
        return () => script.remove();
    }, [faqs]);

    return (
        <section className="faq-section" id="faq">
            <div className="landing-container">
                <p className="section-eyebrow">{eyebrow}</p>
                <h2 className="section-title">{title}</h2>
                <p className="section-desc">{desc}</p>

                <div className="faq-list">
                    {faqs.map((faq, i) => (
                        <FAQItem
                            key={i}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === i}
                            onClick={() => toggleFAQ(i)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
