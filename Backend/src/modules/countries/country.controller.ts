import type { Request, Response, NextFunction } from 'express';
import * as countryService from './country.service.js';

export const listAvailableCountries = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const countries = await countryService.getAvailableCountries();

    return res.status(200).json({
      success: true,
      message: 'Countries fetched successfully',
      data: countries,
    });
  } catch (error) {
    next(error);
  }
};