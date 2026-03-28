/**
 * Extract contact details (phone, email, address) from crawled page content.
 */
export function extractContactFromPages(
  pages: { markdown: string; url: string }[]
): { phone: string; email: string; address: string } {
  const allText = pages.map((p) => p.markdown).join("\n");

  // Extract email — look for common patterns, skip image/asset emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = (allText.match(emailRegex) || []).filter(
    (e) => !e.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i) && !e.includes("sentry") && !e.includes("wixpress")
  );
  const email = emails[0] || "";

  // Extract phone — UK and international formats
  const phonePatterns = [
    /(?:tel:|phone:|call us|call:?)\s*([\d\s()+-]{7,20})/gi,
    /(?:0\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4})/g, // UK landline
    /(?:07\d{3}[\s.-]?\d{3}[\s.-]?\d{3})/g, // UK mobile
    /(?:\+44[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4})/g, // +44
    /(?:\+1[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g, // US/Canada
  ];

  let phone = "";
  for (const pattern of phonePatterns) {
    const matches = allText.match(pattern);
    if (matches && matches.length > 0) {
      // Clean up the match
      phone = matches[0]
        .replace(/^(?:tel:|phone:|call us|call:?)\s*/i, "")
        .trim();
      break;
    }
  }

  // Extract address — look for common UK/US address patterns
  const addressPatterns = [
    // UK postcode-based (captures surrounding text)
    /[\w\s,.-]{5,60}[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}/gm,
    // Street address with number
    /\d{1,5}\s+[\w\s]{3,40}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Close|Crescent|Way|Place|Pl|Court|Ct|Terrace|Park|Gardens|Square)[,.\s]+[\w\s,]+/gi,
  ];

  let address = "";
  for (const pattern of addressPatterns) {
    const matches = allText.match(pattern);
    if (matches && matches.length > 0) {
      address = matches[0].replace(/\s+/g, " ").trim();
      break;
    }
  }

  return { phone, email, address };
}
