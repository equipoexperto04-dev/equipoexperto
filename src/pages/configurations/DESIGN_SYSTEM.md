# Config Page Design System v3

## Overview

A precision utility design system for employee configuration pages. Provides consistent layout, typography, spacing, and interaction patterns across all automation setup interfaces.

## Core Principles

1. **Consistency**: All config pages share identical layout structure
2. **Clarity**: Clear visual hierarchy with minimal cognitive load
3. **Efficiency**: Two-column layout with sticky sidebar for quick actions
4. **Feedback**: Immediate visual feedback for all interactions
5. **Accessibility**: WCAG 2.1 AA compliant with proper contrast and focus states

## File Structure

```
src/pages/configurations/
├── Config.css                 # Master stylesheet (v3 Precision Utility)
├── ConfigPageTemplate.jsx     # React component template
├── DESIGN_SYSTEM.md           # This documentation
├── LeadCapture.jsx           # Lead Scout config (Blue accent)
├── LeadFollowUp.jsx          # Follow-up Agent config (Purple accent)
└── ReviewFunnel.jsx          # Review Funnel config (Orange accent)
```

## CSS Architecture

### CSS Variables

Each config page sets these custom properties on the root `.cfg-page` element:

```css
.cfg-page {
    --cfg-accent: #3b82f6;          /* Employee brand color */
    --cfg-accent-bg: rgba(59,130,246,0.06);
    --cfg-accent-border: rgba(59,130,246,0.2);
    --cfg-radius: 14px;
    --cfg-radius-sm: 10px;
    --cfg-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --cfg-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
}
```

### Employee Color Coding

| Employee | Accent Color | CSS Variable |
|----------|-------------|--------------|
| LeadCapture | Blue | `#3b82f6` |
| ReviewFunnel | Orange/Amber | `#f59e0b` |
| LeadFollowUp | Purple/Violet | `#8b5cf6` |
| Future employees | Choose unique | Document here |

## Layout Structure

### Header Pattern

```jsx
<header className="cfg-header">
    <div className="cfg-header-left">
        <button className="cfg-back-btn"><ArrowLeft /></button>
        <div className="cfg-employee-avatar" style={{ background: `${ACCENT}20` }}>
            <Icon style={{ color: ACCENT }} />
        </div>
        <div className="cfg-employee-info">
            <h1 className="cfg-employee-name">{t('empTitle')}</h1>
            <p className="cfg-employee-desc">{t('cfgDesc')}</p>
        </div>
    </div>
    <div className="cfg-header-right">
        <div className={`cfg-status-badge ${isActive ? 'active' : ''}`}>
            <div className={`cfg-status-dot ${isActive ? 'active' : 'idle'}`} />
            {isActive ? t('statusWorking') : t('statusOffDuty')}
        </div>
        {hasChanges && (
            <button className="cfg-save-header-btn">
                <Save /> {t('save')}
            </button>
        )}
    </div>
</header>
```

### Tab Navigation

```jsx
<div className="cfg-tabs-wrap">
    <div className="cfg-tabs">
        {TABS.map(tab => (
            <button
                key={tab.key}
                className={`cfg-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
            >
                <span className="cfg-tab-icon">{tab.icon}</span>
                <span className="cfg-tab-label">{tab.label}</span>
                <span className="cfg-tab-sub">{tab.sub}</span>
            </button>
        ))}
    </div>
</div>
```

### Two-Column Grid

```jsx
<div className="settings-grid-layout">
    {/* Left: Main content */}
    <div className="flex flex-col gap-5">
        {/* Tabs */}
        {/* Form panels */}
    </div>
    
    {/* Right: Sticky sidebar */}
    <aside className="sticky-top flex flex-col gap-4">
        {/* Quick actions */}
        {/* Status cards */}
    </aside>
</div>
```

## Component Patterns

### Main Content Panel

```jsx
<div className="cfg-panel">
    <div className="cfg-section-head">
        <Icon style={{ color: ACCENT }} />
        <h3 className="cfg-section-title">{t('cfgSectionTitle')}</h3>
        <Tooltip text={t('cfgTooltip')} />
    </div>
    
    <div className="cfg-field">
        <label className="cfg-label">{t('cfgLabel')}</label>
        <div className="cfg-input-wrap">
            <Icon className="cfg-input-icon" />
            <input className="cfg-input" />
        </div>
        <p className="cfg-hint">{t('cfgHint')}</p>
    </div>
</div>
```

### Sidebar Card

```jsx
<div className="cfg-sidebar-card" style={{ borderTop: `3px solid ${ACCENT}` }}>
    <div className="cfg-section-head">
        <Icon style={{ color: ACCENT }} />
        <h3 className="cfg-section-title">{t('cfgCardTitle')}</h3>
    </div>
    {/* Card content */}
