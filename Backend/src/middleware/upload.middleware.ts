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

const uploadMedia = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // Up to 100MB for video/image uploads
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only image (JPEG, PNG, GIF) or video (MP4, MPEG, MOV) files are allowed'));
        }

        cb(null, true);
    },
});

export { uploadExcel, uploadMedia };