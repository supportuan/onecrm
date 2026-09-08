const omitTenantIdDeep = (value, seen = new WeakSet()) => {
    if (value == null || typeof value !== 'object')
        return value;
    if (value instanceof Date)
        return value;
    if (seen.has(value))
        return value;
    seen.add(value);
    if (Array.isArray(value))
        return value.map((item) => omitTenantIdDeep(item, seen));
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null)
        return value;
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
        if (key === 'tenantId')
            continue;
        out[key] = omitTenantIdDeep(nested, seen);
    }
    return out;
};
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data: omitTenantIdDeep(data),
    });
};
export const sendError = (res, message, errors = null, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
