import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
}

export function SEO({ title, description, path, type = "website", noindex }: SEOProps) {
  const fullTitle = title.includes("M-Chama") ? title : `${title} | M-Chama`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={path} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={path} />
      <meta property="og:type" content={type} />
      {noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
}
