
import PublishedPage from "../pages/published-page";
import { getOrgConfig } from "@/lib/orgConfig";

export default async function Page({
  params,
}: {
  params: Promise<{ shortcode: string }>;
}) {
  const { shortcode } = await params;
  const orgConfig = getOrgConfig(shortcode);

  if (orgConfig) {
    const publishedShortcode = orgConfig.diyShortcode ?? shortcode;
    return <PublishedPage shortcode={publishedShortcode} />;
  }

  return <PublishedPage shortcode={shortcode} />;
}
