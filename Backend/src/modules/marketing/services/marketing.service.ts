import { prisma } from '../../../prisma.js';
import { LeadStatus, CampaignType, CampaignStatus, AutomationStatus, LandingPageType, ActivityType, UserRole, Prisma } from '@prisma/client';
import { sendCampaignEmail } from './email.service.js';
import { sendWhatsAppMessage } from './whatsapp.service.js';
import { sendSMS } from './sms.service.js';
import { hashPassword } from '../../../utils/password.js';
import crypto from 'crypto';
import {
  validateDuplicateLead,
  validateDuplicateUser,
  normalizeValue,
} from "../../../utils/validation.js";

// Helper to calculate Month-over-Month growth
const calculateGrowth = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

// ==========================================
// 1. Dashboard & High-Level Services
// ==========================================

export const getDashboardData = async () => {
  const metrics = await prisma.marketingMetric.findMany({
    where: { metricKey: { in: ['total_students', 'active_applications', 'partner_agencies', 'revenue_mtd'] } }
  });

  const getMetricValue = (key: string): number | null => {
    const item = metrics.find(m => m.metricKey === key);
    return item ? item.metricValue : null;
  };

  const getMetricTrend = (key: string): string | null => {
    const item = metrics.find(m => m.metricKey === key);
    return item && item.trend ? item.trend : null;
  };

  return {
    kpis: {
      totalStudents: {
        value: getMetricValue('total_students'),
        trend: getMetricTrend('total_students'),
      },
      activeApplications: {
        value: getMetricValue('active_applications'),
        trend: getMetricTrend('active_applications'),
      },
      partnerAgencies: {
        value: getMetricValue('partner_agencies'),
        trend: getMetricTrend('partner_agencies'),
      },
      revenueMtd: {
        value: getMetricValue('revenue_mtd'),
        trend: getMetricTrend('revenue_mtd'),
      }
    },
    quickActions: [
      { id: 'create-lead', label: 'Add Student', icon: 'UserPlus', action: '/marketing/leads' },
      { id: 'new-campaign', label: 'Launch Campaign', icon: 'Send', action: '/marketing/campaigns' },
      { id: 'new-automation', label: 'Create Workflow', icon: 'Cpu', action: '/marketing/automations' },
      { id: 'new-landing', label: 'Build Landing Page', icon: 'FileText', action: '/marketing/landing-pages' }
    ]
  };
};

export const getIntakeTrends = async () => {
  const trends = await prisma.intakeTrend.findMany({
    orderBy: { id: 'asc' }
  });

  return trends.map(t => ({
    month: t.month,
    applications: t.applications,
    enrollments: t.enrollments,
    revenue: t.revenue
  }));
};

export const getMarketingFunnels = async () => {
  const studentFunnel = await prisma.studentFunnelStage.findMany({
    orderBy: { id: 'asc' }
  });

  const agencyFunnel = await prisma.agencyFunnelStage.findMany({
    orderBy: { id: 'asc' }
  });

  return {
    studentFunnel: studentFunnel.map(s => ({
      stage: s.stage,
      count: s.count,
      conversion: s.conversion
    })),
    agencyFunnel: agencyFunnel.map(a => ({
      stage: a.stage,
      count: a.count,
      conversion: a.conversion
    }))
  };
};

const calculatePercentage = (num: number, denom: number): string => {
  if (denom === 0) return '0%';
  return `${((num / denom) * 100).toFixed(1)}%`;
};

// ==========================================
// 2. Lead Management Services
// ==========================================

export const getLeads = async (filters: {
  search?: string;
  status?: LeadStatus;
  sourceId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  assignedCounsellorId?: number;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';

  const whereClause: any = {
    deletedAt: null,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.sourceId) {
    whereClause.sourceId = filters.sourceId;
  }

  if (filters.assignedCounsellorId) {
    whereClause.assignedCounsellorId = filters.assignedCounsellorId;
  }

  if (filters.search) {
    whereClause.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
      { country: { contains: filters.search, mode: 'insensitive' } },
      { preferredCountry: { contains: filters.search, mode: 'insensitive' } },
      { preferredCourse: { contains: filters.search, mode: 'insensitive' } },
      { source: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const orderBy: any = {};
  if (sortBy === 'source') {
    orderBy.source = { name: sortOrder };
  } else {
    orderBy[sortBy] = sortOrder;
  }

  const [leads, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where: whereClause,
      include: { source: true, assignedCounsellor: true, assignedBy: true },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.lead.count({ where: whereClause }),
  ]);

  const items = leads.map((lead: any) => {
    let interestedIn = lead.preferredCourse || "";
    if (lead.preferredCourse && lead.preferredCountry) {
      interestedIn = `${lead.preferredCourse} in ${lead.preferredCountry}`;
    } else if (lead.preferredCountry) {
      interestedIn = lead.preferredCountry;
    }
    return {
      id: lead.id,
      fullName: lead.fullName,
      country: lead.country,
      createdAt: lead.createdAt,
      email: lead.email,
      phone: lead.phone,
      source: lead.source ? { id: lead.source.id, name: lead.source.name } : null,
      preferredCourse: lead.preferredCourse,
      preferredCountry: lead.preferredCountry,
      interestedIn,
      rating: lead.rating,
      status: lead.status,
      assignedCounsellor: lead.assignedCounsellor ? { id: lead.assignedCounsellor.id, name: lead.assignedCounsellor.fullName } : null,
      assignedBy: lead.assignedBy ? { id: lead.assignedBy.id, name: lead.assignedBy.fullName } : null,
      remark: lead.remark,
      isStudentLoginCreated: lead.isStudentLoginCreated,
      studentUserId: lead.studentUserId,
    };
  });

  return {
    items,
    total,
    page,
    limit,
  };
};

export const getLeadById = async (id: number) => {
  return await prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: {
      source: true,
      assignedCounsellor: true,
      assignedBy: true,
      activities: {
        orderBy: { createdAt: 'desc' },
      },
      campaigns: {
        include: {
          campaign: true,
        },
      },
    },
  });
};

