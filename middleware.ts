import { NextResponse, type NextRequest } from "next/server";

// kartalbric.com/fitbridge      -> tanıtım sayfası (app/fitbridge/page.tsx), burada yönlendirme yok
// kartalbric.com/fitbridge/ac   -> uygulamayı açar:
//   - Android telefon/tablet -> Google Play'deki FitBridge uygulaması
//   - diğer tüm cihazlar (iPhone, bilgisayar) -> FitBridge web uygulaması
//   - ?web=1 eklenirse Android'de de web uygulamasına gider
export const FITBRIDGE_WEB_URL = "https://fitbridge.kartalbric.com";
export const FITBRIDGE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.fitbridge.app";

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  const forceWeb = req.nextUrl.searchParams.get("web") === "1";
  const isAndroid = /Android/i.test(ua);

  if (isAndroid && !forceWeb) {
    return NextResponse.redirect(FITBRIDGE_PLAY_URL, 307);
  }
  return NextResponse.redirect(FITBRIDGE_WEB_URL, 307);
}

export const config = {
  matcher: ["/fitbridge/ac"],
};
