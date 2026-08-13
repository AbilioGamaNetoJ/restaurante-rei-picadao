import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from 'uploadthing/server';
import { auth } from "@clerk/nextjs/server";
import { can, getRoleFromClaims } from '@/lib/permissions';
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit';
 
const f = createUploadthing();

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedImageExtensions = /\.(jpe?g|png|webp)$/i;

function hasAllowedImageSignature(bytes: Uint8Array) {
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12
    && String.fromCodePoint(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCodePoint(...bytes.slice(8, 12)) === 'WEBP';

  return isJpeg || isPng || isWebp;
}
 
export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req, files }) => {
      const { userId, sessionClaims } = await auth();
 
      if (!userId) throw new Error("Unauthorized");

      const role = getRoleFromClaims(sessionClaims);
      if (!can(role, 'manage_products')) {
        throw new Error("Forbidden");
      }

      const rateLimit = await checkRateLimit('upload', `${userId}:${getRequestIp(req)}`);
      if (!rateLimit.success) {
        throw new Error(rateLimit.unavailable ? 'Upload service unavailable' : 'Too many upload attempts');
      }

      if (!files.every((file) => allowedImageTypes.has(file.type) && allowedImageExtensions.test(file.name))) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      return { userId, role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const uploadedFile = await fetch(file.ufsUrl, { signal: AbortSignal.timeout(10_000) });
        const firstBytes = new Uint8Array((await uploadedFile.arrayBuffer()).slice(0, 12));
        if (!uploadedFile.ok || !hasAllowedImageSignature(firstBytes)) {
          await new UTApi().deleteFiles(file.key);
          throw new Error('Unsupported image file');
        }
      } catch (error) {
        console.error('Uploaded image validation failed', {
          reason: error instanceof Error ? error.name : 'UnknownError',
        });
        throw new Error('Uploaded image validation failed');
      }

      console.log("Upload completed", { uploadedByRole: metadata.role });
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