export const getSources = async () => {
  return await prisma.leadSource.findMany({
    orderBy: { name: 'asc' }
  });
};

// export const createLead = async (data: any) => {
//   return await prisma.lead.create({
//     data,
//     include: { source: true, assignedCounsellor: true, assignedBy: true },
//   });
// };

export const createLead = async (data: any) => {
  await validateDuplicateLead(data.email, data.phone);

  return await prisma.lead.create({
    data: {
      ...data,
      email: normalizeValue(data.email),
      phone: normalizeValue(data.phone),
    },
    include: {
      source: true,
      assignedCounsellor: true,
      assignedBy: true,
    },
  });
};

// export const updateLead = async (id: number, data: any) => {
//   return await prisma.lead.update({
//     where: { id },
//     data,
//     include: { source: true, assignedCounsellor: true, assignedBy: true },
//   });
// };

// export const updateLead = async (id: number, data: any) => {
//     return await prisma.$transaction(async (tx) => {
//     const updatedLead = await tx.lead.update({
//       where: { id },
//       data,
//       include: { source: true, assignedCounsellor: true, assignedBy: true },
//     });

//     if (
//       data.assignedCounsellorId !== undefined &&
//       updatedLead.studentUserId
//     ) {
//       await tx.user.update({
//         where: { id: updatedLead.studentUserId },
//         data: {
//           counsellorId: data.assignedCounsellorId,
//         },
//       });
//     }

//     return updatedLead;
//   });
// };

export const updateLead = async (id: number, data: any) => {
  return await prisma.$transaction(async (tx) => {
    const existingLead = await tx.lead.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingLead) {
      throw new Error("Lead not found");
    }

    await validateDuplicateLead(
      data.email ?? existingLead.email,
      data.phone ?? existingLead.phone,
      id
    );

    const updatedLead = await tx.lead.update({
      where: { id },
      data: {
        ...data,
        email: data.email !== undefined ? normalizeValue(data.email) : undefined,
        phone: data.phone !== undefined ? normalizeValue(data.phone) : undefined,
      },
      include: {
        source: true,
        assignedCounsellor: true,
        assignedBy: true,
      },
    });

    if (
      data.assignedCounsellorId !== undefined &&
      updatedLead.studentUserId
    ) {
      await tx.user.update({
        where: { id: updatedLead.studentUserId },
        data: {
          counsellorId: data.assignedCounsellorId,
        },
      });
    }

    return updatedLead;
  });
};

// export const assignCounsellor = async (leadId: number, counsellorId: number | null, adminId: number) => {
//   const updated = await prisma.lead.update({
//     where: { id: leadId },
//     data: {
//       assignedCounsellorId: counsellorId,
//       assignedById: adminId,
//     },
//     include: { source: true, assignedCounsellor: true, assignedBy: true },
//   });

//   if (counsellorId) {
//     const { safeNotify } = await import('../../notifications/recipients.js');
//     await safeNotify({
//       recipientId: counsellorId,
//       templateKey: 'lead.assigned',
//       vars: {
//         leadName: updated.fullName,
//         source: updated.source?.name,
//         leadId,
//       },
//     });
//   }

//   return updated;
// };

export const assignCounsellor = async (
  leadId: number,
  counsellorId: number | null,
  assignedById: number
) => {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: null,
      },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    const updatedLead = await tx.lead.update({
      where: {
        id: leadId,
      },
      data: {
        assignedCounsellorId: counsellorId,
        assignedById,
      },
      include: {
        source: true,
        assignedCounsellor: true,
        assignedBy: true,
        studentUser: true,
      },
    });

    if (updatedLead.studentUserId) {
      await tx.user.update({
        where: {
          id: updatedLead.studentUserId,
        },
        data: {
          counsellorId,
        },
      });
    }

    return updatedLead;
  });
};

