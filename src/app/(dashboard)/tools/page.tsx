import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, ImageIcon, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "Performance Audit",
    description:
      "Compare website speeds before and after a rebuild. Uses Google PageSpeed Insights and GTmetrix.",
    href: "/tools/performance-audit",
    icon: Gauge,
  },
  {
    title: "Image Optimiser",
    description:
      "Compress, resize, and convert images to WebP. Processed entirely in your browser — nothing uploaded to a server.",
    href: "/tools/image-optimiser",
    icon: ImageIcon,
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools"
        description="Utilities for web projects"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <tool.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {tool.title}
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
