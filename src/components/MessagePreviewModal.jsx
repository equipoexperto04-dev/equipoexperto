import React, { useState } from 'react';
import { X, Smartphone, Mail, Eye, MessageSquare } from 'lucide-react';

const MessagePreviewModal = ({ isOpen, onClose, message, activeChannels }) => {
    const [activeTab, setActiveTab] = useState('whatsapp');

    console.log('[MessagePreviewModal] Render check - isOpen:', isOpen, 'message:', message, 'activeChannels:', activeChannels);

    if (!isOpen) return null;

    // Process message with sample data - safe string replace, no eval
    const getPreviewText = (template) => {
        return (template || '')
            .replace(/\{NAME\}/gi, 'Maria García')
            .replace(/\{LINK\}/gi, 'https://maps.google.com/your-business')
            .replace(/\{NUMBER\}/gi, '+923197129228');
    };

    const processedMessage = getPreviewText(message);

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <Eye size={24} className="text-accent" />
                        <h2 className="text-2xl font-black tracking-tight">Message Preview</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                {activeChannels.whatsapp && activeChannels.email && (
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('whatsapp')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all relative cursor-pointer
                                ${activeTab === 'whatsapp' 
                                    ? 'text-green-600 bg-green-50' 
                                    : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <MessageSquare size={18} />
                                <span>WhatsApp</span>
                            </div>
                            {activeTab === 'whatsapp' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all relative cursor-pointer
                                ${activeTab === 'email' 
                                    ? 'text-blue-600 bg-blue-50' 
                                    : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Mail size={18} />
                                <span>Gmail</span>
                            </div>
                            {activeTab === 'email' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* WhatsApp Preview */}
                    {activeChannels.whatsapp && activeTab === 'whatsapp' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="font-black text-lg mb-1 flex items-center justify-center gap-2">
                                    <MessageSquare size={20} className="text-green-600" />
                                    WhatsApp Message
                                </h3>
                                <p className="text-sm text-gray-600">How it looks to your leads</p>
                            </div>

                            {/* WhatsApp Chat Background */}
                            <div className="bg-[#ECE5DD] rounded-2xl p-4 min-h-[280px] relative overflow-hidden">
                                {/* Subtle pattern overlay */}
                                <div className="absolute inset-0 opacity-5" style={{
                                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}></div>
                                
                                {/* WhatsApp Header Bar */}
                                <div className="bg-[#075E54] text-white px-4 py-3 rounded-t-xl -mx-4 -mt-4 mb-4 flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold">B</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">Your Business</p>
                                        <p className="text-xs opacity-80">online</p>
                                    </div>
                                </div>

                                {/* Message Bubble */}
                                <div className="flex justify-start relative z-10">
                                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] shadow-md">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                            {processedMessage || 'Your message will appear here...'}
                                        </p>
                                        <div className="flex items-center justify-end gap-1 mt-2">
                                            <span className="text-[10px] text-gray-400">12:34 PM</span>
                                            <span className="text-[10px] text-blue-500">✓✓</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gmail Preview */}
                    {activeChannels.email && activeTab === 'email' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="font-black text-lg mb-1 flex items-center justify-center gap-2">
                                    <Mail size={20} className="text-blue-600" />
                                    Gmail Notification
                                </h3>
                                <p className="text-sm text-gray-600">Alert sent to your inbox</p>
                            </div>

                            {/* Email Container */}
                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                {/* Email Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">M</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">Equipo Experto</p>
                                            <p className="text-xs opacity-80">noreply@equipoexperto.com</p>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-base">🚀 New Lead Captured!</h4>
                                </div>

                                {/* Email Body */}
                                <div className="p-6 bg-white">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <p className="text-sm text-gray-700 mb-3 font-semibold">
                                                📊 New lead activity detected:
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div><strong>Name:</strong> <span className="text-gray-700">Maria García</span></div>
                                                <div><strong>Phone:</strong> <span className="text-gray-700">+923197129228</span></div>
                                                <div><strong>Source:</strong> <span className="text-gray-700">WhatsApp Chat</span></div>
                                                <div><strong>Time:</strong> <span className="text-gray-700">Just now</span></div>
                                            </div>
                                        </div>

                                        {message && (
                                            <div>
                                                <p className="text-sm text-gray-700 mb-2 font-semibold">
                                                    ✅ Auto-response sent:
                                                </p>
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                        {processedMessage || 'Your message will appear here...'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                                            <a
                                                href="#"
                                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline flex items-center gap-1"
                                            >
                                                View in Dashboard
                                                <span>→</span>
                                            </a>
                                            <span className="text-xs text-gray-400">Equipo Experto Platform</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Single Channel Mode - Show directly without tabs */}
                    {!activeChannels.whatsapp && !activeChannels.email && (
                        <div className="text-center py-12 px-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">No Preview Channels Enabled</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Enable WhatsApp or Email notifications in your configuration to see message previews.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                                    WhatsApp: {activeChannels.whatsapp ? '✅' : '❌'}
                                </div>
                                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                                    Email: {activeChannels.email ? '✅' : '❌'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Note */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Variables like {"{NAME}"}, {"{LINK}"}, and {"{NUMBER}"} will be replaced with actual lead data when messages are sent.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagePreviewModal;