export const updateLeadRating = async (leadId: number, rating: string) => {
  return await prisma.lead.update({
    where: { id: leadId },
    data: { rating: rating as any },
    include: {
      source: true,
      assignedCounsellor: true,
      assignedBy: true,
    },
  });
};

export const deleteLead = async (id: number) => {
  // Soft delete
  return await prisma.lead.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const getLeadActivities = async (leadId: number) => {
  return await prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  });
};

export const createLeadActivity = async (leadId: number, data: {
  activityType: ActivityType;
  comment?: string | null;
  metadata?: any;
}) => {
  return await prisma.leadActivity.create({
    data: {
      leadId,
      ...data,
    },
  });
};

// ==========================================
// 3. Campaign Services
// ==========================================

const getCampaignMetrics = (name: string, dbLeadsCount: number, dbConversionsCount: number) => {
  const rate = dbLeadsCount > 0 ? (dbConversionsCount / dbLeadsCount) * 100 : 0;
  return {
    leads: dbLeadsCount,
    conversions: dbConversionsCount,
    rate: parseFloat(rate.toFixed(1))
  };
};

export const getCampaigns = async (filters: {
  search?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const whereClause: any = {
    deletedAt: null,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.type) {
    whereClause.type = filters.type;
  }

  if (filters.search) {
    whereClause.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { targetAudience: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const page = filters.page;
  const limit = filters.limit;
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = limit ? limit : undefined;

  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';

  // Fetch all matching campaigns (without skip/take limit) to calculate global footer totals
  const allCampaigns = await prisma.campaign.findMany({
    where: whereClause,
    include: {
      leads: {
        include: {
          lead: true
        }
      },
      _count: {
        select: { leads: true }
      }
    }
  });

  let totalBudget = 0;
  let totalSpent = 0;
  let totalLeads = 0;

  const allItemsMapped = allCampaigns.map(c => {
    const dbLeadsCount = c._count.leads;
    const dbConversionsCount = c.leads.filter(l => l.lead.status === 'CONVERTED').length;
    const metrics = getCampaignMetrics(c.name, dbLeadsCount, dbConversionsCount);

    totalBudget += c.budget || 0;
    totalSpent += c.spent || 0;
    totalLeads += metrics.leads;

    return {
      id: c.id,
      name: c.name,
      type: c.type,
      budget: c.budget,
      spent: c.spent,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      targetAudience: c.targetAudience,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      leadsCount: metrics.leads,
      conversionsCount: metrics.conversions,
      conversionRate: metrics.rate
    };
  });

  // Sort mapped items in memory (handles dynamic columns like leadsCount & conversionRate)
  allItemsMapped.sort((a: any, b: any) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (valA instanceof Date) valA = valA.getTime();
    if (valB instanceof Date) valB = valB.getTime();

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA === undefined || valA === null) return sortOrder === 'asc' ? -1 : 1;
    if (valB === undefined || valB === null) return sortOrder === 'asc' ? 1 : -1;

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const total = allItemsMapped.length;
  const paginatedItems = (skip !== undefined && take !== undefined)
    ? allItemsMapped.slice(skip, skip + take)
    : allItemsMapped;

  return {
    items: paginatedItems,
    summary: {
      totalBudget,
      totalSpent,
      totalLeads
    },
    total,
    page: page || 1,
    limit: limit || total
  };
};

export const getCampaignById = async (id: number) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id, deletedAt: null },
    include: {
      leads: {
        include: {
          lead: true,
        },
      },
    },
  });

  if (!campaign) return null;

  const leads = campaign.leads;
  const dbLeadsCount = leads.length;
  const dbConversionsCount = leads.filter(l => l.lead.status === 'CONVERTED').length;
  const metrics = getCampaignMetrics(campaign.name, dbLeadsCount, dbConversionsCount);

  const opened = leads.filter(l => l.status === 'OPENED' || l.status === 'CLICKED' || l.engagement === 'high' || l.engagement === 'very_high').length;
  const clicked = leads.filter(l => l.status === 'CLICKED' || l.engagement === 'very_high').length;
  const openRate = dbLeadsCount > 0 ? `${((opened / dbLeadsCount) * 100).toFixed(1)}%` : '0%';
  const clickRate = dbLeadsCount > 0 ? `${((clicked / dbLeadsCount) * 100).toFixed(1)}%` : '0%';
  const conversionRate = `${metrics.rate.toFixed(1)}%`;

  return {
    ...campaign,
    leadsCount: metrics.leads,
    conversionsCount: metrics.conversions,
    conversionRate: metrics.rate,
    metrics: {
      totalLeads: metrics.leads,
      conversions: metrics.conversions,
      openRate,
      clickRate,
      conversionRate,
    },
  };
};

export const createCampaign = async (data: any) => {
  return await prisma.campaign.create({
    data,
  });
};

export const updateCampaign = async (id: number, data: any) => {
  return await prisma.campaign.update({
    where: { id },
    data,
  });
};

