import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";
import { NextResponse } from "next/server";

export async function GET() {
  const bucketName = process.env.S3_BUCKET_NAME;

  if (!bucketName) {
    return NextResponse.json({ error: "S3_BUCKET_NAME not configured" }, { status: 500 });
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "",
    });

    const response = await s3Client.send(command);
    const files = (response.Contents || [])
      .filter((item) => item.Key?.endsWith(".csv"))
      .map((item) => ({
        key: item.Key,
        lastModified: item.LastModified,
        size: item.Size,
      }))
      .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("S3 List Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