</div>
```

### Upload Component

```jsx
<div className="cfg-upload-card">
    <div className="cfg-upload-label-row">
        <Icon style={{ color: ACCENT }} />
        {t('cfgUploadTitle')}
    </div>
    <p className="cfg-upload-desc">{t('cfgUploadDesc')}</p>
    <label className={`cfg-upload-btn ${isUploading ? 'disabled' : ''}`}>
        <input type="file" className="hidden" onChange={handleUpload} />
        {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {isUploading ? t('cfgUploading') : t('cfgChooseFile')}
    </label>
    {uploadSuccess && <div className="cfg-upload-success">{uploadSuccess}</div>}
</div>
```

### Variable Pills (for message templates)

```jsx
<div className="cfg-pills">
    {['{NAME}', '{EMAIL}', '{PHONE}'].map(v => (
        <button key={v} className="cfg-pill" onClick={() => insertVariable(v)}>
            {v}
        </button>
    ))}
</div>
```

## Translation Keys

### Core Keys (Required)

```javascript
// Status
t('statusWorking')        // "Working"
t('statusOffDuty')        // "Off Duty"
t('statusActive')         // "Active"
t('statusInactive')       // "Inactive"

// Actions
t('save')                 // "Save"
t('saving')               // "Saving…"
t('cfgSaveChanges')       // "Save Changes"
t('cfgSaving')            // "Saving…"

// Navigation
t('cfgBackToTeam')        // "Back to Team"
t('cfgSettingsSaved')     // "Settings Saved"

// Status descriptions
t('cfgStatusActiveDesc')  // Active state description
t('cfgStatusInactiveDesc') // Inactive state description
```

### Per-Employee Keys

```javascript
// Employee identification
t('empLeadTitle')         // "Lead Scout"
t('empReviewTitle')       // "Review Funnel"
t('empFollowTitle')       // "Follow-up Agent"

// Employee descriptions
t('cfgLeadDesc')          // "Captures & qualifies leads automatically."
t('cfgReviewDesc')        // "Collects 5-star Google reviews on autopilot."
t('cfgFollowDesc')        // "Re-engages cold leads automatically."
```

## Responsive Breakpoints

```css
/* Desktop: Full two-column layout */
@media (min-width: 961px) {
    .settings-grid-layout { grid-template-columns: 1fr 360px; }
}

/* Tablet/Mobile: Single column */
@media (max-width: 960px) {
    .settings-grid-layout { grid-template-columns: 1fr; }
    .sticky-top { position: static; }
}

/* Mobile: Compact header */
@media (max-width: 600px) {
    .cfg-employee-desc { display: none; }
    .cfg-save-header-btn span { display: none; }
}
```

## Animation & Transitions

```css
/* Standard transition */
transition: all 0.15s ease;

/* Page load */
.animate-fade-in { animation: fadeIn 0.3s ease-out; }

/* Loading spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.wa-loader { animation: spin 0.75s linear infinite; }

/* Status pulse */
@keyframes cfg-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
    50% { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}
```

## Best Practices

### Do

- Use the CSS variables for theming
- Implement `hasChanges` detection for save button visibility
- Show loading states during API calls
- Use the `once()` utility for file reader callbacks
- Implement proper error handling with user-friendly messages
- Use `sticky-top` for sidebar cards
- Include tooltips for complex features

### Don't

- Hardcode colors (use CSS variables)
- Show save button when no changes exist
- Block the UI during long operations (use loading states)
- Mix different layout patterns between pages
- Forget to handle 404 redirects for non-hired employees
- Use different spacing units (stick to the system)

## Creating a New Config Page

1. **Copy the template**: `cp ConfigPageTemplate.jsx YourConfig.jsx`

2. **Set your accent color**: 
   ```jsx
   const ACCENT = '#your-color';
   ```

3. **Define your tabs**:
   ```jsx
   const TABS = [
       { key: 'main', icon: <Settings size={15} />, label: t('cfgTabMain'), sub: t('cfgTabMainSub') },
   ];
   ```

4. **Add translations** to `LanguageContext.jsx`

5. **Connect your API** endpoints

6. **Test responsive** behavior at 960px and 600px breakpoints

## Migration Guide

### From v2 to v3

1. Replace `premium-card` with `cfg-panel` for main content
2. Update header to use `cfg-header` classes
3. Replace custom tabs with `cfg-tabs` structure
4. Move sidebar content to `sticky-top` container
5. Add CSS variables to root element
6. Update status badges to use `cfg-status-badge`
7. Replace manual save buttons with `hasChanges` conditional

## Changelog

### v3.0 (Current)
- Unified CSS variable system
- Consistent two-column layout
- Sticky sidebar pattern
- Simplified component structure
- Improved responsive behavior

### v2.0
- Individual card-based layouts
- Custom tab implementations
- Mixed spacing systems

## Support

For questions or improvements to this design system, refer to:
- `Config.css` — All styling definitions
- `ConfigPageTemplate.jsx` — Working component example
- This documentation
