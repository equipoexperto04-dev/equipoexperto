import React from 'react';
import { Settings, Play, CheckCircle2, Clock, Trash2, Zap, Star, UserPlus, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ToggleSwitch from './ToggleSwitch';

const RecipeCard = ({ title, description, isActive, configPath, onToggle, lastTrigger, isConfigured = true, onCreate, onDelete, prompt, icon = Zap }) => {
    const navigate = useNavigate();

    return (
        <div className={`premium-card group flex flex-col min-h-[300px] ${isActive ? 'active' : ''} ${!isConfigured ? 'opacity-90' : ''}`}>
            <div className="flex-1">
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                        {/* Icon with rounded square container - consistent styling */}
                        <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center transition-all ${isActive ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'bg-[#DCFCE7]'}`}>
                            {React.createElement(icon, { size: 20, color: isActive ? "currentColor" : "#15803D", strokeWidth: 2 })}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg tracking-tight mb-1 truncate max-w-[160px]">{title}</h3>
                            {/* Engine Live Status Badge */}
                            {isConfigured ? (
                                <div className="inline-flex items-center gap-2">
                                    <div className={`status-pill status-${isActive ? 'live' : 'paused'}`}>
                                        <div className="status-dot"></div>
                                        <span>{isActive ? 'Engine Live' : 'Paused'}</span>
                                    </div>
                                    {/* Always show timestamp for consistent height */}
                                    {lastTrigger ? (
                                        <span className="text-[10px] font-medium text-secondary opacity-70 flex items-center gap-1">
                                            <Clock size={10} />
                                            {lastTrigger}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-secondary opacity-50 flex items-center gap-1">
                                            <Clock size={10} />
                                            Recently active
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2">
                                     <div className="status-pill status-awaiting">
                                        <div className="status-dot"></div>
                                        <span>Awaiting Setup</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-secondary opacity-50 flex items-center gap-1">
                                        <Clock size={10} />
                                        Est. 2 mins
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isConfigured && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="p-2 text-secondary hover:text-danger opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-danger/5"
                                title="Delete Automation"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        {isConfigured && <ToggleSwitch checked={isActive} onChange={onToggle} />}
                    </div>
                </div>
                <p className="text-secondary text-[13px] font-medium leading-relaxed mb-8">{description}</p>
            </div>

            <div className="flex flex-col gap-4">
                {isConfigured ? (
                    <button
                        className="btn-primary w-full shadow-lg"
                        onClick={() => navigate(configPath)}
                    >
                        <Settings size={16} strokeWidth={2.5} />
                        Configure Logic
                    </button>
                ) : (
                    <button
                        className="btn-primary w-full shadow-lg bg-accent hover:bg-accent-hover"
                        onClick={onCreate}
                    >
                        <Play size={16} strokeWidth={2.5} fill="currentColor" />
                        Setup Engine
                    </button>
                )}
            </div>
        </div>
    );
};

export default RecipeCard;
