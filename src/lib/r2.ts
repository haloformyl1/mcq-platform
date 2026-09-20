import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "piechem";
export const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || "https://pub-47b99bb8dc4a41718925be6be81bb0c6.r2.dev").replace(/\/$/, "");
