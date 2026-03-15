const GITHUB_API = "https://api.github.com";

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function validateGithubPAT(token: string) {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: getHeaders(token),
  });

  if (!res.ok) return { valid: false, error: "Invalid token" };

  const user = await res.json();
  return { valid: true, login: user.login, name: user.name };
}

export async function createRepo(
  token: string,
  org: string,
  name: string,
  isPrivate = true,
) {
  const res = await fetch(`${GITHUB_API}/orgs/${org}/repos`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      name,
      private: isPrivate,
      auto_init: true,
    }),
  });

  if (!res.ok) {
    // Fallback to user repos if org doesn't exist
    const userRes = await fetch(`${GITHUB_API}/user/repos`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        name,
        private: isPrivate,
        auto_init: true,
      }),
    });

    if (!userRes.ok) {
      const err = await userRes.json();
      throw new Error(err.message || "Failed to create repository");
    }

    return userRes.json();
  }

  return res.json();
}

export async function pushFiles(
  token: string,
  owner: string,
  repo: string,
  files: { path: string; content: string; encoding?: "utf-8" | "base64" }[],
  message = "Initial commit from DHM Project Builder",
  branch = "main",
) {
  const headers = getHeaders(token);

  // Get the latest commit SHA
  const refRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers },
  );
  if (!refRes.ok) throw new Error("Failed to get branch reference");
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  // Get the tree SHA
  const commitRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
    { headers },
  );
  if (!commitRes.ok) throw new Error("Failed to get commit");
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const tree = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/git/blobs`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: file.content,
            encoding: file.encoding || "utf-8",
          }),
        },
      );
      const blob = await blobRes.json();
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    }),
  );

  // Create tree
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree }),
    },
  );
  if (!treeRes.ok) throw new Error("Failed to create tree");
  const treeData = await treeRes.json();

  // Create commit
  const newCommitRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    },
  );
  if (!newCommitRes.ok) throw new Error("Failed to create commit");
  const newCommit = await newCommitRes.json();

  // Update branch reference
  const updateRefRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommit.sha }),
    },
  );
  if (!updateRefRes.ok) throw new Error("Failed to update branch");

  return newCommit;
}
