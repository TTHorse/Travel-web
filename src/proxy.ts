import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  // 注入当前 pathname 供服务端组件（如 admin layout）读取
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
