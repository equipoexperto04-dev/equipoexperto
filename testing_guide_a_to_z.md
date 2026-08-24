# Equipo Experto — Complete A to Z Testing Guide

This guide describes how to test the entire SaaS application in production. 

---

## 🚪 Phase 1: Authentication & Onboarding
Validate that authentication, security checks, and session management are operational.

### 1. User Registration (Email Sign Up)
1. Go to **`/register`**.
2. Fill out the registration form (Name, Email, Password) and click **Create Account**.
3. **Verification:** Verify that you are registered and redirected to the `/checkout/starter` billing page.

### 2. Google OAuth (Sign-in Popup)
1. Go to **`/login`**.
2. Click **Continue with Google**.
3. Approve the login inside the Google popup and click **Continue**.
4. **Verification:** The popup must authorize, close, and log you into the dashboard instantly. 

### 3. Forgot / Reset Password
1. Go to **`/forgot-password`**.
2. Enter your email address and click **Send Reset Link**.
3. **Verification:** Check your inbox. You should receive a reset email containing a secure link.
4. Click the link to go to **`/reset-password/:token`**, type a new password, and save.
5. Log in using your new credentials.

---

## 💼 Phase 2: Billing & Plan Entitlements (Stripe)

### 1. Checkout Redirection
1. Open the page **`/checkout/starter`**.
2. Click **Start 30-day trial — €0 due today**.
3. **Verification:** The site should redirect you to Stripe's hosted checkout page showing the Correct Plan and Pricing.

### 2. Admin Plan Entitlement Bypass (Testing Shortcut)
1. If you don't have Stripe keys configured, go to **Render Backend Dashboard** and set:
   * `ADMIN_EMAILS` = `your-email@gmail.com`
2. Log in with `your-email@gmail.com`.
3. **Verification:** You bypass checkout and gain immediate Pro tier dashboard access.

---

## 🤖 Phase 3: Hiring & Configuring Digital Employees

Go to **`/dashboard/employee-gallery`** to view your workforce.

### 1. Hired Employee Wizard
1. Choose an employee (e.g. **Lead Capture Employee** or **Review Funnel Employee**).
2. Click **Configure / Hire**.
3. Follow the multi-step configuration wizard.
4. **Verification:** Click on the variable pills (like `{name}`) below the text fields. Verify the variable inserts at your exact cursor caret position without losing text focus (Bug 34).

### 2. Save Configurations UI
1. Click **Save Changes** on any employee configuration.
2. **Verification:**
   * The save success toast appears.
   * Hover over the Save button; verify the text remains legible (Bug 36).
   * Go to the **Config** code snippet copy section. Hover over the **Copy Code** button. Verify the text color remains bright green and readable (Bug 37).

---

## 📱 Phase 4: Customer-Facing Public Forms

### 1. Review Funnel (The Detractor vs. Promoter Paths)
1. Go to **`/dashboard/config/review-funnel`** and copy the public review URL.
2. Open the URL in an incognito tab (looks like `/r/automation-id`).
3. **Test 1 (Promoter):** Rate the business **5 stars**.
   * **Verification:** The page redirects you to your configured Google Business listing review URL.
4. **Test 2 (Detractor):** Rate the business **2 stars**.
   * **Verification:** The page remains inside the app and loads the internal feedback form. Type a complaint and click submit.

### 2. Lead Capture Web Form
1. Go to **`/dashboard/config/lead-capture`** and copy the web form URL (looks like `/l/automation-id`).
2. Open the URL, fill out the questionnaire fields, and submit.
3. **Verification:** The form shows the thank you page, and a new lead record is logged.

---

## 📊 Phase 5: Dashboard Logs & Analytics

### 1. Lead Verification
1. Go to **Leads** (`/dashboard/leads`).
2. **Verification:** Verify that the lead details you submitted in Phase 4 are displayed in the leads list. Try importing a sample spreadsheet (`.csv`) to test bulk imports.

### 2. Feedback Tracking & Sentiment Gauges
1. Go to **Feedback** (`/dashboard/feedback`).
2. **Verification:** 
   * Verify that the Positive Rate gauge is updated (e.g. 50% positive instead of stuck at 0%).
   * Verify that the 2-star comment is visible in the feedback feed.
   * Hover over the comment text. Verify that a browser tooltip appears displaying the full content of the comment (Bug 35).

---

## ✉️ Phase 6: Outbound Email Testing (Vercel SMTP Relay)

### 1. Platform Support SMTP Test
1. Go to **Settings** → **SMTP** tab.
2. Enter your host SMTP credentials and click **Test SMTP Connection**.
3. **Verification:** Verify that a green check appears and you receive the test verification email in your inbox.
4. *This confirms the Render server successfully bypassed the port block by routing via the Vercel mailer.*

### 2. Hired Agent Outbound Emails
1. Go to **Leads** and select a lead.
2. Click **Send Follow-up**.
3. **Verification:** Check the lead's email inbox to verify delivery.

---

## ⚙️ Phase 7: Profile, Language & Security Settings

### 1. Phone Input Rejection Check
1. Go to **Settings** → **Profile**.
2. Type an invalid phone number (e.g. `phone_number_text_123`) and click Save.
3. **Verification:** Verify the form displays a validation error and blocks the submission. Type a valid format (e.g. `+1 555-0199`) and verify it saves successfully.

### 2. Notification Preferences Toast
1. Go to **Settings** → **Notifications**.
2. Change the toggles and click **Save Preferences**.
3. **Verification:** Verify a green banner "Preferences saved!" appears immediately below the button.

### 3. Deactivate Account
1. Go to **Settings** → **Danger Zone**.
2. Click **Deactivate Account** (it will require password confirmation).
3. **Verification:** The account status changes to inactive and logs you out.
