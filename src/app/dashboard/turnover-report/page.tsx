import type { Metadata } from "next";
import { TurnoverReportClient } from "@/components/turnover/turnover-report-client";

export const metadata: Metadata = {
  title: "Turnover Report | GSTTax",
  description: "Generate GST turnover reports with Sales and Purchase summaries",
};

export default function TurnoverReportPage() {
  return <TurnoverReportClient />;
}
