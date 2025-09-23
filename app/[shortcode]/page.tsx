
import PublishedPage from "../pages/published-page";

export default async function Page({ params }: { params: { shortcode: string } }) {

  const newParams = await Promise.resolve(params);
  const shortcode = await Promise.resolve(newParams.shortcode); 

  return <PublishedPage shortcode={shortcode} />;
}