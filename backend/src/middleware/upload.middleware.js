import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { FILE_LIMITS, HTTP_STATUS } from '../utils/constants.js';

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      ),
      false
    );
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'
      ),
      false
    );
  }
};

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.AVATAR_SIZE },
  fileFilter: imageFilter,
}).single('avatar');

export const uploadLogo = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.AVATAR_SIZE },
  fileFilter: imageFilter,
}).single('logo');

export const uploadDocument = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.DOCUMENT_SIZE },
  fileFilter: documentFilter,
}).single('file');

export const uploadImage = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.AVATAR_SIZE },
  fileFilter: imageFilter,
}).single('image');