import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  schema?: object | object[];
  noIndex?: boolean;
}

const SITE_NAME = "Maya Import Export Logistic";
const BASE_URL = "https://www.mayaimportexport.com";
const DEFAULT_IMAGE = `${BASE_URL}/opengraph.jpg`;
const DEFAULT_DESC =
  "Nepal's trusted freight forwarding company. Air cargo, sea freight, road freight & customs clearance from Kathmandu. Call 014527999 or +977 9769686908.";
const DEFAULT_KEYWORDS =
  "logistics company in Nepal, customs clearance Nepal, cargo service Kathmandu, freight forwarding Nepal, air cargo Nepal, sea freight Nepal, import export Nepal, cargo company Kathmandu, international shipping Nepal, Maya Import Export";

export function SEOHead({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  schema,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Freight Forwarding & Cargo Nepal`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter / X Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Schema.org JSON-LD */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