export const deleteCampaign = async (id: number) => {
  return await prisma.campaign.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const addCampaignLeads = async (
  campaignId: number,
  leadIds: number[],
  status = 'SENT',
  engagement = 'medium'
) => {
  const data = leadIds.map(leadId => ({
    campaignId,
    leadId,
    status,
    engagement,
  }));

  // Perform bulk inserts
  return await prisma.campaignLead.createMany({
    data,
    skipDuplicates: true,
  });
};

// ==========================================
// 4. Marketing Automation Services
// ==========================================

export const getAutomations = async (filters: {
  search?: string;
  status?: AutomationStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';

  const whereClause: any = {
    deletedAt: null,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.search) {
    whereClause.OR = [
      { workflowName: { contains: filters.search, mode: 'insensitive' } },
      { trigger: { contains: filters.search, mode: 'insensitive' } },
      { action: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  const [items, total] = await prisma.$transaction([
    prisma.marketingAutomation.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.marketingAutomation.count({ where: whereClause }),
  ]);

  const activeFlows = await prisma.marketingAutomation.findMany({
    where: { status: 'ACTIVE', deletedAt: null }
  });

  const totalActiveWorkflows = activeFlows.length;
  let leadsAutomated = 0;
  let emailsSent = 0;
  let whatsappMessages = 0;
  let smsSent = 0;

  activeFlows.forEach(f => {
    leadsAutomated += f.leadsAutomated;
    emailsSent += f.emailsSent;
    whatsappMessages += f.whatsappMessages;
    smsSent += f.smsSent;
  });

  const allFlows = await prisma.marketingAutomation.findMany({
    where: { deletedAt: null }
  });
  const allFlowsCount = allFlows.length;
  const avgEngagementRate = allFlowsCount > 0
    ? parseFloat((allFlows.reduce((acc, f) => acc + f.engagementRate, 0) / allFlowsCount).toFixed(1))
    : 0;

  const summary = {
    totalActiveWorkflows,
    leadsAutomated,
    emailsSent,
    whatsappMessages,
    smsSent,
    engagementRate: avgEngagementRate
  };

  return {
    items,
    summary,
    page,
    limit,
    total
  };
};

export const getAutomationSummary = async () => {
  const activeFlows = await prisma.marketingAutomation.findMany({
    where: { status: 'ACTIVE', deletedAt: null }
  });

  const totalActiveWorkflows = activeFlows.length;
  let leadsAutomated = 0;
  let emailsSent = 0;
  let whatsappMessages = 0;
  let smsSent = 0;

  activeFlows.forEach(f => {
    leadsAutomated += f.leadsAutomated;
    emailsSent += f.emailsSent;
    whatsappMessages += f.whatsappMessages;
    smsSent += f.smsSent;
  });

  const allFlows = await prisma.marketingAutomation.findMany({
    where: { deletedAt: null }
  });
  const allFlowsCount = allFlows.length;
  const avgEngagementRate = allFlowsCount > 0
    ? parseFloat((allFlows.reduce((acc, f) => acc + f.engagementRate, 0) / allFlowsCount).toFixed(1))
    : 0;

  return {
    totalActiveWorkflows,
    leadsAutomated,
    emailsSent,
    whatsappMessages,
    smsSent,
    engagementRate: avgEngagementRate
  };
};

export const getAutomationById = async (id: number) => {
  return await prisma.marketingAutomation.findFirst({
    where: { id, deletedAt: null },
    include: {
      executions: {
        orderBy: { createdAt: 'desc' },
      }
    }
  });
};

export const createAutomation = async (data: any) => {
  return await prisma.marketingAutomation.create({
    data,
  });
};

export const updateAutomation = async (id: number, data: any) => {
  return await prisma.marketingAutomation.update({
    where: { id },
    data,
  });
};

export const deleteAutomation = async (id: number) => {
  return await prisma.marketingAutomation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

// ==========================================
// 5. Landing Page & Submission Services
// ==========================================

export const getLandingPages = async (query: {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  const search = query.search || '';
  const type = query.type || '';
  const page = query.page ? parseInt(query.page as any) : 1;
  const limit = query.limit ? parseInt(query.limit as any) : 10;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder || 'desc';

  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) {
    where.type = type;
  }

  const total = await prisma.landingPage.count({ where });

  const items = await prisma.landingPage.findMany({
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
  });

  // Calculate summary dynamically
  const totalFormsPublished = await prisma.marketingForm.count();

  const submissionsAggregate = await prisma.marketingForm.aggregate({
    _sum: { totalSubmissions: true },
  });
  const totalLeadsCaptured = submissionsAggregate._sum.totalSubmissions || 0;

  const conversionAggregate = await prisma.marketingForm.aggregate({
    _avg: { conversionRate: true },
  });
  const averageConversionRate = parseFloat((conversionAggregate._avg.conversionRate || 0).toFixed(1));

  const visitsAggregate = await prisma.landingPage.aggregate({
    _sum: { visits: true },
    where: { deletedAt: null },
  });
  const visits30Days = visitsAggregate._sum.visits || 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const leads30Days = await prisma.lead.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      deletedAt: null
    }
  });

  const allFlows = await prisma.marketingAutomation.findMany({
    where: { deletedAt: null }
  });
  const allFlowsCount = allFlows.length;
  const averageEngagementRate = allFlowsCount > 0
    ? parseFloat((allFlows.reduce((acc, f) => acc + f.engagementRate, 0) / allFlowsCount).toFixed(1))
    : 0;

  return {
    items,
    summary: {
      totalFormsPublished,
      totalLeadsCaptured,
      averageConversionRate,
      visits30Days,
      leads30Days,
      averageEngagementRate,
    },
    page,
    limit,
    total,
  };
};

export const getLandingPageById = async (id: number) => {
  return await prisma.landingPage.findFirst({
    where: { id, deletedAt: null },
  });
};

export const createLandingPage = async (data: any) => {
  // If conversion rate is not provided, calculate it
  if (data.visits && data.leads) {
    data.conversionRate = parseFloat(((data.leads / data.visits) * 100).toFixed(2));
  }

  const page = await prisma.landingPage.create({
    data,
  });

  // Also create a linked MarketingForm if a formId is used, or to keep forms synced
  await prisma.marketingForm.create({
    data: {
      formName: `${page.title} Form`,
      formType: page.type === 'GUIDE' ? 'Lead Form' : page.type === 'EVENT' ? 'Event Registration' : page.type === 'APPLICATION' ? 'Application Form' : 'Contact Form',
      totalSubmissions: page.leads || 0,
      conversionRate: page.conversionRate || 0,
      landingPageId: page.id,
    }
  });

  return page;
};

export const updateLandingPage = async (id: number, data: any) => {
  if (data.visits !== undefined && data.leads !== undefined) {
    data.conversionRate = data.visits > 0 ? parseFloat(((data.leads / data.visits) * 100).toFixed(2)) : 0;
  }

  const page = await prisma.landingPage.update({
    where: { id },
    data,
  });

  // Update linked MarketingForm as well if it exists
  const existingForm = await prisma.marketingForm.findFirst({
    where: { landingPageId: id }
  });
  if (existingForm) {
    await prisma.marketingForm.update({
      where: { id: existingForm.id },
      data: {
        totalSubmissions: page.leads,
        conversionRate: page.conversionRate,
      }
    });
  }

  return page;
};

export const deleteLandingPage = async (id: number) => {
  return await prisma.landingPage.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const getFormsSummary = async () => {
  const totalFormsPublished = await prisma.marketingForm.count();

  const submissionsAggregate = await prisma.marketingForm.aggregate({
    _sum: { totalSubmissions: true },
  });
  const totalLeadsCaptured = submissionsAggregate._sum.totalSubmissions || 0;

  const conversionAggregate = await prisma.marketingForm.aggregate({
    _avg: { conversionRate: true },
  });
  const averageConversionRate = parseFloat((conversionAggregate._avg.conversionRate || 0).toFixed(1));

  const visitsAggregate = await prisma.landingPage.aggregate({
    _sum: { visits: true },
    where: { deletedAt: null },
  });
  const visits30Days = visitsAggregate._sum.visits || 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const leads30Days = await prisma.lead.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      deletedAt: null
    }
  });

  const allFlows = await prisma.marketingAutomation.findMany({
    where: { deletedAt: null }
  });
  const allFlowsCount = allFlows.length;
  const averageEngagementRate = allFlowsCount > 0
    ? parseFloat((allFlows.reduce((acc, f) => acc + f.engagementRate, 0) / allFlowsCount).toFixed(1))
    : 0;

  return {
    totalFormsPublished,
    totalLeadsCaptured,
    averageConversionRate,
    visits30Days,
    leads30Days,
    averageEngagementRate,
  };
};

export const submitForm = async (slug: string, body: any) => {
  // Find landing page
  const page = await prisma.landingPage.findFirst({
    where: { slug, deletedAt: null },
  });

  if (!page) {
    throw new Error(`Landing page with slug '${slug}' not found`);
  }

  // Find or Create Lead Source
  const sourceName = body.sourceType || 'Website Form';
  let leadSource = await prisma.leadSource.findFirst({
    where: { name: sourceName },
  });

  if (!leadSource) {
    leadSource = await prisma.leadSource.create({
      data: {
        name: sourceName,
        sourceType: sourceName.toLowerCase().includes('ads') ? 'Paid Advertising' : 'Organic Form',
        description: `Automated lead source from form submissions`,
      },
    });
  }

  // Create Lead
  const newLead = await prisma.lead.create({
    data: {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      preferredCountry: body.preferredCountry || page.country,
      preferredCourse: body.preferredCourse || page.course,
      sourceId: leadSource.id,
      utmSource: body.utmSource || 'LandingPage',
      utmMedium: body.utmMedium || 'WebForm',
      utmCampaign: body.utmCampaign || page.slug,
      utmTerm: body.utmTerm,
      utmContent: body.utmContent,
      score: 10, // Default intake score
      status: LeadStatus.NEW,
    },
  });

  // Create Lead Activity
  await prisma.leadActivity.create({
    data: {
      leadId: newLead.id,
      activityType: ActivityType.NOTE,
      comment: `Form submitted on landing page: ${page.title} (Slug: ${slug})`,
      metadata: {
        landingPageId: page.id,
        landingPageSlug: slug,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
      },
    },
  });

  // Increment Visits and Leads on Landing Page and Recalculate conversionRate
  const updatedPageVisits = page.visits + 1;
  const updatedPageLeads = page.leads + 1;
  const updatedConversion = (updatedPageLeads / updatedPageVisits) * 100;

  await prisma.landingPage.update({
    where: { id: page.id },
    data: {
      visits: updatedPageVisits,
      leads: updatedPageLeads,
      conversionRate: parseFloat(updatedConversion.toFixed(2)),
    },
  });

  return newLead;
};

// ==========================================
// 6. Analytics Services
// ==========================================

export const getAnalyticsData = async () => {
  // Aggregate leads by LeadSource
  const leadsBySource = await prisma.lead.groupBy({
    by: ['sourceId'],
    where: { deletedAt: null },
    _count: { id: true },
  });

  // Hydrate with LeadSource details
  const leadSources = await prisma.leadSource.findMany();
  const sourceDistribution = leadsBySource.map(item => {
    const src = leadSources.find(s => s.id === item.sourceId);
    return {
      source: src ? src.name : 'Unknown',
      count: item._count.id,
    };
  });

  // Aggregate landing pages summary
  const landingPages = await prisma.landingPage.findMany({
    where: { deletedAt: null },
    select: { title: true, visits: true, leads: true, conversionRate: true },
  });

  // Aggregate campaigns summary
  const campaigns = await prisma.campaign.findMany({
    where: { deletedAt: null },
    include: {
      leads: {
        select: { id: true },
      },
    },
  });

  const campaignPerformance = campaigns.map(c => {
    const leadsCount = c.leads.length;
    const costPerLead = leadsCount > 0 && c.spent ? c.spent / leadsCount : 0;
    return {
      campaignName: c.name,
      budget: c.budget || 0,
      spent: c.spent || 0,
      leadsGenerated: leadsCount,
      costPerLead: parseFloat(costPerLead.toFixed(2)),
      roi: c.spent && c.spent > 0 ? `${(((leadsCount * 250) / c.spent) * 100).toFixed(0)}%` : '0%', // Mock revenue generation per lead for ROI calculation
    };
  });

  // Calculate monthly conversion rates dynamically over time
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const visits = await prisma.landingPageVisit.findMany({
    where: { visitedAt: { gte: sixMonthsAgo } },
    select: { visitedAt: true }
  });

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: sixMonthsAgo }, deletedAt: null },
    select: { createdAt: true }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData: { [key: string]: { visits: number, leads: number } } = {};

  // Initialize the last 6 months chronologically
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    monthlyData[key] = { visits: 0, leads: 0 };
  }

  visits.forEach(v => {
    const d = v.visitedAt;
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    if (monthlyData[key]) {
      monthlyData[key].visits += 1;
    }
  });

  leads.forEach(l => {
    const d = l.createdAt;
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    if (monthlyData[key]) {
      monthlyData[key].leads += 1;
    }
  });

  const monthlyConversions = Object.entries(monthlyData).map(([period, data]) => {
    const conversionRate = data.visits > 0 ? `${((data.leads / data.visits) * 100).toFixed(1)}%` : '0%';
    return {
      period,
      visits: data.visits,
      leads: data.leads,
      conversionRate
    };
  });

  return {
    sourceDistribution,
    landingPagePerformance: landingPages,
    campaignPerformance,
    monthlyConversions,
  };
};

