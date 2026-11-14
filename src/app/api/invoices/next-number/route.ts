// Backward-compatible endpoint. The shared document-numbering API handles
// both tax and Proforma invoice previews using the same Admin configuration.
export { GET } from "@/app/api/document-numbers/next/route";
