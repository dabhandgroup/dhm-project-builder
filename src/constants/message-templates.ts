export function generateOutreachMessage(params: {
  clientName: string;
  previewUrl: string;
  projectTitle: string;
}): string {
  // Use first name only
  const firstName = params.clientName.split(" ")[0];
  return `Hey ${firstName},

Hope you're well! I came across your business and thought your website could do with a bit of a refresh — so I've gone ahead and put together a new design for you, completely free.

Here's your preview: ${params.previewUrl}

It's faster, looks great on mobile, and built to actually turn visitors into enquiries. Would love to know what you think!

If you're keen to chat about getting it live, grab a time that works for you here:
https://www.dabhandmarketing.com/book-a-call/

No pressure at all — just thought it was worth a look.

Cheers,
Danny
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
