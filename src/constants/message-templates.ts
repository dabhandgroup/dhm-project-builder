export function generateOutreachMessage(params: {
  clientName: string;
  previewUrl: string;
  projectTitle: string;
}): string {
  return `Hey ${params.clientName},

I came across your business and noticed your current website could use a refresh. I've gone ahead and put together a new design for you — no strings attached.

Here's your preview link: ${params.previewUrl}

The new site is faster, mobile-friendly, and built to convert visitors into customers. I'd love to hear what you think.

If you're interested in taking it live, I can handle the full setup including domain, hosting, and ongoing support for $199/month.

Let me know your thoughts!

Cheers,
Dab Hand Marketing`;
}

export function generateProjectDeliveryMessage(params: {
  clientName: string;
  previewUrl: string;
}): string {
  return `Hey ${params.clientName},

Your website project is ready for review! Here's your preview link:

${params.previewUrl}

Please take a look and let me know if you'd like any changes. I'm happy to make revisions until you're completely satisfied.

Cheers,
Dab Hand Marketing`;
}