export const getMarketingMetrics = async (period?: string) => {
  const selectedPeriod = period || '30days';
  const dbMetrics = await prisma.marketingMetric.findMany({
    where: {
      period: selectedPeriod,
      metricKey: {
        in: ['Website Visits', 'Leads Generated', 'Email Open Rate', 'Click-Through Rate (CTR)']
      }
    }
  });

  return dbMetrics.map(m => ({
    metricKey: m.metricKey,
    metricValue: m.metricValue,
    trend: m.trend ? parseFloat(m.trend) : 0.0
  }));
};

export const getMarketingPerformance = async (period?: string) => {
  const dbPerformance = await prisma.marketingPerformance.findMany();

  return dbPerformance.sort((a, b) => {
    const numA = parseInt(a.day.replace('Day ', ''));
    const numB = parseInt(b.day.replace('Day ', ''));
    return numA - numB;
  }).map(p => ({
    day: p.day,
    opens: p.opens,
    clicks: p.clicks,
    conversions: p.conversions
  }));
};

export const getChannelAnalytics = async (period?: string) => {
  const dbChannels = await prisma.marketingChannelAnalytics.findMany({
    orderBy: { percentage: 'desc' }
  });

  return dbChannels.map(c => ({
    channelName: c.channelName,
    percentage: c.percentage,
    totalLeads: c.totalLeads,
    totalConversions: c.totalConversions
  }));
};

