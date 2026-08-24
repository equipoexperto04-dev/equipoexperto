/**
 * Lead parsing utility v2 — strong extraction.
 *
 * Handles:
 *  - CSV / Excel (array-of-arrays or array-of-objects)
 *  - Phones in any international format, embedded in mixed-content cells
 *  - First + Last name column fusion (EN/ES/FR/DE variants)
 *  - Accent-insensitive, separator-insensitive column matching
 *  - Excel scientific-notation / float phone numbers
 *  - Auto header-row detection
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

// ─── Cell normalisation ──────────────────────────────────────────────────────

/** Normalise a cell value.  Excel stores big numbers as floats (e.g. 4.47e+11). */
export const normalizeCell = (cell) => {
    if (cell === null || cell === undefined) return '';
    if (typeof cell === 'number') return Math.round(cell).toString();
    return cell.toString().trim();
};

// ─── Phone extraction ────────────────────────────────────────────────────────

/**
 * Extract the first phone-like sequence from *any* string.
 *
 * Covers:
 *   +34 612 345 678          Spanish international
 *   (+34) 612-345-678        With parens around country code
 *   0034 612 345 678         00-prefix international
 *   612345678                Local no-spaces
 *   (555) 123-4567           US local
 *   +1-800-555-0199          US toll-free
 *   07911 123456             UK
 *   612.345.678              Dot-separated
 *   "Tel: +34 612-345-678"   Embedded in text
 *   447123000000             Pure digit string from Excel float
 *
 * Returns the matched string (original formatting) or '' if nothing valid found.
 */
// Dates look like phone numbers (digits + dashes). Reject them first.
// Covers: 2026-04-20  |  20/04/2026  |  04-20-2026  |  2026.04.20
const DATE_RE = /^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}$|^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}$/;

