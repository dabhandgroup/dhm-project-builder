const NETLIFY_API = "https://api.netlify.com/api/v1";

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function validateNetlifyToken(token: string) {
  const res = await fetch(`${NETLIFY_API}/user`, {
    headers: getHeaders(token),
  });

  if (!res.ok) return { valid: false, error: "Invalid token" };

  const user = await res.json();
  return { valid: true, email: user.email, name: user.full_name };
}

export async function createSite(token: string, name: string) {
  const res = await fetch(`${NETLIFY_API}/sites`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create Netlify site");
  }

  return res.json();
}

export async function getSiteStatus(token: string, siteId: string) {
  const res = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
    headers: getHeaders(token),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function linkRepoToSite(
  token: string,
  siteId: string,
  repoUrl: string,
  branch = "main",
) {
  const res = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({
      repo: {
        provider: "github",
        repo: repoUrl,
        branch,
        cmd: "npm run build",
        dir: "out",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to link repository");
  }

  return res.json();
}
