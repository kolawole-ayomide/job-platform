import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/apiError.js";

/**
 * Uploads a buffer (from multer memoryStorage) to Cloudinary.
 * We use upload_stream because Cloudinary's SDK expects a file path or a
 * stream, not a raw buffer directly - so we pipe the buffer into a stream.
 *
 * @param {Buffer} fileBuffer
 * @param {object} options - { folder, resourceType, filename }
 * @returns {Promise<{url: string, publicId: string}>}
 */
export function uploadBuffer(fileBuffer, { folder, resourceType = "auto", filename } = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType, // "raw" for PDFs/DOCX, "image" for avatars
        public_id: filename,
        use_filename: !!filename,
        unique_filename: !filename,
      },
      (error, result) => {
        if (error) {
          return reject(ApiError.internal(`Cloudinary upload failed: ${error.message}`));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Deletes a previously uploaded asset (e.g. replacing an old resume/avatar).
 */
export async function deleteAsset(publicId, resourceType = "raw") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    // Non-fatal: log but don't block the request that triggered this cleanup
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error.message);
  }
}
