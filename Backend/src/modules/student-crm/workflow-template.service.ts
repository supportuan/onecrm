import { prisma } from '../../prisma.js';
import { getDefaultTenantId } from '../../utils/tenant-default.js';
import { buildDefaultWorkflowTemplateSeed } from './workflow-templates.js';

type WorkflowActor = { id?: number; role?: string; tenantId?: number | null };

const toSlug = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const STAGE_INCLUDE = {
  orderBy: { sortOrder: 'asc' as const },
  include: {
    fields: { orderBy: { sortOrder: 'asc' as const } },
    checklists: { orderBy: { sortOrder: 'asc' as const } },
  },
};

export const WORKFLOW_TEMPLATE_INCLUDE = {
  country: { select: { id: true, name: true } },
  stages: STAGE_INCLUDE,
};

const normalizeStages = (stages: any[] = []) =>
  stages.map((stage: any, stageIndex: number) => ({
    key: String(stage?.key || `stage_${stageIndex + 1}`),
    label: String(stage?.label || `Stage ${stageIndex + 1}`),
    iconKey: stage?.iconKey ? String(stage.iconKey) : null,
    sectionType: stage?.sectionType || 'APPLICATION_PROCESS',
    sortOrder: Number.isFinite(Number(stage?.sortOrder)) ? Number(stage.sortOrder) : stageIndex,
    isRequired: stage?.isRequired !== false,
    metadata: stage?.metadata ?? undefined,
    fields: Array.isArray(stage?.fields)
      ? stage.fields.map((field: any, fieldIndex: number) => ({
          fieldKey: String(field?.fieldKey || `${toSlug(stage?.key || stage?.label || 'field')}_${fieldIndex + 1}`),
          label: String(field?.label || `Field ${fieldIndex + 1}`),
          fieldType: field?.fieldType || 'TEXT',
          required: Boolean(field?.required),
          placeholder: field?.placeholder ?? null,
          helpText: field?.helpText ?? null,
          defaultValue: field?.defaultValue ?? null,
          optionsJson: field?.optionsJson ?? null,
          metadata: field?.metadata ?? null,
          sortOrder: Number.isFinite(Number(field?.sortOrder)) ? Number(field.sortOrder) : fieldIndex,
        }))
      : [],
    checklists: Array.isArray(stage?.checklists)
      ? stage.checklists.map((item: any, itemIndex: number) => ({
          itemKey: String(item?.itemKey || `${toSlug(stage?.key || stage?.label || 'item')}_${itemIndex + 1}`),
          label: String(item?.label || `Checklist item ${itemIndex + 1}`),
          required: item?.required !== false,
          metadata: item?.metadata ?? null,
          sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : itemIndex,
        }))
      : [],
  }));

const tenantIdFor = async (actor?: WorkflowActor) =>
  actor?.tenantId ?? (await getDefaultTenantId(actor?.id ?? null)) ?? null;

const buildTemplateCreateInput = (
  payload: {
    countryId?: number | null;
    name: string;
    description?: string | null;
    isActive?: boolean;
    isDefault?: boolean;
    stages: any[];
  },
  tenantId: number | null
) => ({
  tenantId,
  countryId: payload.countryId ?? null,
  name: payload.name,
  description: payload.description ?? null,
  isActive: payload.isActive !== false,
  isDefault: Boolean(payload.isDefault),
  stages: {
    create: normalizeStages(payload.stages).map((stage) => ({
      key: stage.key,
      label: stage.label,
      iconKey: stage.iconKey,
      sectionType: stage.sectionType,
      sortOrder: stage.sortOrder,
      isRequired: stage.isRequired,
      metadata: stage.metadata ?? undefined,
      fields: {
        create: stage.fields.map((field: any) => ({
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          optionsJson: field.optionsJson,
          metadata: field.metadata,
          sortOrder: field.sortOrder,
        })),
      },
      checklists: {
        create: stage.checklists.map((item: any) => ({
          itemKey: item.itemKey,
          label: item.label,
          required: item.required,
          metadata: item.metadata,
          sortOrder: item.sortOrder,
        })),
      },
    })),
  },
});

export const ensureCountryWorkflowTemplate = async (
  countryName: string,
  countryId?: number | null,
  actor?: WorkflowActor
) => {
  const tenantId = await tenantIdFor(actor);
  const existing = await prisma.applicationWorkflowTemplate.findFirst({
    where: {
      tenantId,
      isActive: true,
      ...(countryId ? { countryId } : {}),
      ...(countryId ? {} : { country: { name: { equals: countryName, mode: 'insensitive' } } }),
    },
    include: WORKFLOW_TEMPLATE_INCLUDE,
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });
  if (existing) return existing;

  const country =
    countryId != null
      ? await prisma.country.findUnique({ where: { id: countryId } })
      : await prisma.country.findFirst({
          where: { name: { equals: countryName, mode: 'insensitive' }, deletedAt: null },
        });
  const resolvedCountryName = country?.name || countryName || 'Default';
  const seed = buildDefaultWorkflowTemplateSeed(resolvedCountryName);
  return prisma.applicationWorkflowTemplate.create({
    data: buildTemplateCreateInput(
      {
        countryId: country?.id ?? countryId ?? null,
        name: seed.name,
        description: seed.description,
        isActive: true,
        isDefault: true,
        stages: seed.stages,
      },
      tenantId
    ),
    include: WORKFLOW_TEMPLATE_INCLUDE,
  });
};

