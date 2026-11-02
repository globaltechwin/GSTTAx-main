import { notFound } from "next/navigation";
import { CompaniesClient } from "@/components/company/companies-client";
import { PlatformImportExport } from "@/components/superadmin/platform-import-export";
import { InvoiceClient } from "@/components/invoice/invoice-client";
import { PurchasesClient } from "@/components/purchase/purchases-client";
import { ReferralClient } from "@/components/referral/referral-client";
import { PlatformSettings } from "@/components/settings/platform-settings";
import { ToCompanyClient } from "@/components/to-company/to-company-client";
import { TurnoverReportClient } from "@/components/turnover/turnover-report-client";
import { UsersClient } from "@/components/user/users-client";

type RouteProps = { params: Promise<{ section: string }> };

export default async function SuperadminSectionPage({ params }: RouteProps) {
  const { section } = await params;

  switch (section) {
    case "companies":
      return <CompaniesClient />;
    case "to-companies":
      return <ToCompanyClient />;
    case "invoices":
      return <InvoiceClient />;
    case "purchases":
      return <PurchasesClient />;
    case "turnover-report":
      return <TurnoverReportClient />;
    case "referrals":
      return <ReferralClient />;
    case "import-export":
      return <PlatformImportExport />;
    case "users":
      return <UsersClient />;
    case "settings":
      return <PlatformSettings />;
    default:
      notFound();
  }
}
