import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  const bucketName = process.env.S3_BUCKET_NAME;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    const bodyString = await response.Body?.transformToString();

    return new NextResponse(bodyString, {
      headers: {
        "Content-Type": "text/csv",
      },
    });
  } catch (error: any) {
    console.error("S3 Get Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
