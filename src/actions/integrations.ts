"use server";

import { validateGithubPAT } from "@/lib/github";
import { validateVercelToken } from "@/lib/vercel";
import { validateNetlifyToken } from "@/lib/netlify";
import { validateFirecrawlKey } from "@/lib/firecrawl";
import { validateAnthropicKey } from "@/lib/anthropic";

export async function testGithubConnection(token: string) {
  try {
    return await validateGithubPAT(token);
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}

export async function testVercelConnection(token: string) {
  try {
    return await validateVercelToken(token);
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}

export async function testNetlifyConnection(token: string) {
  try {
    return await validateNetlifyToken(token);
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}

export async function testFirecrawlConnection(apiKey: string) {
  try {
    return await validateFirecrawlKey(apiKey);
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}

export async function testAnthropicConnection(apiKey: string) {
  try {
    return await validateAnthropicKey(apiKey);
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}
