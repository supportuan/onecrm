import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as service from './crm-settings.service.js';

const numId = (raw: unknown): number | undefined => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

export const getFormOptions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getFormOptions();
    return sendSuccess(res, 'form options', data);
  } catch (err) {
    next(err);
  }
};

export const listCountries = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, 'countries', await service.listCountries());
  } catch (err) {
    next(err);
  }
};

export const createCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body?.name) return sendError(res, 'name is required', null, 400);
    const item = await service.createCountry(req.body);
    return sendSuccess(res, 'country created', item, 201);
  } catch (err) {
    next(err);
  }
};

export const updateCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.updateCountry(id, req.body || {});
    return sendSuccess(res, 'country updated', item);
  } catch (err) {
    next(err);
  }
};

export const deleteCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    await service.deleteCountry(id);
    return sendSuccess(res, 'country deleted', { id });
  } catch (err) {
    next(err);
  }
};

export const listUniversities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countryId = req.query.countryId ? numId(req.query.countryId) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const result = await service.listUniversities({
      countryId: countryId ?? undefined,
      page,
      limit,
      search,
    });
    return sendSuccess(res, 'universities', result);
  } catch (err) {
    next(err);
  }
};

export const createUniversity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, countryId } = req.body || {};
    if (!name || !countryId) return sendError(res, 'name and countryId are required', null, 400);
    const item = await service.createUniversity(req.body);
    return sendSuccess(res, 'university created', item, 201);
  } catch (err) {
    next(err);
  }
};

export const updateUniversity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    const item = await service.updateUniversity(id, req.body || {});
    return sendSuccess(res, 'university updated', item);
  } catch (err) {
    next(err);
  }
};

export const deleteUniversity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = numId(req.params.id);
    if (!id) return sendError(res, 'invalid id', null, 400);
    await service.deleteUniversity(id);
    return sendSuccess(res, 'university deleted', { id });
  } catch (err) {
    next(err);
  }
};

export const getCatalogStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, 'catalog stats', await service.getCatalogStats());
  } catch (err) {
    next(err);
  }
};

export const listCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countryId = req.query.countryId ? numId(req.query.countryId) : undefined;
    const universityId = req.query.universityId ? numId(req.query.universityId) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const result = await service.listCatalog({ countryId, universityId, page, limit, search });
    return sendSuccess(res, 'catalog', result);
  } catch (err) {
    next(err);
  }
};

export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? numId(req.query.universityId) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    if (!universityId) return sendError(res, 'universityId is required', null, 400);
    const result = await service.listCourses({ universityId, page, limit, search });
    return sendSuccess(res, 'courses', result);
  } catch (err) {
    next(err);
  }
};

export const findOrCreateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = numId(req.body?.universityId);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!universityId || !name) {
      return sendError(res, 'universityId and name are required', null, 400);
    }
    const result = await service.findOrCreateCourse({
      universityId,
      name,
      level: req.body?.level ?? null,
      duration: req.body?.duration ?? null,
    });
    return sendSuccess(
      res,
      result.created ? 'course created' : 'course found',
      result.course,
      result.created ? 201 : 200
    );
  } catch (err: any) {
    if (err?.status) return sendError(res, err.message, null, err.status);
    next(err);
  }
};

export const listIndustries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countryId = req.query.countryId ? numId(req.query.countryId) : undefined;
    return sendSuccess(res, 'industries', await service.listIndustries({ countryId }));
  } catch (err) {
    next(err);
  }
};

export const listIndustrySubFields = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countryId = numId(req.query.countryId);
    const industryId = numId(req.query.industryId);
    if (!countryId || !industryId) {
      return sendError(res, 'countryId and industryId are required', null, 400);
    }
    return sendSuccess(res, 'sub-fields', await service.listIndustrySubFields(countryId, industryId));
  } catch (err) {
    next(err);
  }
};

export const createIndustry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body?.name) return sendError(res, 'name is required', null, 400);
    const item = await service.createIndustry(req.body.name);
    return sendSuccess(res, 'industry created', item, 201);
  } catch (err) {
    next(err);
  }
};

export const createSubIndustry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const industryId = numId(req.params.industryId);
    if (!industryId || !req.body?.name) return sendError(res, 'industryId and name required', null, 400);
    const item = await service.createSubIndustry(industryId, req.body.name);
    return sendSuccess(res, 'sub-industry created', item, 201);
  } catch (err) {
    next(err);
  }
};

export const createStudyArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, industryId, subIndustryId } = req.body || {};
    if (!name || !industryId) return sendError(res, 'name and industryId required', null, 400);
    const item = await service.createStudyArea({ name, industryId, subIndustryId });
    return sendSuccess(res, 'study area created', item, 201);
  } catch (err) {
    next(err);
  }
};
