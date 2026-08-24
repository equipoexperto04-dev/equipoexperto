Lead Scoring Test Pack
Created for testing lead scoring, enrichment, deduplication, validation, import mapping, and suppression logic.

Recommended usage:
1. Import one file at a time.
2. Compare your system's score output with expected_score_band where available.
3. Check whether invalid, duplicate, missing, consent, and contradictory records are handled correctly.

Files:
- 01_clean_high_fit_b2b_leads.csv: Clean, high-fit decision makers with strong intent, good budgets, recent activity.
- 02_clean_low_fit_leads.csv: Clean data but low-fit profiles, low budget, weak intent, long urgency.
- 03_mixed_quality_realistic_pipeline.csv: Realistic mix of high, medium, and low quality leads.
- 04_missing_optional_fields.csv: Tests whether scoring survives missing non-critical fields.
- 05_missing_critical_fields.csv: Tests penalties or fallbacks for missing important scoring fields.
- 06_invalid_contact_data.csv: Bad emails, missing emails, strange phone formats, and invalid contact records.
- 07_duplicate_and_near_duplicate_leads.csv: Exact and near duplicates by email/company/name with slightly different activity.
- 08_international_formats_currency_dates_phone.csv: Mixed currencies, phone styles, and date formats.
- 09_inconsistent_casing_and_whitespace.csv: Inconsistent casing, whitespace, and normalization edge cases.
- 10_spam_fake_disposable_leads.csv: Disposable emails, fake companies, spammy notes, and test records.
- 11_contradictory_scoring_signals.csv: High-fit fields mixed with low-fit fields to test scoring priority logic.
- 12_numeric_outliers_and_bad_numbers.csv: Negative, huge, blank, text, and impossible numeric values.
- 13_changed_column_order_with_extra_fields.csv: Same core data but shuffled columns plus extra fields.
- 14_minimal_schema_leads.csv: Minimal columns only, useful for import fallback testing.
- 15_consent_compliance_suppression_cases.csv: Opt-outs, do-not-contact, GDPR-region flags, and suppression cases.
