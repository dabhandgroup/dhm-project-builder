const VERCEL_API = "https://api.vercel.com";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function createVercelProject(name: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = `${VERCEL_API}/v10/projects${teamId ? `?teamId=${teamId}` : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      framework: null,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to create Vercel project");
  }

  return res.json();
}

export async function addCustomDomain(
  projectId: string,
  domain: string
) {
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = `${VERCEL_API}/v10/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name: domain }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to add domain");
  }

  return res.json();
}

export async function getDeploymentStatus(deploymentId: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = `${VERCEL_API}/v13/deployments/${deploymentId}${teamId ? `?teamId=${teamId}` : ""}`;

  const res = await fetch(url, {
    headers: getHeaders(),
  });

  if (!res.ok) return null;
  return res.json();
}
