import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  resourceType: "video" | "raw" | "auto" | "image" = "auto",
  publicId?: string
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary environment variables not configured. Falling back to local disk storage.");
    return null;
  }

  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "video",
        format: "webm",
        public_id: publicId
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload stream error:", error);
          resolve(null);
        } else {
          // Cloudinary returns full URL with format extension
          const url = result?.secure_url || null;
          resolve(url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export default cloudinary;
