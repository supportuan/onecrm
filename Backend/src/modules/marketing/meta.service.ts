import axios from 'axios';
import { LeadStatus, ActivityType } from '@prisma/client';
import { prisma } from '../../prisma.js';

type MetaField = {
    name: string;
    values: string[];
};

type MetaLeadData = {
    id?: string;
    created_time?: string;
    field_data?: MetaField[];
    form_id?: string;
    ad_id?: string;
    campaign_id?: string;
};

class MetaService {
    private readonly version = 'v19.0';
    private readonly baseUrl = 'https://graph.facebook.com';

    private getAccessToken() {
        const token = process.env.META_ACCESS_TOKEN;
        if (!token) {
            throw new Error('META_ACCESS_TOKEN is not configured in .env');
        }
        return token;
    }

    private handleApiError(error: any, methodName: string): never {
        const errorMessage = error.response?.data?.error?.message
            || error.response?.data
            || error.message
            || 'Unknown Meta API error';

        console.error(`[MetaService.${methodName}] Meta API Error:`, errorMessage);

        // Throw a clean error
        throw new Error(`Meta API Error in ${methodName}: ${JSON.stringify(errorMessage)}`);
    }

    async fetchLeadData(leadgenId: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${this.version}/${leadgenId}`,
                {
                    params: { access_token: this.getAccessToken() },
                }
            );
            return response.data;
        } catch (error: any) {
            this.handleApiError(error, 'fetchLeadData');
        }
    }

    async fetchHistoricalLeads(formId: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${this.version}/${formId}/leads`,
                {
                    params: {
                        access_token: this.getAccessToken(),
                        limit: 100,
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            this.handleApiError(error, 'fetchHistoricalLeads');
        }
    }

    async fetchUserPages() {
        try {
            const pageId = process.env.META_PAGE_ID;

            if (!pageId) {
                throw new Error('META_PAGE_ID is not configured in .env');
            }

            const response = await axios.get(
                `${this.baseUrl}/${this.version}/${pageId}`,
                {
                    params: {
                        access_token: this.getAccessToken(),
                        fields: 'id,name,access_token',
                    },
                }
            );

            return {
                data: [response.data],
            };
        } catch (error: any) {
            const metaError = error.response?.data?.error;

            console.error(
                '[MetaService.fetchUserPages] Meta API Error:',
                metaError?.message || error.message
            );

            throw new Error(metaError?.message || 'Failed to fetch Meta page');
        }
    }

    async fetchLeadForms(pageId: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${this.version}/${pageId}/leadgen_forms`,
                {
                    params: {
                        access_token: this.getAccessToken(),
                        fields: 'id,name,status,leads_count',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            const metaError = error.response?.data?.error;

            console.error(
                '[MetaService.fetchLeadForms] Meta API Error:',
                metaError?.message || error.message
            );

            throw new Error(
                metaError?.message || 'Failed to fetch Meta lead forms'
            );
        }
    }

    async subscribePage(pageId: string) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/${this.version}/${pageId}/subscribed_apps`,
                null,
                {
                    params: {
                        access_token: this.getAccessToken(),
                        subscribed_fields: 'leadgen',
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            this.handleApiError(error, 'subscribePage');
        }
    }

    async syncRecentLeads() {
        try {
            const pageId = process.env.META_PAGE_ID;
            if (!pageId) {
                throw new Error('META_PAGE_ID is not configured in .env');
            }

            const formsResponse = await this.fetchLeadForms(pageId);
            const forms = formsResponse.data || [];

            let totalSynced = 0;

            const fourHoursAgo = Math.floor((Date.now() - 4 * 60 * 60 * 1000) / 1000);

            for (const form of forms) {
                try {
                    const leadsResponse = await axios.get(
                        `${this.baseUrl}/${this.version}/${form.id}/leads`,
                        {
                            params: {
                                access_token: this.getAccessToken(),
                                since: fourHoursAgo,
                                limit: 100,
                            },
                        }
                    );

                    const leads = leadsResponse.data?.data || [];

                    for (const rawLead of leads) {
                        const result = await this.processLead(rawLead);
                        if (result) totalSynced++;
                    }
                } catch (formError: any) {
                    console.warn(`[MetaService.syncRecentLeads] Failed to sync form ${form.id}:`, formError.message);
                    // Continue with other forms
                    continue;
                }
            }

            return {
                totalForms: forms.length,
                totalSynced,
            };
        } catch (error: any) {
            this.handleApiError(error, 'syncRecentLeads');
        }
    }

    private async getOrCreateMetaLeadSource() {
        try {
            let source = await prisma.leadSource.findFirst({
                where: { name: 'Meta Lead Ads' },
            });

            if (!source) {
                source = await prisma.leadSource.create({
                    data: {
                        name: 'Meta Lead Ads',
                        sourceType: 'Paid Social',
                        description: 'Leads captured from Facebook and Instagram lead forms',
                    },
                });
            }

            return source;
        } catch (error: any) {
            console.error('[MetaService.getOrCreateMetaLeadSource] Database Error:', error.message);
            throw new Error('Failed to get or create Meta lead source');
        }
    }

    private calculateLeadScore(mappedLead: any, metaLead: any): number {
        let score = 0;

        // Required contact quality
        if (mappedLead.fullName) score += 10;
        if (mappedLead.phone) score += 20;
        if (mappedLead.email && !mappedLead.email.includes('@meta-lead.local')) {
            score += 15;
        }

        // Interest quality
        if (mappedLead.preferredCountry) score += 15;
        if (mappedLead.preferredCourse) score += 15;

        // Location quality
        if (mappedLead.country) score += 10;

        // Meta campaign/ad tracking quality
        if (metaLead?.campaign_id) score += 5;
        if (metaLead?.ad_id) score += 5;
        if (metaLead?.form_id) score += 5;

        // Cap score between 0 and 100
        return Math.min(score, 100);
    }

    async processLead(metaLead: MetaLeadData) {
        try {
            const mappedLead = this.mapMetaLeadFields(metaLead);

            if (!mappedLead.fullName || !mappedLead.phone) {
                console.warn('[MetaService] Missing required lead fields', mappedLead);
                return null;
            }
            const dynamicScore = this.calculateLeadScore(mappedLead, metaLead);
            const source = await this.getOrCreateMetaLeadSource();

            const existingLead = await prisma.lead.findFirst({
                where: {
                    OR: [
                        mappedLead.email ? { email: mappedLead.email } : undefined,
                        mappedLead.phone ? { phone: mappedLead.phone } : undefined,
                    ].filter(Boolean) as any,
                    deletedAt: null,
                },
            });

            if (existingLead) {
                await prisma.leadActivity.create({
                    data: {
                        leadId: existingLead.id,
                        activityType: ActivityType.NOTE,
                        comment: 'Duplicate Meta lead received. Existing lead updated with activity log.',
                        metadata: {
                            metaLeadId: metaLead.id,
                            formId: metaLead.form_id,
                            adId: metaLead.ad_id,
                            campaignId: metaLead.campaign_id,
                        },
                    },
                });
                return existingLead;
            }

            const lead = await prisma.lead.create({
                data: {
                    fullName: mappedLead.fullName,
                    email: mappedLead.email || `${mappedLead.phone}@meta-lead.local`,
                    phone: mappedLead.phone,
                    country: mappedLead.country || null,
                    preferredCountry: mappedLead.preferredCountry || null,
                    preferredCourse: mappedLead.preferredCourse || null,
                    sourceId: source.id,
                    status: LeadStatus.NEW,
                    score: dynamicScore,
                    remark: mappedLead.remark,
                    utmSource: 'Meta',
                    utmMedium: 'Paid Social',
                    utmCampaign: metaLead.campaign_id || null,
                    utmContent: metaLead.ad_id || null,
                },
                include: { source: true },
            });

            await prisma.leadActivity.create({
                data: {
                    leadId: lead.id,
                    activityType: ActivityType.NOTE,
                    comment: 'Lead created from Meta Lead Ads webhook/sync.',
                    metadata: {
                        metaLeadId: metaLead.id,
                        formId: metaLead.form_id,
                        adId: metaLead.ad_id,
                        campaignId: metaLead.campaign_id,
                        createdTime: metaLead.created_time,
                    },
                },
            });

            return lead;
        } catch (error: any) {
            console.error('[MetaService.processLead] Error processing lead:', error.message);
            throw new Error(`Failed to process Meta lead: ${error.message}`);
        }
    }

    private mapMetaLeadFields(metaLead: MetaLeadData) {
        // ... (your existing mapping logic - unchanged)
        const mapped = {
            fullName: '',
            email: '',
            phone: '',
            country: '',
            preferredCountry: '',
            preferredCourse: '',
            remark: 'Lead captured from Meta Lead Ads',
        };

        if (!metaLead.field_data || !Array.isArray(metaLead.field_data)) {
            return mapped;
        }

        for (const field of metaLead.field_data) {
            const key = field.name.toLowerCase();
            const value = field.values?.[0] || '';

            if (key.includes('full_name') || key === 'name' || key === 'fullname' || key.includes('full name')) {
                mapped.fullName = value;
            }
            if (key.includes('email')) mapped.email = value;
            if (key.includes('phone') || key.includes('mobile') || key === 'phone_number') {
                mapped.phone = value;
            }
            if (key.includes('country') || key.includes('location')) {
                mapped.country = value;
                mapped.preferredCountry = value;
            }
            if (key.includes('course') || key.includes('program') || key.includes('interest')) {
                mapped.preferredCourse = value;
            }
        }

        return mapped;
    }
}

export const metaService = new MetaService();
export default metaService;