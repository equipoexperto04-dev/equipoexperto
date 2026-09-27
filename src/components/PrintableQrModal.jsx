import React, { useState, useRef } from 'react';
import { Download, X, Printer, Sparkles, CheckCircle2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const PrintableQrModal = ({ isOpen, onClose, employeeName = "Digital Employee", qrUrl = "" }) => {
    const [title, setTitle] = useState(`Scan to give feedback for ${employeeName}`);
    const [subtitle, setSubtitle] = useState("Your opinion helps us improve our service");
    const [accentColor, setAccentColor] = useState("#6366f1");
    const [isGenerating, setIsGenerating] = useState(false);
    const printCardRef = useRef(null);

    if (!isOpen) return null;

    const handleDownloadPdf = async () => {
        if (!printCardRef.current) return;
        setIsGenerating(true);

        const element = printCardRef.current;
        const opt = {
            margin:       0.5,
            filename:     `${employeeName.toLowerCase().replace(/\s+/g, '_')}_printable_qr.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 3, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error('PDF Generation failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const targetQrSrc = qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin)}`;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8'
                        }}>
                            <Printer size={22} />
                        </div>
                        <div>
                            <h2 style={{ color: '#fff', margin: 0, fontSize: '20px', fontWeight: 700 }}>
                                High-Res Printable QR Code
                            </h2>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>
                                Format branded promotional assets for physical print (flyers, table tents, displays)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body Content: Split Settings & Canvas Preview */}
                <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    {/* Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={18} color="#818cf8" /> Customization Options
                        </h3>

                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                                Main Headline
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                                Subtitle / Instructions
                            </label>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                                Theme Color
                            </label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setAccentColor(color)}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: color,
                                            border: accentColor === color ? '3px solid #fff' : 'none',
                                            cursor: 'pointer',
                                            boxShadow: accentColor === color ? '0 0 10px ' + color : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{
                            marginTop: 'auto',
                            padding: '16px',
                            backgroundColor: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <CheckCircle2 size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ color: '#c7d2fe', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                                Exported PDF is pre-formatted for 300 DPI high-resolution printing. Ready for commercial printers.
                            </p>
                        </div>

                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            style={{
                                backgroundColor: accentColor,
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '14px',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 20px -5px ' + accentColor + '66'
                            }}
                        >
                            <Download size={18} />
                            {isGenerating ? 'Generating PDF...' : 'Download Printable PDF'}
                        </button>
                    </div>

                    {/* Printable Preview Canvas */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #334155'
                    }}>
                        <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
                            Print Preview Card
                        </p>

                        <div
                            ref={printCardRef}
                            style={{
                                width: '320px',
                                backgroundColor: '#ffffff',
                                borderRadius: '20px',
                                padding: '32px 24px',
                                boxShadow: '0 20px 30px rgba(0,0,0,0.3)',
                                textAlign: 'center',
                                color: '#0f172a',
                                borderTop: `10px solid ${accentColor}`
                            }}
                        >
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: accentColor, textTransform: 'uppercase', marginBottom: '8px' }}>
                                Equipo Experto
                            </div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                                {title}
                            </h4>
                            <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748b' }}>
                                {subtitle}
                            </p>

                            <div style={{
                                width: '180px',
                                height: '180px',
                                margin: '0 auto 16px auto',
                                padding: '12px',
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                border: '2px solid #f1f5f9',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img
                                    src={targetQrSrc}
                                    alt="Print QR Code"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>

                            <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                Point camera to scan & complete
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableQrModal;