export const getAgencyFunnelAnalytics = async (period?: string) => {
  const dbAgencyFunnels = await prisma.agencyFunnelAnalytics.findMany({
    orderBy: { funnelValue: 'desc' }
  });

  return dbAgencyFunnels.map(f => ({
    funnelName: f.funnelName,
    funnelValue: f.funnelValue
  }));
};

export const getAnalyticsSummary = async (period?: string) => {
  const metrics = await getMarketingMetrics(period);
  const performanceOverview = await getMarketingPerformance(period);
  const channels = await getChannelAnalytics(period);
  const agencyFunnels = await getAgencyFunnelAnalytics(period);

  // Log event to AnalyticsLog table for tracking
  await prisma.analyticsLog.create({
    data: {
      eventType: 'SUMMARY_FETCH',
      metricKey: 'Summary Query',
      metricValue: 1.0,
      metadata: { period: period || '30days' }
    }
  });

  return {
    metrics,
    performanceOverview,
    channels,
    agencyFunnels
  };
};

// ==========================================
// 7. Dashboard Upsert & Update Services
// ==========================================

export const upsertDashboardMetric = async (data: any) => {
  const { metricKey, period } = data;
  const existing = await prisma.marketingMetric.findFirst({
    where: { metricKey, period: period || null }
  });
  if (existing) {
    return await prisma.marketingMetric.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.marketingMetric.create({
    data
  });
};

export const updateDashboardMetric = async (id: number, data: any) => {
  return await prisma.marketingMetric.update({
    where: { id },
    data
  });
};

export const upsertIntakeTrend = async (data: any) => {
  const { month } = data;
  const existing = await prisma.intakeTrend.findFirst({
    where: { month }
  });
  if (existing) {
    return await prisma.intakeTrend.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.intakeTrend.create({
    data
  });
};

export const updateIntakeTrend = async (id: number, data: any) => {
  return await prisma.intakeTrend.update({
    where: { id },
    data
  });
};

export const upsertStudentFunnelStage = async (data: any) => {
  const { stage } = data;
  const existing = await prisma.studentFunnelStage.findFirst({
    where: { stage }
  });
  if (existing) {
    return await prisma.studentFunnelStage.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.studentFunnelStage.create({
    data
  });
};

export const updateStudentFunnelStage = async (id: number, data: any) => {
  return await prisma.studentFunnelStage.update({
    where: { id },
    data
  });
};

export const upsertAgencyFunnelStage = async (data: any) => {
  const { stage } = data;
  const existing = await prisma.agencyFunnelStage.findFirst({
    where: { stage }
  });
  if (existing) {
    return await prisma.agencyFunnelStage.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.agencyFunnelStage.create({
    data
  });
};

export const updateAgencyFunnelStage = async (id: number, data: any) => {
  return await prisma.agencyFunnelStage.update({
    where: { id },
    data
  });
};

export const upsertMarketingPerformance = async (data: any) => {
  const { day } = data;
  const existing = await prisma.marketingPerformance.findFirst({
    where: { day }
  });
  if (existing) {
    return await prisma.marketingPerformance.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.marketingPerformance.create({
    data
  });
};

export const updateMarketingPerformance = async (id: number, data: any) => {
  return await prisma.marketingPerformance.update({
    where: { id },
    data
  });
};

export const upsertMarketingChannelAnalytics = async (data: any) => {
  const { channelName } = data;
  const existing = await prisma.marketingChannelAnalytics.findFirst({
    where: { channelName }
  });
  if (existing) {
    return await prisma.marketingChannelAnalytics.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.marketingChannelAnalytics.create({
    data
  });
};

export const updateMarketingChannelAnalytics = async (id: number, data: any) => {
  return await prisma.marketingChannelAnalytics.update({
    where: { id },
    data
  });
};

export const upsertAgencyFunnelAnalytics = async (data: any) => {
  const { funnelName } = data;
  const existing = await prisma.agencyFunnelAnalytics.findFirst({
    where: { funnelName }
  });
  if (existing) {
    return await prisma.agencyFunnelAnalytics.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.agencyFunnelAnalytics.create({
    data
  });
};

export const updateAgencyFunnelAnalytics = async (id: number, data: any) => {
  return await prisma.agencyFunnelAnalytics.update({
    where: { id },
    data
  });
};

// campain servises 

export const executeCampaign = async (campaignId: number) => {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      deletedAt: null,
    },
    include: {
      leads: {
        include: {
          lead: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (!campaign.leads.length) {
    throw new Error('No leads associated with this campaign');
  }

  let sent = 0;
  let failed = 0;

  for (const item of campaign.leads) {
    const lead = item.lead;

    try {
      if (campaign.type === 'EMAIL') {
        await sendCampaignEmail({
          to: lead.email,
          subject: campaign.name,
          html: campaign.description || 'Campaign message',
        });
      }

      if (campaign.type === 'SMS') {
        if (!lead.phone) continue;
        await sendSMS({
          to: lead.phone,
          message: campaign.description || campaign.name,
        });
      }

      if (campaign.type === 'WHATSAPP') {
        if (!lead.phone) continue;
        await sendWhatsAppMessage({
          phone: lead.phone,
          templateName: 'hello_world',
        });
      }

      await prisma.campaignLead.update({
        where: {
          id: item.id,
        },
        data: {
          status: 'SENT',
          engagement: 'sent',
        },
      });

      sent++;
    } catch (error: any) {
      await prisma.campaignLead.update({
        where: {
          id: item.id,
        },
        data: {
          status: 'FAILED',
          engagement: error.message,
        },
      });

      failed++;
    }
  }

  return {
    campaignId,
    totalLeads: campaign.leads.length,
    sent,
    failed,
  };
};

export const getCampaignMessages = async (campaignId: number) => {
  return prisma.campaignLead.findMany({
    where: {
      campaignId,
    },
    include: {
      lead: true,
      campaign: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getCampaignAnalytics = async (campaignId: number) => {
  const campaignLeads = await prisma.campaignLead.findMany({
    where: {
      campaignId,
    },
  });

  const total = campaignLeads.length;
  const sent = campaignLeads.filter((x) => x.status === 'SENT').length;
  const failed = campaignLeads.filter((x) => x.status === 'FAILED').length;
  const opened = campaignLeads.filter((x) => x.status === 'OPENED').length;
  const clicked = campaignLeads.filter((x) => x.status === 'CLICKED').length;
  const converted = campaignLeads.filter((x) => x.status === 'CONVERTED').length;

  return {
    total,
    sent,
    failed,
    opened,
    clicked,
    converted,
    deliveryRate: total ? Number(((sent / total) * 100).toFixed(1)) : 0,
    failureRate: total ? Number(((failed / total) * 100).toFixed(1)) : 0,
    openRate: total ? Number(((opened / total) * 100).toFixed(1)) : 0,
    clickRate: total ? Number(((clicked / total) * 100).toFixed(1)) : 0,
    conversionRate: total ? Number(((converted / total) * 100).toFixed(1)) : 0,
  };
};

/**
 * Promote a lead to a student login (User with role STUDENT).
 */
export const createStudentLogin = async (leadId: number, suppliedPassword?: string) => {
  // 1️⃣ Validate lead existence
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Lead not found');
  if (lead.isStudentLoginCreated) throw new Error('Student login already created for this lead');

  // 2️⃣ Ensure no existing user with the same email
  const existingUser = await prisma.user.findUnique({ where: { email: lead.email } });
  if (existingUser) throw new Error('User with this email already exists');

  // 3️⃣ Generate temporary password
  const tempPassword = suppliedPassword || crypto.randomBytes(9).toString('base64');
  const passwordHash = await hashPassword(tempPassword);

  // 4️⃣ Create STUDENT user
  const user = await prisma.user.create({
    data: {
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      passwordHash,
      role: UserRole.STUDENT,
      isActive: true,
      isApproved: true,
    },
  });

  // 5️⃣ Update lead with reference and flag
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      studentUserId: user.id,
      isStudentLoginCreated: true,
    },
  });

  // 6️⃣ Send welcome email with temporary password
  try {
    await sendCampaignEmail({
      to: user.email,
      subject: 'Your Student Account – Temporary Password',
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Welcome to OneCRM! Your student account has been created.</p>
        <p><strong>Temporary password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password immediately.</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  return user;
};

/**
 * Convert an existing student user into a marketing lead.
 * The student user remains active for login.
 */
export const convertStudentToLead = async (userId: number, overrides: any = {}) => {
  // 1️⃣ Fetch student user
  const student = await prisma.user.findUnique({ where: { id: userId } });
  if (!student) throw new Error('Student user not found');
  if (student.role !== UserRole.STUDENT) throw new Error('User is not a student');

  // 2️⃣ Guard against duplicate lead (by email or studentUserId)
  const duplicate = await prisma.lead.findFirst({
    where: {
      OR: [{ email: student.email }, { studentUserId: student.id }],
    },
  });
  if (duplicate) throw new Error('A lead already exists for this student');

  // 3️⃣ Build lead payload
  const leadData: Prisma.LeadCreateInput = {
    fullName: student.fullName,
    email: student.email,
    phone: student.phone,
    studentUserId: student.id,
    status: overrides.assignedCounsellorId ? 'NEW' : 'NEW', // default to NEW or overrides status
    ...overrides,
  };

  // 4️⃣ Create lead
  const lead = await prisma.lead.create({ data: leadData });

  return lead;
};