export const listWorkflowTemplates = async (opts: { actor?: WorkflowActor; countryId?: number } = {}) => {
  const tenantId = await tenantIdFor(opts.actor);
  let rows = await prisma.applicationWorkflowTemplate.findMany({
    where: {
      tenantId,
      ...(opts.countryId ? { countryId: opts.countryId } : {}),
    },
    include: WORKFLOW_TEMPLATE_INCLUDE,
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
  if (!rows.length && opts.countryId) {
    const country = await prisma.country.findUnique({ where: { id: opts.countryId } });
    if (country) {
      await ensureCountryWorkflowTemplate(country.name, country.id, opts.actor);
      rows = await prisma.applicationWorkflowTemplate.findMany({
        where: { tenantId, countryId: opts.countryId },
        include: WORKFLOW_TEMPLATE_INCLUDE,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
    }
  }
  return rows;
};

export const getWorkflowTemplateById = async (id: number, actor?: WorkflowActor) => {
  const tenantId = await tenantIdFor(actor);
  return prisma.applicationWorkflowTemplate.findFirst({
    where: { id, tenantId },
    include: WORKFLOW_TEMPLATE_INCLUDE,
  });
};

export const createWorkflowTemplate = async (
  payload: {
    countryId?: number | null;
    name: string;
    description?: string | null;
    isActive?: boolean;
    isDefault?: boolean;
    stages: any[];
  },
  actor?: WorkflowActor
) => {
  const tenantId = await tenantIdFor(actor);
  if (!payload.name?.trim()) throw new Error('name is required');
  if (!Array.isArray(payload.stages) || payload.stages.length === 0) throw new Error('at least one stage is required');
  if (payload.isDefault && payload.countryId) {
    await prisma.applicationWorkflowTemplate.updateMany({
      where: { tenantId, countryId: payload.countryId, isDefault: true },
      data: { isDefault: false },
    });
  }
  return prisma.applicationWorkflowTemplate.create({
    data: buildTemplateCreateInput(payload, tenantId),
    include: WORKFLOW_TEMPLATE_INCLUDE,
  });
};

export const updateWorkflowTemplate = async (
  id: number,
  payload: Partial<{
    countryId: number | null;
    name: string;
    description: string | null;
    isActive: boolean;
    isDefault: boolean;
    stages: any[];
  }>,
  actor?: WorkflowActor
) => {
  const existing = await getWorkflowTemplateById(id, actor);
  if (!existing) throw new Error('workflow template not found');
  const tenantId = existing.tenantId ?? (await tenantIdFor(actor));
  if (payload.isDefault && existing.countryId) {
    await prisma.applicationWorkflowTemplate.updateMany({
      where: { tenantId, countryId: existing.countryId, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }
  await prisma.$transaction(async (tx) => {
    await tx.applicationWorkflowTemplate.update({
      where: { id },
      data: {
        ...(payload.countryId !== undefined ? { countryId: payload.countryId } : {}),
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        ...(payload.isDefault !== undefined ? { isDefault: payload.isDefault } : {}),
      },
    });
    if (Array.isArray(payload.stages)) {
      await tx.applicationWorkflowFieldValue.deleteMany({
        where: { fieldTemplate: { stageTemplate: { templateId: id } } },
      });
      await tx.applicationWorkflowChecklistValue.deleteMany({
        where: { checklistTemplate: { stageTemplate: { templateId: id } } },
      });
      await tx.applicationWorkflowFieldTemplate.deleteMany({
        where: { stageTemplate: { templateId: id } },
      });
      await tx.applicationWorkflowChecklistTemplate.deleteMany({
        where: { stageTemplate: { templateId: id } },
      });
      await tx.applicationWorkflowStageTemplate.deleteMany({ where: { templateId: id } });
      const normalized = normalizeStages(payload.stages);
      for (const stage of normalized) {
        await tx.applicationWorkflowStageTemplate.create({
          data: {
            templateId: id,
            key: stage.key,
            label: stage.label,
            iconKey: stage.iconKey,
            sectionType: stage.sectionType,
            sortOrder: stage.sortOrder,
            isRequired: stage.isRequired,
            metadata: stage.metadata ?? undefined,
            fields: {
              create: stage.fields.map((field: any) => ({
                fieldKey: field.fieldKey,
                label: field.label,
                fieldType: field.fieldType,
                required: field.required,
                placeholder: field.placeholder,
                helpText: field.helpText,
                defaultValue: field.defaultValue,
                optionsJson: field.optionsJson,
                metadata: field.metadata,
                sortOrder: field.sortOrder,
              })),
            },
            checklists: {
              create: stage.checklists.map((item: any) => ({
                itemKey: item.itemKey,
                label: item.label,
                required: item.required,
                metadata: item.metadata,
                sortOrder: item.sortOrder,
              })),
            },
          },
        });
      }
    }
  });
  return getWorkflowTemplateById(id, actor);
};

export const resetWorkflowTemplateToDefault = async (id: number, actor?: WorkflowActor) => {
  const existing = await getWorkflowTemplateById(id, actor);
  if (!existing) throw new Error('workflow template not found');
  const countryName = existing.country?.name || 'Default';
  const seed = buildDefaultWorkflowTemplateSeed(countryName);
  return updateWorkflowTemplate(id, { description: seed.description, stages: seed.stages }, actor);
};

export const deleteWorkflowTemplate = async (id: number, actor?: WorkflowActor) => {
  const existing = await getWorkflowTemplateById(id, actor);
  if (!existing) throw new Error('workflow template not found');
  return prisma.applicationWorkflowTemplate.delete({ where: { id } });
};

export const cloneWorkflowTemplate = async (
  id: number,
  overrides: Partial<{ name: string; countryId: number | null; isDefault: boolean }> = {},
  actor?: WorkflowActor
) => {
  const existing = await getWorkflowTemplateById(id, actor);
  if (!existing) throw new Error('workflow template not found');
  return createWorkflowTemplate(
    {
      countryId: overrides.countryId !== undefined ? overrides.countryId : existing.countryId,
      name: overrides.name?.trim() || `${existing.name} Copy`,
      description: existing.description,
      isActive: true,
      isDefault: Boolean(overrides.isDefault),
      stages: existing.stages.map((stage) => ({
        key: stage.key,
        label: stage.label,
        iconKey: stage.iconKey,
        sectionType: stage.sectionType,
        sortOrder: stage.sortOrder,
        isRequired: stage.isRequired,
        metadata: stage.metadata,
        fields: stage.fields.map((field) => ({
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          optionsJson: field.optionsJson,
          metadata: field.metadata,
          sortOrder: field.sortOrder,
        })),
        checklists: stage.checklists.map((item) => ({
          itemKey: item.itemKey,
          label: item.label,
          required: item.required,
          metadata: item.metadata,
          sortOrder: item.sortOrder,
        })),
      })),
    },
    actor
  );
};

export const saveWorkflowFieldValues = async (
  applicationId: number,
  values: Array<{ fieldTemplateId: number; valueJson: unknown }> = []
) => {
  for (const item of values) {
    if (!item?.fieldTemplateId) continue;
    await prisma.applicationWorkflowFieldValue.upsert({
      where: {
        applicationId_fieldTemplateId: {
          applicationId,
          fieldTemplateId: item.fieldTemplateId,
        },
      },
      create: {
        applicationId,
        fieldTemplateId: item.fieldTemplateId,
        valueJson: item.valueJson as any,
      },
      update: {
        valueJson: item.valueJson as any,
      },
    });
  }
};

export const saveWorkflowChecklistValues = async (
  applicationId: number,
  values: Array<{ checklistTemplateId: number; completed?: boolean; valueText?: string | null }> = []
) => {
  for (const item of values) {
    if (!item?.checklistTemplateId) continue;
    await prisma.applicationWorkflowChecklistValue.upsert({
      where: {
        applicationId_checklistTemplateId: {
          applicationId,
          checklistTemplateId: item.checklistTemplateId,
        },
      },
      create: {
        applicationId,
        checklistTemplateId: item.checklistTemplateId,
        completed: Boolean(item.completed),
        valueText: item.valueText ?? null,
      },
      update: {
        completed: Boolean(item.completed),
        valueText: item.valueText ?? null,
      },
    });
  }
};

export const initializeWorkflowValues = async (applicationId: number, templateId: number) => {
  const template = await prisma.applicationWorkflowTemplate.findUnique({
    where: { id: templateId },
    include: WORKFLOW_TEMPLATE_INCLUDE,
  });
  if (!template) return null;

  const fieldRows = template.stages.flatMap((stage) =>
    stage.fields
      .filter((field) => field.defaultValue !== null && field.defaultValue !== undefined)
      .map((field) => ({
        applicationId,
        fieldTemplateId: field.id,
        valueJson: field.defaultValue as any,
      }))
  );
  const checklistRows = template.stages.flatMap((stage) =>
    stage.checklists.map((item) => ({
      applicationId,
      checklistTemplateId: item.id,
      completed: false,
      valueText: null,
    }))
  );

  if (fieldRows.length) {
    await prisma.applicationWorkflowFieldValue.createMany({
      data: fieldRows,
      skipDuplicates: true,
    });
  }
  if (checklistRows.length) {
    await prisma.applicationWorkflowChecklistValue.createMany({
      data: checklistRows,
      skipDuplicates: true,
    });
  }

  return template;
};
