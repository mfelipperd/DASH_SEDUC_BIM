import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const accessKey = request.headers.get("x-access-key");
    const adminKey = process.env.UPLOAD_ACCESS_KEY;

    if (!accessKey || accessKey !== adminKey) {
      return NextResponse.json({ error: "Invalid access key" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
