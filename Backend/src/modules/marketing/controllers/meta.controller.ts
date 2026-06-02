import { Request, Response } from 'express';
import metaService from '../services/meta.service.js';

export const getPages = async (_req: Request, res: Response) => {
    try {
        const data = await metaService.fetchUserPages();

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.response?.data || error.message,
        });
    }
};

export const getForms = async (req: Request, res: Response) => {
    try {
        const { pageId } = req.params;

        const data = await metaService.fetchLeadForms(pageId);

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.response?.data || error.message,
        });
    }
};

export const syncLeads = async (_req: Request, res: Response) => {
    try {
        const data = await metaService.syncRecentLeads();

        res.json({
            success: true,
            message: 'Meta leads synced successfully',
            data,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.response?.data || error.message,
        });
    }
};

export const verifyWebhook = async (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
};

export const receiveWebhook = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadgenId = change.value.leadgen_id;

                        const leadData = await metaService.fetchLeadData(
                            leadgenId
                        );

                        await metaService.processLead(leadData);
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.response?.data || error.message,
        });
    }
};