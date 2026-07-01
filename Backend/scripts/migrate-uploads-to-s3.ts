/**
 * Upload local files under Backend/uploads to S3 and rewrite DB URLs to s3: refs.
 *
 * Usage: npx tsx scripts/migrate-uploads-to-s3.ts
 *        npx tsx scripts/migrate-uploads-to-s3.ts --dry-run
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import {
  buildS3Key,
  isS3Configured,
  objectExists,
  putObject,
  toS3Ref,
} from '../src/lib/s3.js';
import {
  localUrlToS3Ref,
  uploadsRelativeFromLocalUrl,
} from '../src/lib/file-storage.js';

dotenv.config();

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

const MIME_BY_EXT: Record<string, string> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function guessContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

function walkUploads(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkUploads(full, base));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

async function uploadLocalFile(absPath: string): Promise<string> {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const relative = path.relative(uploadsRoot, absPath).replace(/\\/g, '/');
  const relativePath = `uploads/${relative}`;
  const key = buildS3Key(relativePath);
  const ref = toS3Ref(key);

  if (await objectExists(key)) {
    console.log(`  skip (exists): ${relativePath}`);
    return ref;
  }

  const buffer = fs.readFileSync(absPath);
  if (dryRun) {
    console.log(`  [dry-run] would upload: ${relativePath} -> ${key}`);
    return ref;
  }

  await putObject(key, buffer, guessContentType(absPath));
  console.log(`  uploaded: ${relativePath} -> ${key}`);
  return ref;
}

type UrlColumn = {
  label: string;
  fetch: () => Promise<Array<{ id: number; value: string }>>;
  update: (id: number, value: string) => Promise<void>;
};

const urlColumns: UrlColumn[] = [
  {
    label: 'hr_employee_documents.file_url',
    fetch: async () => {
      const rows = await prisma.hrEmployeeDocument.findMany({ select: { id: true, fileUrl: true } });
      return rows.map((r) => ({ id: r.id, value: r.fileUrl }));
    },
    update: async (id, value) => {
      await prisma.hrEmployeeDocument.update({ where: { id }, data: { fileUrl: value } });
    },
  },
  {
    label: 'hr_onboarding_items.attachment_url',
    fetch: async () => {
      const rows = await prisma.hrOnboardingItem.findMany({
        where: { attachmentUrl: { not: null } },
        select: { id: true, attachmentUrl: true },
      });
      return rows
        .filter((r): r is { id: number; attachmentUrl: string } => Boolean(r.attachmentUrl))
        .map((r) => ({ id: r.id, value: r.attachmentUrl }));
    },
    update: async (id, value) => {
      await prisma.hrOnboardingItem.update({ where: { id }, data: { attachmentUrl: value } });
    },
  },
  {
    label: 'hr_candidates.resume_url',
    fetch: async () => {
      const rows = await prisma.hrCandidate.findMany({
        where: { resumeUrl: { not: null } },
        select: { id: true, resumeUrl: true },
      });
      return rows
        .filter((r): r is { id: number; resumeUrl: string } => Boolean(r.resumeUrl))
        .map((r) => ({ id: r.id, value: r.resumeUrl }));
    },
    update: async (id, value) => {
      await prisma.hrCandidate.update({ where: { id }, data: { resumeUrl: value } });
    },
  },
  {
    label: 'application_documents.file_url',
    fetch: async () => {
      const rows = await prisma.applicationDocument.findMany({
        where: { fileUrl: { not: null } },
        select: { id: true, fileUrl: true },
      });
      return rows
        .filter((r): r is { id: number; fileUrl: string } => Boolean(r.fileUrl))
        .map((r) => ({ id: r.id, value: r.fileUrl }));
    },
    update: async (id, value) => {
      await prisma.applicationDocument.update({ where: { id }, data: { fileUrl: value } });
    },
  },
  {
    label: 'offer_letters.file_url',
    fetch: async () => {
      const rows = await prisma.offerLetter.findMany({
        where: { fileUrl: { not: null } },
        select: { id: true, fileUrl: true },
      });
      return rows
        .filter((r): r is { id: number; fileUrl: string } => Boolean(r.fileUrl))
        .map((r) => ({ id: r.id, value: r.fileUrl }));
    },
    update: async (id, value) => {
      await prisma.offerLetter.update({ where: { id }, data: { fileUrl: value } });
    },
  },
  {
    label: 'universities.logo',
    fetch: async () => {
      const rows = await prisma.university.findMany({
        where: { logo: { not: null } },
        select: { id: true, logo: true },
      });
      return rows
        .filter((r): r is { id: number; logo: string } => Boolean(r.logo))
        .map((r) => ({ id: r.id, value: r.logo }));
    },
    update: async (id, value) => {
      await prisma.university.update({ where: { id }, data: { logo: value } });
    },
  },
];

async function rewriteDbUrls(fileRefByRelative: Map<string, string>) {
  let updated = 0;
  let skipped = 0;

  for (const column of urlColumns) {
    const rows = await column.fetch();
    for (const row of rows) {
      if (row.value.startsWith('s3:')) {
        skipped += 1;
        continue;
      }

      let nextRef = localUrlToS3Ref(row.value);
      if (!nextRef) {
        const relative = uploadsRelativeFromLocalUrl(row.value);
        if (relative && fileRefByRelative.has(relative)) {
          nextRef = fileRefByRelative.get(relative)!;
        }
      }

      if (!nextRef || nextRef === row.value) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        console.log(`  [dry-run] ${column.label} #${row.id}: ${row.value} -> ${nextRef}`);
      } else {
        await column.update(row.id, nextRef);
        console.log(`  updated ${column.label} #${row.id}`);
      }
      updated += 1;
    }
  }

  return { updated, skipped };
}

async function main() {
  if (!isS3Configured()) {
    console.error('S3 is not configured. Set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env');
    process.exit(1);
  }

  console.log(`Migrate local uploads to S3${dryRun ? ' (dry-run)' : ''}…`);

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = walkUploads(uploadsDir);
  console.log(`Found ${files.length} file(s) under uploads/`);

  const fileRefByRelative = new Map<string, string>();
  for (const absPath of files) {
    const ref = await uploadLocalFile(absPath);
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const relative = `uploads/${path.relative(uploadsRoot, absPath).replace(/\\/g, '/')}`;
    fileRefByRelative.set(relative, ref);
  }

  console.log('Rewriting database URLs…');
  const { updated, skipped } = await rewriteDbUrls(fileRefByRelative);
  console.log(`Done. DB rows updated: ${updated}, skipped: ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
