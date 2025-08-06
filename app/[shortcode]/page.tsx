import PublishedPage from "../pages/published-page";

export default function Page({ params }: { params: { shortcode: string } }) {
  return <PublishedPage shortcode={params.shortcode} />;
}