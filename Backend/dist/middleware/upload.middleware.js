// src/middleware/upload.middleware.ts
import multer from 'multer';
const storage = multer.memoryStorage();
const uploadExcel = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only Excel or CSV files are allowed'));
        }
        cb(null, true);
    },
});
export { uploadExcel };
