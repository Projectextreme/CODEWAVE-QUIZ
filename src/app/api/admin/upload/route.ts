import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
];

export async function POST(req: NextRequest) {
  // Auth check — must be admin
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed formats: JPEG, PNG, GIF, WebP, SVG, BMP.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.` },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename: timestamp + random suffix + original extension
    const originalExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${originalExt}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    // Build absolute URL so ALL network clients can access this image
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
    const publicUrl = baseUrl
      ? `${baseUrl}/uploads/${uniqueName}`
      : `/uploads/${uniqueName}`;

    return NextResponse.json(
      { success: true, url: publicUrl, filename: uniqueName },
      {
        headers: {
          // Allow cross-origin access to uploaded images
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Server error while saving image. Please try again." },
      { status: 500 }
    );
  }
}
