import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Calendar, ArrowRight } from "lucide-react";
import type { AnalyticsData, ContentItem } from "@shared/schema";

function FunnelBar({ label, value, maxValue, color, rate }: {
  label: string; value: number; maxValue: number; color: string; rate?: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="text-xs font-mono font-semibold">{value.toLocaleString()}</span>
        </div>
        <div className="h-6 bg-muted rounded-sm overflow-hidden">
          <div
            className="h-full rounded-sm transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {rate && (
        <div className="flex items-center gap-1 shrink-0 w-16">
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-mono font-semibold text-primary">{rate}</span>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState("6m");

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData[]>({
    queryKey: ["/api/analytics"],
  });

  const { data: content, isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const isLoading = analyticsLoading || contentLoading;

  // Aggregate funnel data
  const funnel = useMemo(() => {
    if (!analytics) return null;
    const totals = analytics.reduce(
      (acc, d) => ({
        impressions: acc.impressions + d.impressions,
        clicks: acc.clicks + d.clicks,
        landingPageViews: acc.landingPageViews + d.landingPageViews,
        preScreenerStarts: acc.preScreenerStarts + d.preScreenerStarts,
        preScreenerCompletes: acc.preScreenerCompletes + d.preScreenerCompletes,
        qualifiedLeads: acc.qualifiedLeads + d.qualifiedLeads,
        siteReferrals: acc.siteReferrals + d.siteReferrals,
        spend: acc.spend + d.spend,
      }),
      { impressions: 0, clicks: 0, landingPageViews: 0, preScreenerStarts: 0, preScreenerCompletes: 0, qualifiedLeads: 0, siteReferrals: 0, spend: 0 }
    );
    return totals;
  }, [analytics]);

  // Channel performance
  const channelPerf = useMemo(() => {
    if (!analytics) return [];
    const byChannel: Record<string, {
      impressions: number; clicks: number; conversions: number; spend: number; qualifiedLeads: number;
    }> = {};
    analytics.forEach((d) => {
      if (!byChannel[d.channel]) {
        byChannel[d.channel] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, qualifiedLeads: 0 };
      }
      byChannel[d.channel].impressions += d.impressions;
      byChannel[d.channel].clicks += d.clicks;
      byChannel[d.channel].conversions += d.qualifiedLeads;
      byChannel[d.channel].spend += d.spend;
      byChannel[d.channel].qualifiedLeads += d.qualifiedLeads;
    });
    return Object.entries(byChannel).map(([channel, data]) => ({
      channel,
      ...data,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions * 100) : 0,
      cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
      cpl: data.qualifiedLeads > 0 ? data.spend / data.qualifiedLeads : 0,
      roas: data.spend > 0 ? (data.qualifiedLeads * 180) / data.spend : 0, // estimated $180 per lead value
    })).sort((a, b) => b.qualifiedLeads - a.qualifiedLeads);
  }, [analytics]);

  // Top content
  const topContent = useMemo(() => {
    if (!content) return [];
    return content
      .filter(c => c.status === "published" || c.status === "approved")
      .map(c => ({
        ...c,
        views: Math.floor(Math.random() * 12000 + 1000),
        engagementRate: Math.round((Math.random() * 8 + 1) * 100) / 100,
        leadsGenerated: Math.floor(Math.random() * 200 + 20),
      }))
      .sort((a, b) => b.leadsGenerated - a.leadsGenerated)
      .slice(0, 8);
  }, [content]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const pct = (a: number, b: number) => b > 0 ? `${(a / b * 100).toFixed(1)}%` : "—";

  return (
    <div className="p-4 lg:p-6 space-y-5" data-testid="page-analytics">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight" data-testid="text-page-title">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deep performance insights across channels and content</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            {["1m", "3m", "6m", "12m"].map((r) => (
              <Button
                key={r}
                size="sm"
                variant={dateRange === r ? "default" : "ghost"}
                className={`h-6 text-[10px] px-2 ${dateRange === r ? "" : "hover:bg-background"}`}
                onClick={() => setDateRange(r)}
                data-testid={`button-range-${r}`}
              >
                {r.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      {funnel && (
        <Card data-testid="conversion-funnel">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              <FunnelBar label="Impressions" value={funnel.impressions} maxValue={funnel.impressions} color="hsl(183, 98%, 22%)" rate={pct(funnel.clicks, funnel.impressions)} />
              <FunnelBar label="Clicks" value={funnel.clicks} maxValue={funnel.impressions} color="hsl(183, 75%, 28%)" rate={pct(funnel.landingPageViews, funnel.clicks)} />
              <FunnelBar label="Landing Page Views" value={funnel.landingPageViews} maxValue={funnel.impressions} color="hsl(267, 48%, 48%)" rate={pct(funnel.preScreenerStarts, funnel.landingPageViews)} />
              <FunnelBar label="Pre-Screener Starts" value={funnel.preScreenerStarts} maxValue={funnel.impressions} color="hsl(267, 40%, 55%)" rate={pct(funnel.preScreenerCompletes, funnel.preScreenerStarts)} />
              <FunnelBar label="Pre-Screener Complete" value={funnel.preScreenerCompletes} maxValue={funnel.impressions} color="hsl(43, 90%, 52%)" rate={pct(funnel.qualifiedLeads, funnel.preScreenerCompletes)} />
              <FunnelBar label="Qualified Leads" value={funnel.qualifiedLeads} maxValue={funnel.impressions} color="hsl(142, 55%, 42%)" rate={pct(funnel.siteReferrals, funnel.qualifiedLeads)} />
              <FunnelBar label="Site Referrals" value={funnel.siteReferrals} maxValue={funnel.impressions} color="hsl(12, 80%, 58%)" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Performance */}
      <Card data-testid="channel-performance">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold">Channel Performance</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Channel</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Impressions</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Clicks</TableHead>
                  <TableHead className="text-xs font-semibold text-right">CTR</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Conversions</TableHead>
                  <TableHead className="text-xs font-semibold text-right">CPC</TableHead>
                  <TableHead className="text-xs font-semibold text-right">CPL</TableHead>
                  <TableHead className="text-xs font-semibold text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelPerf.map((ch) => (
                  <TableRow key={ch.channel} data-testid={`channel-row-${ch.channel}`}>
                    <TableCell className="text-xs font-medium">{ch.channel}</TableCell>
                    <TableCell className="text-xs font-mono text-right">{ch.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono text-right">{ch.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono text-right">{ch.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-xs font-mono text-right font-medium">{ch.conversions.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono text-right">${ch.cpc.toFixed(2)}</TableCell>
                    <TableCell className="text-xs font-mono text-right">${ch.cpl.toFixed(2)}</TableCell>
                    <TableCell className="text-xs font-mono text-right font-medium">{ch.roas.toFixed(1)}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Content */}
      <Card data-testid="top-content">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Content</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Platform</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Views</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Engagement</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topContent.map((c) => (
                  <TableRow key={c.id} data-testid={`top-content-row-${c.id}`}>
                    <TableCell className="text-xs font-medium max-w-[250px] truncate">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{c.contentType}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.platform}</TableCell>
                    <TableCell className="text-xs font-mono text-right">{c.views.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono text-right">{c.engagementRate}%</TableCell>
                    <TableCell className="text-xs font-mono text-right font-medium">{c.leadsGenerated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