export function extractPhone(raw) {
    const s = normalizeCell(raw);
    if (!s) return '';

    // Reject date-shaped strings before anything else
    if (DATE_RE.test(s)) return '';

    // Pure digit string (already normalised from Excel float or plain number)
    if (/^\d+$/.test(s)) {
        return s.length >= MIN_PHONE_DIGITS && s.length <= MAX_PHONE_DIGITS ? s : '';
    }

    // Phone pattern — greedy scan anywhere in the string:
    //   \+?          optional leading +
    //   \(?          optional (
    //   [\+\d]       then + or digit (handles "(+34)" prefix)
    //   [\d\s\-\.\(\)\/]{5,}   separators + digits, at least 5 chars
    //   \d           must end on a digit
    const PHONE_RE = /(\+?\(?[\+\d][\d\s\-\.\(\)\/]{5,}\d)/g;
    for (const m of s.matchAll(PHONE_RE)) {
        // Skip any match that is itself a date pattern
        if (DATE_RE.test(m[1].trim())) continue;
        const digits = m[1].replace(/\D/g, '');
        if (digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS) {
            return m[1].trim();
        }
    }
    return '';
}

export const isPhone = (s) => extractPhone(s) !== '';
export const isEmail = (s) => EMAIL_RE.test(s);

// ─── Column key matching ─────────────────────────────────────────────────────

/** Strip accents + separators from a key for fuzzy matching. */
const normKey = (k) =>
    k.toLowerCase()
     .normalize('NFD').replace(/[̀-ͯ]/g, '')
     .replace(/[\s_\-\.]+/g, '');

// Column header variants — bilingual EN / ES / FR / DE / PT
const PHONE_COL = ['phone','tel','telefono','celular','movil','mobile','whatsapp','cell',
                   'numero','number','phonenumber','contactnumber','gsm','fon','fono',
                   'ncell','ncel','telf','mob','telefon','handy'];
const NAME_COL  = ['name','nombre','fullname','contactname','contact','person','cliente',
                   'nom','apellido','apellidos','surname','prenom','fname','lname',
                   'first','last','firstname','lastname','nome','nombre'];
const FIRST_COL = ['firstname','nombre','prenom','fname','first','givenname','vorname',
                   'nome','primernom','primeronombre'];
const LAST_COL  = ['lastname','apellido','apellidos','surname','lname','last',
                   'familyname','nom','segundonombre','segundoapellido'];
const NOTE_COL  = ['note','notes','comment','nota','comentario','remarks','obs',
                   'observacion','annot','anotacion'];
const GROUP_COL = ['group','category','segment','school','escuela','colegio','tipo',
                   'categoria','grupo','sector','industry','industria','lista',
                   'list','tag','etiqueta','carpeta','folder'];

const mkLead = (src) => ({
    source: src || 'Imported',
    full_name: '',
    email: '',
    phone: '',
    notes: '',
    lead_group: '',
});

// ─── Row converters ──────────────────────────────────────────────────────────

/** Plain cell-array row → lead (no header available). */
const rowToLead = (cells, source) => {
    const lead = mkLead(source);
    for (const cell of cells) {
        const v = normalizeCell(cell);
        if (!v) continue;
        if (!lead.email && isEmail(v))                          { lead.email = v;          continue; }
        if (!lead.phone) { const p = extractPhone(v); if (p)   { lead.phone = p;           continue; } }
        if (!lead.full_name && v.length > 0 && v.length < 80
            && !/^\d+$/.test(v))                                { lead.full_name = v; }
    }
    return lead;
};

/** Header-keyed object → lead.  Value-pattern takes priority over column name. */
const objToLead = (row, source) => {
    const lead = mkLead(source);
    const entries = Object.entries(row);

    // Pass 1 — value-pattern scan: detect email / phone by content, not column name
    for (const [, val] of entries) {
        const v = normalizeCell(val);
        if (!v) continue;
        if (!lead.email && isEmail(v)) { lead.email = v; continue; }
        if (!lead.phone) { const p = extractPhone(v); if (p) lead.phone = p; }
    }

    // Pass 2 — phone column-name override (wins for explicitly labelled phone columns)
    for (const [key, val] of entries) {
        const k = normKey(key);
        if (!PHONE_COL.some(p => k === normKey(p) || k.includes(normKey(p)))) continue;
        const v = normalizeCell(val);
        if (!v) continue;
        const extracted = extractPhone(v);
        if (extracted) { lead.phone = extracted; break; }
        // Fallback: if column IS a phone column, accept raw digits even if below normal threshold
        const digits = v.replace(/\D/g, '');
        if (digits.length >= 6) { lead.phone = v; break; }
    }

    // Pass 3 — first + last name fusion
    let firstName = '', lastName = '';
    for (const [key, val] of entries) {
        const v = normalizeCell(val);
        if (!v || isEmail(v) || isPhone(v)) continue;
        const k = normKey(key);
        if (!firstName && FIRST_COL.some(p => k === normKey(p))) firstName = v;
        if (!lastName  && LAST_COL.some(p =>  k === normKey(p))) lastName  = v;
    }
    if (firstName || lastName) {
        lead.full_name = [firstName, lastName].filter(Boolean).join(' ').trim();
    }

    // Pass 4 — column-name matching for name / group / notes
    for (const [key, val] of entries) {
        const v = normalizeCell(val);
        if (!v || isEmail(v) || isPhone(v)) continue;
        const k = normKey(key);
        if (!lead.lead_group && GROUP_COL.some(p => k.includes(normKey(p)))) { lead.lead_group = v; continue; }
        if (!lead.full_name  && NAME_COL.some(p =>  k.includes(normKey(p)))) { lead.full_name  = v; continue; }
        if (!lead.notes      && NOTE_COL.some(p =>  k.includes(normKey(p)))) { lead.notes      = v; }
    }

    // Pass 5 — plain-text name fallback (first short non-numeric non-contact string)
    if (!lead.full_name) {
        for (const [, val] of entries) {
            const v = normalizeCell(val);
            if (!v || isEmail(v) || isPhone(v) || /^\d+$/.test(v)) continue;
            if (v.length > 0 && v.length < 80) { lead.full_name = v; break; }
        }
    }

    return lead;
};

// ─── Deduplication ───────────────────────────────────────────────────────────

export const isUseful = (l) => !!(l.email || l.phone || l.full_name);

/** Remove duplicates within the batch (by email, then by raw digit-string of phone). */
export const dedupLeads = (leads) => {
    const seenEmail = new Set();
    const seenPhone = new Set();
    return leads.filter(l => {
        if (l.email) {
            const e = l.email.toLowerCase();
            if (seenEmail.has(e)) return false;
            seenEmail.add(e);
        }
        if (l.phone) {
            const p = l.phone.replace(/\D/g, '');
            if (p && seenPhone.has(p)) return false;
            if (p) seenPhone.add(p);
        }
        return true;
    });
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Convert raw rows (array-of-arrays OR array-of-objects) → cleaned, deduped lead array.
 * Auto-detects whether first row is a header.
 */
export const parseRawRows = (rawRows, source) => {
    if (!rawRows.length) return [];

    if (Array.isArray(rawRows[0])) {
        // Detect header row: if the first row has NO email / phone values, treat as headers
        const firstHasContact = rawRows[0].some(c => {
            const v = normalizeCell(c);
            return isEmail(v) || isPhone(v);
        });

        if (!firstHasContact) {
            const headers = rawRows[0].map((h, i) => normalizeCell(h) || `col${i}`);
            return dedupLeads(
                rawRows.slice(1)
                    .filter(row => row.some(c => normalizeCell(c)))
                    .map(row => {
                        const obj = {};
                        headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
                        return objToLead(obj, source);
                    })
                    .filter(isUseful)
            );
        }

        // No header — pure value matching
        return dedupLeads(
            rawRows
                .filter(row => row.some(c => normalizeCell(c)))
                .map(row => rowToLead(row, source))
                .filter(isUseful)
        );
    }

    // Array-of-objects (PapaParse header:true or pre-parsed VCF/vCard rows)
    return dedupLeads(rawRows.map(row => objToLead(row, source)).filter(isUseful));
};
