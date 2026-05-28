import * as XLSX from 'xlsx';
import { LeadStatus } from '@prisma/client';
import { prisma } from '../../../prisma.js';

type ExcelLeadRow = {
    fullName?: string;
    email?: string;
    phone?: string;
    country?: string;
    preferredCountry?: string;
    preferredCourse?: string;
    source?: string;
    remark?: string;
};

const normalizeHeader = (value: string) =>
    value
        ?.toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

const columnAliases: Record<string, string[]> = {
    fullName: [
        'fullname',
        'name',
        'studentname',
        'leadname',
        'candidate',
        'candidatename',
        'applicantname',
    ],
    email: [
        'email',
        'emailid',
        'emailaddress',
        'mail',
        'mailid',
    ],
    phone: [
        'phone',
        'phonenumber',
        'mobilenumber',
        'mobile',
        'contact',
        'contactnumber',
        'whatsapp',
        'whatsappnumber',
    ],
    country: [
        'country',
        'location',
        'currentcountry',
    ],
    preferredCountry: [
        'preferredcountry',
        'destinationcountry',
        'interestedcountry',
        'studycountry',
    ],
    preferredCourse: [
        'preferredcourse',
        'course',
        'program',
        'interestedcourse',
        'studyprogram',
    ],
    source: [
        'source',
        'leadsource',
        'enquirysource',
        'marketing source',
    ],
    remark: [
        'remark',
        'remarks',
        'note',
        'notes',
        'comment',
    ],
};

const mapRow = (row: any) => {
    const mapped: any = {};

    Object.keys(row).forEach((key) => {
        const normalizedKey = normalizeHeader(key);
        const value = row[key]?.toString().trim();

        if (!value) return;

        for (const [dbField, aliases] of Object.entries(columnAliases)) {
            if (aliases.map(normalizeHeader).includes(normalizedKey)) {
                mapped[dbField] = value;
            }
        }
    });

    return mapped;
};

const calculateLeadScore = (lead: ExcelLeadRow) => {
    let score = 0;

    if (lead.fullName) score += 10;
    if (lead.phone) score += 20;
    if (lead.email) score += 15;
    if (lead.country) score += 10;
    if (lead.preferredCountry) score += 15;
    if (lead.preferredCourse) score += 20;
    if (lead.source) score += 10;

    return Math.min(score, 100);
};

const getOrCreateLeadSource = async (name?: string) => {
    const sourceName = name?.trim() || 'Bulk Excel Upload';

    let source = await prisma.leadSource.findFirst({
        where: { name: sourceName },
    });

    if (!source) {
        source = await prisma.leadSource.create({
            data: {
                name: sourceName,
                sourceType: 'Bulk Upload',
                description: `Leads uploaded from Excel source: ${sourceName}`,
            },
        });
    }

    return source;
};

export const bulkUploadLeadsFromExcel = async (fileBuffer: Buffer) => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new Error('Excel file has no sheets');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
        throw new Error('Excel file is empty');
    }

    const results = {
        totalRows: rows.length,
        inserted: 0,
        skipped: 0,
        failed: 0,
        errors: [] as any[],

    };

    const mappedRows = rows.map(mapRow);

    const uniqueSources = [...new Set(mappedRows.map((r) => r.source || 'Bulk Excel Upload'))];

    const sourceMap = new Map<string, number>();

    for (const sourceName of uniqueSources) {
        const source = await getOrCreateLeadSource(sourceName);
        sourceMap.set(sourceName, source.id);
    }

    // const emails = mappedRows.map((r) => r.email).filter(Boolean) as string[];
    // const phones = mappedRows.map((r) => r.phone).filter(Boolean) as string[];

    // const existingLeads = await prisma.lead.findMany({
    //     where: {
    //         deletedAt: null,
    //         OR: [
    //             { email: { in: emails } },
    //             { phone: { in: phones } },
    //         ],
    //     },
    //     select: {
    //         email: true,
    //         phone: true,
    //     },
    // });

    const emails = mappedRows
        .map((r) => r.email)
        .filter(
            (email): email is string =>
                typeof email === 'string' && email.trim() !== ''
        );

    const phones = mappedRows
        .map((r) => r.phone)
        .filter(
            (phone): phone is string =>
                typeof phone === 'string' && phone.trim() !== ''
        );

    const orConditions: any[] = [];

    if (emails.length > 0) {
        orConditions.push({
            email: {
                in: emails,
            },
        });
    }

    if (phones.length > 0) {
        orConditions.push({
            phone: {
                in: phones,
            },
        });
    }

    const existingLeads =
        orConditions.length > 0
            ? await prisma.lead.findMany({
                where: {
                    deletedAt: null,
                    OR: orConditions,
                },
                select: {
                    email: true,
                    phone: true,
                },
            })
            : [];

    const existingEmailSet = new Set(existingLeads.map((l) => l.email).filter(Boolean));
    const existingPhoneSet = new Set(existingLeads.map((l) => l.phone).filter(Boolean));

    const leadsToCreate = [];

    for (let i = 0; i < mappedRows.length; i++) {
        const row = mappedRows[i];

        if (!row.fullName || !row.phone) {
            results.failed++;
            results.errors.push({
                row: i + 2,
                message: 'fullName and phone are required',
            });
            continue;
        }

        if ((row.email && existingEmailSet.has(row.email)) || existingPhoneSet.has(row.phone)) {
            results.skipped++;
            continue;
        }

        leadsToCreate.push({
            fullName: row.fullName,
            email: row.email || `${row.phone}@bulk-upload.local`,
            phone: row.phone,
            country: row.country || null,
            preferredCountry: row.preferredCountry || null,
            preferredCourse: row.preferredCourse || null,
            sourceId: sourceMap.get(row.source || 'Bulk Excel Upload')!,
            status: LeadStatus.NEW,
            score: calculateLeadScore(row),
            remark: row.remark || 'Lead uploaded through Excel bulk upload',
        });
    }

    if (leadsToCreate.length > 0) {
        const created = await prisma.lead.createMany({
            data: leadsToCreate,
            skipDuplicates: true,
        });

        results.inserted = created.count;
    }

    return results;
};