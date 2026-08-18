/**
 * Re-apply the canonical 12-step workflow spec to auto-seeded default templates.
 * Usage: npx tsx scripts/resync-workflow-templates.ts [--all]
 *
 * Only `isDefault` templates are touched unless --all is passed, so hand-built
 * templates are left alone. Stage/field/checklist rows are replaced, which also
 * clears saved values for the affected templates.
 */
import { PrismaClient } from '@prisma/client';
import { buildDefaultWorkflowTemplateSeed } from '../src/modules/student-crm/workflow-templates.js';

const prisma = new PrismaClient();

const slugify = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

async function main() {
  const includeAll = process.argv.includes('--all');
  const templates = await prisma.applicationWorkflowTemplate.findMany({
    where: includeAll ? {} : { isDefault: true },
    include: { country: { select: { name: true } } },
    orderBy: { id: 'asc' },
  });

  if (!templates.length) {
    console.log('No workflow templates found.');
    return;
  }

  for (const template of templates) {
    const countryName = template.country?.name || 'Default';
    const seed = buildDefaultWorkflowTemplateSeed(countryName);

    await prisma.$transaction(async (tx) => {
      await tx.applicationWorkflowFieldValue.deleteMany({
        where: { fieldTemplate: { stageTemplate: { templateId: template.id } } },
      });
      await tx.applicationWorkflowChecklistValue.deleteMany({
        where: { checklistTemplate: { stageTemplate: { templateId: template.id } } },
      });
      await tx.applicationWorkflowFieldTemplate.deleteMany({
        where: { stageTemplate: { templateId: template.id } },
      });
      await tx.applicationWorkflowChecklistTemplate.deleteMany({
        where: { stageTemplate: { templateId: template.id } },
      });
      await tx.applicationWorkflowStageTemplate.deleteMany({ where: { templateId: template.id } });

      for (const [stageIndex, stage] of seed.stages.entries()) {
        await tx.applicationWorkflowStageTemplate.create({
          data: {
            templateId: template.id,
            key: stage.key,
            label: stage.label,
            iconKey: stage.iconKey,
            sectionType: stage.sectionType,
            sortOrder: stageIndex,
            isRequired: stage.isRequired !== false,
            metadata: (stage.metadata as any) ?? undefined,
            fields: {
              create: (stage.fields || []).map((field, fieldIndex) => ({
                fieldKey: field.fieldKey || `${slugify(stage.key)}_${fieldIndex + 1}`,
                label: field.label,
                fieldType: field.fieldType,
                required: Boolean(field.required),
                placeholder: field.placeholder ?? null,
                helpText: field.helpText ?? null,
                defaultValue: (field.defaultValue as any) ?? undefined,
                optionsJson: (field.optionsJson as any) ?? undefined,
                metadata: (field.metadata as any) ?? undefined,
                sortOrder: fieldIndex,
              })),
            },
            checklists: {
              create: (stage.checklists || []).map((item, itemIndex) => ({
                itemKey: item.itemKey,
                label: item.label,
                required: item.required !== false,
                metadata: (item.metadata as any) ?? undefined,
                sortOrder: itemIndex,
              })),
            },
          },
        });
      }

      await tx.applicationWorkflowTemplate.update({
        where: { id: template.id },
        data: { description: seed.description },
      });
    });

    console.log(`Resynced template #${template.id} (${template.name}) -> ${seed.stages.length} stages`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
