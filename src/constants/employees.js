import { Star, Users, Zap } from 'lucide-react';

/** Single source of truth for the three digital employees */
export const EMPLOYEES = [
    {
        key: 'reviewFunnel',
        goal: 'review',
        titleKey: 'empReviewTitle',
        shortKey: 'empReviewShort',
        taglineKey: 'empReviewTagline',
        doesKey: 'empReviewDoes',
        nextKey: 'empReviewNext',
        configPath: '/dashboard/config/review-funnel',
        wizardPath: '/dashboard/employee/review',
        Icon: Star,
        color: '#f59e0b',
        colorBg: 'rgba(245,158,11,0.1)',
    },
    {
        key: 'leadCapture',
        goal: 'capture',
        titleKey: 'empLeadTitle',
        shortKey: 'empLeadShort',
        taglineKey: 'empLeadTagline',
        doesKey: 'empLeadDoes',
        nextKey: 'empLeadNext',
        configPath: '/dashboard/config/lead-capture',
        wizardPath: '/dashboard/employee/capture',
        Icon: Users,
        color: '#3b82f6',
        colorBg: 'rgba(59,130,246,0.1)',
    },
    {
        key: 'leadFollowUp',
        goal: 'followup',
        titleKey: 'empFollowTitle',
        shortKey: 'empFollowShort',
        taglineKey: 'empFollowTagline',
        doesKey: 'empFollowDoes',
        nextKey: 'empFollowNext',
        configPath: '/dashboard/config/lead-followup',
        wizardPath: '/dashboard/employee/followup',
        Icon: Zap,
        color: '#8b5cf6',
        colorBg: 'rgba(139,92,246,0.1)',
    },
];

export function getEmployeeByGoal(goal) {
    return EMPLOYEES.find((e) => e.goal === goal);
}

export function getEmployeeByKey(key) {
    return EMPLOYEES.find((e) => e.key === key);
}

export function getEmployeeByPath(pathname) {
    if (!pathname) return null;
    return (
        EMPLOYEES.find(
            (e) => pathname.startsWith(e.configPath) || pathname.startsWith(e.wizardPath)
        ) || null
    );
}

/** Hire/setup wizard for a goal (review | capture | followup). */
export function getEmployeeWizardPath(goal) {
    const emp = getEmployeeByGoal(goal);
    return emp?.wizardPath ?? '/dashboard/employee-gallery';
}
