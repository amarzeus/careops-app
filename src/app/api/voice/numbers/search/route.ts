import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  searchAvailableNumbers,
  getRegulatoryRequirements,
  isTwilioConfigured,
} from "@/lib/twilio-platform";
import { prisma } from "@/lib/prisma";

const SUPPORTED_COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", hasMobile: true, hasTollfree: true },
  { code: "CA", name: "Canada", flag: "🇨🇦", hasMobile: true, hasTollfree: true },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", hasMobile: true, hasTollfree: true },
  { code: "AU", name: "Australia", flag: "🇦🇺", hasMobile: true, hasTollfree: true },
  { code: "IN", name: "India", flag: "🇮🇳", hasMobile: true, hasTollfree: false },
  { code: "DE", name: "Germany", flag: "🇩🇪", hasMobile: true, hasTollfree: true },
  { code: "FR", name: "France", flag: "🇫🇷", hasMobile: true, hasTollfree: true },
];

/**
 *
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get("country") || "US";
    const areaCode = searchParams.get("areaCode") || undefined;
    const pattern = searchParams.get("pattern") || undefined;
    const numberType = (searchParams.get("type") || "local") as "local" | "tollfree" | "mobile";
    const listCountries = searchParams.get("listCountries") === "true";

    if (listCountries) {
      return NextResponse.json({
        countries: SUPPORTED_COUNTRIES,
        twilioConfigured: isTwilioConfigured(),
      });
    }

    const regulatory = getRegulatoryRequirements(countryCode, numberType);

    let verifiedDocuments: string[] = [];
    if (regulatory.required) {
      const docs = await prisma.complianceDocument.findMany({
        where: {
          workspaceId: user.workspaceId,
          status: "VERIFIED",
        },
        select: { documentType: true },
      });
      verifiedDocuments = docs.map((d) => d.documentType);
    }

    const complianceMet = regulatory.required
      ? regulatory.documents.every((doc) => verifiedDocuments.includes(doc))
      : true;

    const numbers = await searchAvailableNumbers({
      countryCode,
      areaCode,
      pattern,
      numberType,
      limit: 20,
    });

    return NextResponse.json({
      numbers,
      country: countryCode,
      numberType,
      regulatory: regulatory.required
        ? {
            ...regulatory,
            verifiedDocuments,
            complianceMet,
          }
        : null,
      twilioConfigured: isTwilioConfigured(),
    });
  } catch (error) {
    console.error("[Phone Search] Error:", error);
    return NextResponse.json({ error: "Failed to search phone numbers" }, { status: 500 });
  }
}
