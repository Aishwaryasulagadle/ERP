import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit size to 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 400 });
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: "ImageKit private key not configured" }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString("base64");

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Upload directly to ImageKit REST API
    const uploadForm = new FormData();
    uploadForm.append("file", base64File);
    uploadForm.append("fileName", cleanFileName);
    uploadForm.append("useUniqueFileName", "true");
    uploadForm.append("folder", "/client_documents");

    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;

    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: uploadForm,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("ImageKit upload error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to upload to ImageKit" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.url,
      fileId: data.fileId,
      fileName: file.name,
      size: file.size,
      thumbnailUrl: data.thumbnailUrl || data.url,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
