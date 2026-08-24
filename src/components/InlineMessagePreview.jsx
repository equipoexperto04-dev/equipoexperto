import React, { useState, useEffect } from 'react';
import { 
    Mail, Eye, MessageSquare, Smartphone, Check, CheckCheck, 
    MoreVertical, Phone, Video, ArrowLeft, MoreHorizontal, 
    Star, CornerUpLeft, Search, ChevronDown, X, Minimize2, 
    Maximize2, Paperclip, Smile, Image, Underline, Bold, Italic, 
    Link2, AlignLeft, Send, Trash, Layout, ChevronLeft, Minus, MinusSquare, CheckCircle2
} from 'lucide-react';

const InlineMessagePreview = ({ message, activeChannels = { whatsapp: true, email: true } }) => {
    // Initial active tab selection
    const [activeTab, setActiveTab] = useState(activeChannels.whatsapp ? 'whatsapp' : 'email');

    // Dynamic selection if props change (e.g. if whatsapp is disabled while looking at it)
    useEffect(() => {
        if (!activeChannels[activeTab]) {
            if (activeChannels.whatsapp) setActiveTab('whatsapp');
            else if (activeChannels.email) setActiveTab('email');
        }
    }, [activeChannels]);

    // Process message with sample data
    const getPreviewText = (template) => {
        if (!template) return '';
        // Handle both upper and lower case variables
        return template
            .replace(/\{NAME\}/gi, 'Maria García')
            .replace(/\{LINK\}/gi, 'https://equipoexperto.com/r/4829')
            .replace(/\{NUMBER\}/gi, '+92 319 7129228');
    };

    const processedMessage = getPreviewText(message);

    if (!activeChannels.whatsapp && !activeChannels.email) {
        return (
            <div className="preview-error-box">
                <Smartphone size={32} className="error-icon" />
                <h3>No Preview Channels Active</h3>
                <p>Enable WhatsApp or Email alerts to see live previews.</p>
            </div>
        );
    }

    return (
        <div className="message-preview-container animate-fade-in">
            {/* Header / Tab Switcher */}
            <div className="preview-tabs">
                {activeChannels.whatsapp && (
                    <button
                        type="button"
                        onClick={() => setActiveTab('whatsapp')}
                        className={`preview-tab-btn ${activeTab === 'whatsapp' ? 'active whatsapp' : ''}`}
                    >
                        <MessageSquare size={14} />
                        WhatsApp
                    </button>
                )}
                {activeChannels.email && (
                    <button
                        type="button"
                        onClick={() => setActiveTab('email')}
                        className={`preview-tab-btn ${activeTab === 'email' ? 'active email' : ''}`}
                    >
                        <Mail size={14} />
                        Gmail Compose
                    </button>
                )}
            </div>

            {/* Main Preview Area */}
            <div className="preview-viewport">
                
                {/* WHATSAPP IPHONE MOCKUP */}
                {activeTab === 'whatsapp' && (
                    <div className="iphone-frame">
                        <div className="iphone-inner">
                            {/* StatusBar */}
                            <div className="whatsapp-status-bar">
                                <span className="time">12:34</span>
                                <div className="icons">
                                    <div className="battery-v"></div>
                                </div>
                            </div>

                            {/* WhatsApp Header */}
                            <div className="whatsapp-header-flow">
                                <ArrowLeft size={20} className="wa-icon" />
                                <div className="wa-avatar">MC</div>
                                <div className="wa-info">
                                    <span className="wa-name">TimelessPearls</span>
                                    <span className="wa-status">online</span>
                                </div>
                                <div className="wa-actions">
                                    <Video size={18} />
                                    <Phone size={18} />
                                    <MoreVertical size={18} />
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="whatsapp-chat-body">
                                <div className="wa-date-pill">Today</div>
                                
                                <div className="wa-message-row">
                                    <div className="wa-bubble received">
                                        <p>{processedMessage || 'Writing your message...'}</p>
                                        <div className="wa-bubble-meta">
                                            <span>12:34 PM</span>
                                            <CheckCheck size={14} className="wa-checks" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="whatsapp-footer-flow">
                                <div className="wa-input-pill">
                                    <Smile size={20} className="wa-grey-icon" />
                                    <span>Type a message</span>
                                    <Paperclip size={20} className="wa-grey-icon rotate" />
                                </div>
                                <div className="wa-mic-btn">
                                    <Smartphone size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* GMAIL COMPOSE MOCKUP */}
                {activeTab === 'email' && (
                    <div className="gmail-compose-window">
                        <div className="gmail-header text-white">
                            <span className="font-bold text-xs uppercase tracking-widest">New message</span>
                            <div className="header-actions">
                                <Minus size={16} />
                                <Maximize2 size={14} />
                                <X size={18} />
                            </div>
                        </div>

                        <div className="gmail-meta">
                            <div className="meta-row">
                                <span className="meta-label">To</span>
                                <div className="meta-recipient">
                                    <div className="avatar-small">M</div>
                                    Maria García
                                    <X size={10} className="ml-1 opacity-60" />
                                </div>
                                <span className="meta-options">Cc Bcc</span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">Subject</span>
                                <span className="meta-subject">🚀 Important Update Regarding Your Inquiry</span>
                            </div>
                        </div>

                        <div className="gmail-body">
                            <div className="gmail-content">
                                {processedMessage || 'Drafting notification...'}
                            </div>
                        </div>

                        <div className="gmail-footer">
                            <div className="gmail-toolbar">
                                <div className="font-selector">Sans Serif <ChevronDown size={14} /></div>
                                <div className="format-icons">
                                    <Bold size={14} />
                                    <Italic size={14} />
                                    <Underline size={14} />
                                    <Link2 size={16} />
                                    <Smile size={16} />
                                    <Image size={16} />
                                </div>
                                <div className="flex-1"></div>
                                <Trash size={16} className="text-gray-400 hover:text-red-500 transition-colors" />
                            </div>

                            <div className="gmail-send-row">
                                <button className="gmail-send-btn">
                                    Send
                                    <span className="wa-divider"></span>
                                    <ChevronDown size={16} />
                                </button>
                                <div className="font-bold text-[10px] text-gray-500 tracking-widest flex items-center gap-1">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> DRAFT SAVED
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="preview-footer-tip">
                <span className="dot"></span>
                PREVIEW: VARIABLES LIKE <span className="var">{"{NAME}"}</span> ARE AUTOMATICALLY REPLACED WITH TEST DATA.
            </div>

            {/* EMBEDDED STYLES TO ENSURE CONSISTENT UI REGARDLESS OF PARENT CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                .message-preview-container {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    width: 100%;
                }

                .preview-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    background: rgba(0, 0, 0, 0.03);
                    padding: 0.4rem;
                    border-radius: 1.25rem;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    align-self: center;
                }

                .preview-tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.25rem;
                    border-radius: 1rem;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                    color: rgba(0,0,0,0.4);
                }

                .preview-tab-btn.active {
                    background: white;
                    color: #000;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
                }

                .preview-tab-btn.active.whatsapp {
                    color: #2563eb;
                    border-color: rgba(37, 99, 235, 0.1);
                }

                .preview-tab-btn.active.email {
                    color: #2563eb;
                    border-color: rgba(37, 99, 235, 0.1);
                }

                .preview-viewport {
                    min-height: 500px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: rgba(0,0,0,0.02);
                    border-radius: 2rem;
                    padding: 2rem;
                    border: 1px dashed rgba(0,0,0,0.08);
                    position: relative;
                }

                /* IPHONE MOCKUP CSS */
                .iphone-frame {
                    width: 300px;
                    height: 600px;
                    background: #1a1a1a;
                    border-radius: 50px;
                    padding: 12px;
                    border: 4px solid #333;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    position: relative;
                }

                .iphone-inner {
                    width: 100%;
                    height: 100%;
                    background: #efe7de;
                    border-radius: 40px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .whatsapp-status-bar {
                    background: #075e54;
                    height: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 20px;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                }

                .whatsapp-header-flow {
                    background: #075e54;
                    padding: 10px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: white;
                }

                .wa-avatar {
                    width: 32px;
                    height: 32px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 10px;
                }

                .wa-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .wa-name { font-size: 13px; font-weight: bold; }
                .wa-status { font-size: 9px; opacity: 0.7; }

                .wa-actions {
                    display: flex;
                    gap: 12px;
                    opacity: 0.8;
                }

                .whatsapp-chat-body {
                    flex: 1;
                    padding: 16px;
                    position: relative;
                    background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
                    background-size: contain;
                }

                .wa-date-pill {
                    background: white;
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 9px;
                    font-weight: bold;
                    color: #555;
                    margin: 0 auto 20px;
                    width: fit-content;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.1);
                    text-transform: uppercase;
                }

                .wa-bubble {
                    background: white;
                    padding: 8px 12px;
                    border-radius: 0 12px 12px 12px;
                    max-width: 85%;
                    font-size: 13px;
                    line-height: 1.4;
                    color: #111;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.1);
                    position: relative;
                    word-break: break-word;
                    overflow-wrap: break-word;
                    word-break: break-all;
                }

                .wa-bubble::before {
                    content: '';
                    position: absolute;
                    left: -8px;
                    top: 0;
                    width: 0;
                    height: 0;
                    border-style: solid;
                    border-width: 0 10px 10px 0;
                    border-color: transparent white transparent transparent;
                }

                .wa-bubble-meta {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 4px;
                    font-size: 9px;
                    color: #999;
                    margin-top: 4px;
                }

                .wa-checks { color: #2563eb; }

                .whatsapp-footer-flow {
                    background: #f0f0f0;
                    padding: 8px 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .wa-input-pill {
                    flex: 1;
                    background: white;
                    height: 36px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    gap: 8px;
                    color: #999;
                    font-size: 14px;
                }

                .wa-grey-icon { color: #999; }
                .rotate { transform: rotate(-45deg); }

                .wa-mic-btn {
                    width: 36px;
                    height: 36px;
                    background: #128c7e;
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* GMAIL COMPOSE CSS */
                .gmail-compose-window {
                    width: 100%;
                    max-width: 550px;
                    background: white;
                    border-radius: 1rem 1rem 0 0;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }

                .gmail-header {
                    background: #1a73e8;
                    padding: 0.75rem 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-actions {
                    display: flex;
                    gap: 1.25rem;
                    opacity: 0.6;
                }

                .gmail-meta {
                    display: flex;
                    flex-direction: column;
                }

                .meta-row {
                    padding: 0.75rem 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .meta-label {
                    width: 50px;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .meta-recipient {
                    background: #f1f5f9;
                    padding: 0.25rem 0.5rem;
                    border-radius: 1rem;
                    font-size: 0.8125rem;
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-weight: 600;
                }

                .avatar-small {
                    width: 18px;
                    height: 18px;
                    background: #2563eb;
                    border-radius: 50%;
                    color: white;
                    font-size: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .meta-options {
                    margin-left: auto;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-weight: bold;
                    cursor: pointer;
                }

                .meta-subject {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .gmail-body {
                    flex: 1;
                    padding: 2rem 1.5rem;
                    min-height: 250px;
                    background: white;
                }

                .gmail-content {
                    font-size: 0.9375rem;
                    line-height: 1.6;
                    color: #334155;
                    white-space: pre-wrap;
                }

                .gmail-footer {
                    padding: 1rem 1.25rem 1.5rem;
                    border-top: 1px solid #f1f5f9;
                    background: white;
                }

                .gmail-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    color: #94a3b8;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid #f8fafc;
                }

                .font-selector {
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: #64748b;
                    font-weight: bold;
                }

                .format-icons {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .gmail-send-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .gmail-send-btn {
                    background: #1a73e8;
                    color: white;
                    padding: 0.6rem 1.25rem;
                    border-radius: 1.5rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .wa-divider {
                    width: 1px;
                    height: 16px;
                    background: rgba(255,255,255,0.2);
                }

                .preview-footer-tip {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    margin-top: 1rem;
                    font-size: 9px;
                    font-weight: 900;
                    color: #64748b;
                    letter-spacing: 0.15em;
                }

                .dot {
                    width: 6px;
                    height: 6px;
                    background: #2563eb;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                .var { color: #2563eb; background: rgba(37, 99, 235, 0.05); padding: 0.1rem 0.3rem; border-radius: 0.25rem; }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
                }

                .preview-error-box {
                    margin-top: 2rem;
                    padding: 3rem;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 2rem;
                    text-align: center;
                }

                .error-icon { color: #d97706; margin-bottom: 1rem; }
            `}} />
        </div>
    );
};

export default InlineMessagePreview;
