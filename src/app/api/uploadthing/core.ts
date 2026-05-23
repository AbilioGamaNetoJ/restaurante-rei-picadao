import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const { userId, sessionClaims } = await auth();
 
      if (!userId) throw new Error("Unauthorized");

      const role = (sessionClaims?.metadata as any)?.role;
      if (role !== 'dono' && role !== 'gerente') {
        throw new Error("Forbidden");
      }
 
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
