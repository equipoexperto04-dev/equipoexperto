# Test Import Files for Follow Employee Bulk Upload

These files are designed to test different import scenarios in the Review Funnel bulk upload feature.

## File Descriptions

### 1. test-import-1-standard.csv
**Purpose:** Standard format - basic test case
- Columns: `name`, `email`, `phone`
- 10 leads with complete data
- Standard US phone format
- Various email domains

**Expected:** Should import all 10 leads successfully

---

### 2. test-import-2-extra-columns.csv
**Purpose:** Test handling of extra/unexpected columns
- Columns: `first_name`, `last_name`, `email`, `phone`, `company`, `position`, `notes`, `date_added`
- Split first/last name fields
- Additional metadata columns (company, position, notes, date)
- 10 leads with rich data

**Expected:** Should extract `name` (combining first/last), `email`, `phone` and ignore extra columns

---

### 3. test-import-3-minimal.csv
**Purpose:** Minimal data - email only
- Columns: `email` only
- 10 email addresses, no names or phone numbers
- Tests graceful handling of missing optional fields

**Expected:** Should import with email only, name/phone can be blank or placeholder

---

### 4. test-import-4-phone-first.csv
**Purpose:** Different column order
- Columns: `phone`, `name`, `email` (phone first!)
- Tests if parser handles column order correctly
- Modern/tech company style names

**Expected:** Should map by column header name, not position - all data correctly assigned

---

### 5. test-import-5-mixed-messy.csv
**Purpose:** Real-world messy data
- Columns: `Name`, `Email Address`, `Mobile Number`, `City`, `Industry`
- Different header naming conventions (Title Case, spaces)
- Special characters in names (O'Brien, apostrophe)
- Underscores in emails
- Various industries and cities
- 10 diverse leads

**Expected:** Should normalize column headers (case-insensitive, handle spaces) and import successfully

## Usage

1. Go to Review Funnel configuration page
2. Scroll to "Bulk Review Requests" section
3. Click "Choose File" and select any test file
4. Verify the import processes correctly
5. Check the leads appear in the system

## Success Criteria

- All files should parse without crashing
- Email addresses should always be captured
- Phone numbers should be normalized
- Names should display properly
- Extra columns should be gracefully ignored
- Clear success/error messages shown
