import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    const key = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: "text/csv",
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true, key });
  } catch (error: any) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
