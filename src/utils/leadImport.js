import Papa from 'papaparse';
import API_URL from '../config.js';
import { parseRawRows } from './parseLeads.js';
import { normalizeLeadGroup } from '../constants/leadGroups.js';

function parseVCF(text) {
    const unfolded = text.replace(/\r?\n[ \t]/g, '');
    const cards = unfolded.split(/BEGIN:VCARD/gi).slice(1);

    return cards
        .map(card => {
            const obj = {};
            const fn = card.match(/^FN[^:\r\n]*:(.+)/mi);
            if (fn) obj.name = fn[1].trim();
            if (!obj.name) {
                const n = card.match(/^N[^:\r\n]*:(.+)/mi);
                if (n) {
                    const parts = n[1].split(';').map(p => p.trim()).filter(Boolean);
                    obj.name = parts.length > 1
                        ? `${parts[1]} ${parts[0]}`.trim()
                        : parts[0] || '';
                }
            }
            const tels = [...card.matchAll(/^TEL[^:\r\n]*:(.+)/gmi)];
            if (tels.length) obj.phone = tels[0][1].trim();
            const emails = [...card.matchAll(/^EMAIL[^:\r\n]*:(.+)/gmi)];
            if (emails.length) obj.email = emails[0][1].trim();
            const org = card.match(/^ORG[^:\r\n]*:(.+)/mi);
            if (org) obj.group = org[1].split(';')[0].trim();
            const note = card.match(/^NOTE[^:\r\n]*:(.+)/mi);
            if (note) obj.notes = note[1].trim().replace(/\\n/g, ' ');
            return obj;
        })
        .filter(o => o.name || o.phone || o.email);
}

export function readLeadsSpreadsheet(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                delimiter: ext === 'tsv' ? '\t' : '',
                complete: (r) => {
                    if (!r.data.length) reject(new Error('csv_read_error'));
                    else resolve(r.data);
                },
                error: () => reject(new Error('csv_read_error')),
            });
        });
    }

    if (ext === 'vcf') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const rows = parseVCF(ev.target.result || '');
                    if (!rows.length) reject(new Error('no_contacts_found'));
                    else resolve(rows);
                } catch {
                    reject(new Error('vcf_read_error'));
                }
            };
            reader.onerror = () => reject(new Error('file_read_error'));
            reader.readAsText(file);
        });
    }

    if (['xlsx', 'xls', 'ods'].includes(ext)) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const { read, utils } = await import('xlsx');
                    const wb = read(ev.target.result, { type: 'array' });
                    const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
                        header: 1,
                        defval: '',
                    });
                    resolve(rows);
                } catch {
                    reject(new Error('xlsx_read_error'));
                }
            };
            reader.onerror = () => reject(new Error('file_read_error'));
            reader.readAsArrayBuffer(file);
        });
    }

    return Promise.reject(new Error('unsupported_file_type'));
}

const MAX_CHUNK_LEADS = 2000;
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;

export function computeImportChunkSize(leads) {
    if (!leads.length) return 500;
    const sampleN = Math.min(40, leads.length);
    const sample = JSON.stringify(leads.slice(0, sampleN));
    const bytesPerLead = Math.max(180, Math.ceil(sample.length / sampleN));
    const bySize = Math.floor(MAX_CHUNK_BYTES / bytesPerLead);
    return Math.min(MAX_CHUNK_LEADS, Math.max(250, bySize), leads.length);
}

async function postImportRequest(body) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/leads/import`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'import_failed');
    }
    return data;
}

/**
 * Import rows in large chunks; messaging + owner alert run once after all chunks finish.
 * @param {object} opts
 * @param {'capture'|'followup'|'review'} [opts.importPurpose]
 */
export async function postLeadsImport({
    leads,
    folderName,
    followupMessage,
    source = 'Imported',
    skipCapture = false,
    importPurpose = skipCapture ? 'followup' : 'capture',
}) {
    const group = normalizeLeadGroup(folderName);
    const payload = leads.map((l) => ({ ...l, lead_group: group }));
    const purpose = importPurpose || (skipCapture ? 'followup' : 'capture');

    const chunkSize = computeImportChunkSize(payload);
    const chunks = [];
    for (let i = 0; i < payload.length; i += chunkSize) {
        chunks.push(payload.slice(i, i + chunkSize));
    }

    let imported = 0;
    let fileDups = 0;
    let dbDups = 0;
    let total = 0;

    for (let i = 0; i < chunks.length; i++) {
        const data = await postImportRequest({
            leads: chunks[i],
            folderName: group,
            leadGroup: group,
            followupMessage: i === 0 ? (followupMessage?.trim() || undefined) : undefined,
            sourceHint: source,
            skipCapture,
            importPurpose: purpose,
            runPostImport: false,
        });
        imported += data.imported ?? 0;
        fileDups += data.fileDups ?? 0;
        dbDups += data.dbDups ?? 0;
        total += data.total ?? chunks[i].length;
    }

    if (imported > 0) {
        try {
            await postImportRequest({
                leads: [],
                folderName: group,
                leadGroup: group,
                sourceHint: source,
                skipCapture,
                importPurpose: purpose,
                runPostImport: true,
                notifyImportedCount: imported,
                followupMessage: followupMessage?.trim() || undefined,
                fileDups,
                dbDups,
            });
        } catch (finalizeErr) {
            // Older API returns 400 for empty leads[] — chunks already saved
            const msg = String(finalizeErr?.message || '');
            if (!msg.includes('No leads provided')) {
                throw finalizeErr;
            }
            console.warn('[import] Post-import messaging skipped — deploy latest API server');
        }
    }

    return {
        success: true,
        imported,
        fileDups,
        dbDups,
        total,
        folderName: group,
        importPurpose: purpose,
    };
}

export async function importLeadsFromFile(file, {
    folderName,
    followupMessage,
    source,
    skipCapture,
    importPurpose,
}) {
    const rawRows = await readLeadsSpreadsheet(file);
    const group = normalizeLeadGroup(folderName);

    const leads = parseRawRows(rawRows, source).map((l) => ({
        ...l,
        lead_group: group,
    }));

    if (!leads.length) {
        throw new Error('no_contacts_found');
    }

    return postLeadsImport({
        leads,
        folderName,
        followupMessage,
        source,
        skipCapture,
        importPurpose: importPurpose || (skipCapture ? 'followup' : 'capture'),
    });
}
