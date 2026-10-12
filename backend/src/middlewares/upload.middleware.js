import multer from "multer";
import ApiError from "../utils/apiError.js";

// We use memory storage (not disk) because uploaded files need to go to two
// places: pdf-parse (needs a Buffer) and Cloudinary (can upload a Buffer
// directly via upload_stream). Writing to disk first would just be an extra
// step to clean up, and Vercel/Railway-style hosts often have read-only or
// ephemeral filesystems anyway.
const storage = multer.memoryStorage();

const resumeFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest("Only PDF and DOC/DOCX files are allowed for resumes."));
  }
};

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest("Only JPG, PNG, or WEBP images are allowed."));
  }
};

export const uploadResume = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("resume");

export const uploadAvatar = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("avatar");

/**
 * Multer errors (file too large, wrong field name, etc.) don't automatically
 * become ApiError instances - this normalizes them so the global error
 * handler responds in our standard { success: false } shape instead of
 * multer's raw error format.
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(ApiError.badRequest("File is too large."));
    }
    return next(ApiError.badRequest(`Upload error: ${err.message}`));
  }
  next(err);
};
