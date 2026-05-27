export const tenantMiddleware = (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    req.tenantId = tenantId;
    // Log the tenant routing context
    console.log(`[Tenant Route Context] Request routed to tenant: ${tenantId}`);
    next();
};
