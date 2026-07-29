import { listCountries as listCatalogCountries } from '../crm-settings/crm-settings.service.js';

export const getAvailableCountries = async () => listCatalogCountries();