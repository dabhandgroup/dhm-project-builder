import { NextRequest, NextResponse } from "next/server";

interface InstagramPost {
  id: string;
  shortcode: string;
  imageUrl: string;
  caption: string;
  link: string;
  isVideo: boolean;
  timestamp?: number;
}

interface InstagramProfile {
  username: string;
  fullName: string;
  profilePicUrl: string;
  posts: InstagramPost[];
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const clean = username.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "").trim();

  try {
    // Try the web_profile_info endpoint (works server-side)
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(clean)}`,
      {
        headers: {
          "x-ig-app-id": "936619743392459",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 3600 }, // cache 1 hour
      },
    );

    if (!res.ok) {
      // Fallback: try scraping the profile page HTML
      return await scrapeProfilePage(clean);
    }

    const data = await res.json();
    const user = data?.data?.user;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const edges = user.edge_owner_to_timeline_media?.edges ?? [];
    const posts: InstagramPost[] = edges.map((e: Record<string, unknown>) => {
      const node = e.node as Record<string, unknown>;
      return {
        id: node.id as string,
        shortcode: node.shortcode as string,
        imageUrl: (node.thumbnail_src || node.display_url) as string,
        caption: ((node.edge_media_to_caption as Record<string, unknown[]>)?.edges?.[0] as Record<string, Record<string, string>> | undefined)?.node?.text ?? "",
        link: `https://www.instagram.com/p/${node.shortcode}/`,
        isVideo: node.is_video === true,
        timestamp: (node.taken_at_timestamp as number) || undefined,
      };
    });

    const profile: InstagramProfile = {
      username: clean,
      fullName: user.full_name || clean,
      profilePicUrl: user.profile_pic_url || "",
      posts,
    };

    return NextResponse.json(profile);
  } catch (err) {
    // Fallback to scraping
    try {
      return await scrapeProfilePage(clean);
    } catch {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to fetch Instagram data" },
        { status: 500 },
      );
    }
  }
}

async function scrapeProfilePage(username: string): Promise<NextResponse> {
  const res = await fetch(`https://www.instagram.com/${username}/`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to load Instagram profile" }, { status: 502 });
  }

  const html = await res.text();

  // Try to extract shared_data or additional_data JSON from the page
  const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({[\s\S]*?});<\/script>/);
  if (sharedDataMatch) {
    try {
      const shared = JSON.parse(sharedDataMatch[1]);
      const user = shared?.entry_data?.ProfilePage?.[0]?.graphql?.user;
      if (user) {
        const edges = user.edge_owner_to_timeline_media?.edges ?? [];
        const posts: InstagramPost[] = edges.map((e: Record<string, unknown>) => {
          const node = e.node as Record<string, unknown>;
          return {
            id: node.id as string,
            shortcode: node.shortcode as string,
            imageUrl: (node.thumbnail_src || node.display_url) as string,
            caption: ((node.edge_media_to_caption as Record<string, unknown[]>)?.edges?.[0] as Record<string, Record<string, string>> | undefined)?.node?.text ?? "",
            link: `https://www.instagram.com/p/${node.shortcode}/`,
            isVideo: node.is_video === true,
          };
        });

        return NextResponse.json({
          username,
          fullName: user.full_name || username,
          profilePicUrl: user.profile_pic_url || "",
          posts,
        });
      }
    } catch {
      // continue
    }
  }

  return NextResponse.json({ error: "Could not parse Instagram data" }, { status: 502 });
}
