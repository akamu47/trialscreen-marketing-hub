import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, ArrowUpDown, ChevronRight, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { Campaign } from "@shared/schema";

type SortKey = "name" | "budget" | "spend" | "leads" | "cpl" | "ctr";
type SortDir = "asc" | "desc";

function PerformanceBadge({ perf }: { perf: string }) {
  const config: Record<string, { label: string; className: string }> = {
    "on-track": { label: "On Track", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    "needs-attention": { label: "Needs Attention", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
    "off-track": { label: "Off Track", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  };
  const c = config[perf] || config["on-track"];
  return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-muted text-muted-foreground",
  };
  return <Badge className={`text-[10px] capitalize ${config[status] || ""}`}>{status}</Badge>;
}

function SparklineChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="leads" stroke="hsl(183, 98%, 22%)" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const dailyData = campaign.dailyData ? JSON.parse(campaign.dailyData) : [];
  const budgetUtilization = (campaign.spend / campaign.budget) * 100;

  return (
    <div className="px-4 pb-4 pt-1 bg-muted/30 border-t">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
        {[
          { label: "Impressions", value: campaign.impressions.toLocaleString() },
          { label: "Clicks", value: campaign.clicks.toLocaleString() },
          { label: "CTR", value: `${campaign.ctr.toFixed(2)}%` },
          { label: "Conversions", value: campaign.conversions.toLocaleString() },
          { label: "CPC", value: `$${campaign.cpc.toFixed(2)}` },
          { label: "CPL", value: `$${campaign.cpl.toFixed(2)}` },
          { label: "Spend", value: `$${campaign.spend.toLocaleString()}` },
        ].map((m) => (
          <div key={m.label} className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
            <p className="text-sm font-semibold font-mono">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Budget Utilization</span>
          <span className="font-mono font-medium">${campaign.spend.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
        </div>
        <Progress value={Math.min(budgetUtilization, 100)} className="h-2" />
      </div>
      {dailyData.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Daily Performance (30d)</p>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={dailyData}>
              <Line type="monotone" dataKey="leads" stroke="hsl(183, 98%, 22%)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="clicks" stroke="hsl(267, 48%, 48%)" strokeWidth={1} dot={false} opacity={0.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function Campaigns() {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const sorted = useMemo(() => {
    if (!campaigns) return [];
    return [...campaigns].sort((a, b) => {
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [campaigns, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalBudget = campaigns?.reduce((s, c) => s + c.budget, 0) || 0;
  const totalSpend = campaigns?.reduce((s, c) => s + c.spend, 0) || 0;
  const totalLeads = campaigns?.reduce((s, c) => s + c.leads, 0) || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;

  return (
    <div className="p-4 lg:p-6 space-y-4" data-testid="page-campaigns">
      <div>
        <h1 className="text-xl font-display font-bold tracking-tight" data-testid="text-page-title">Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track and manage marketing campaigns across all channels</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</p>
            <p className="text-lg font-display font-bold">{activeCampaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Budget</p>
            <p className="text-lg font-display font-bold">${(totalBudget / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Spend</p>
            <p className="text-lg font-display font-bold">${(totalSpend / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Leads</p>
            <p className="text-lg font-display font-bold">{totalLeads.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card data-testid="campaigns-table">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>
                    <button className="flex items-center text-xs font-semibold" onClick={() => toggleSort("name")} data-testid="sort-name">
                      Campaign <SortIcon col="name" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">Track</TableHead>
                  <TableHead className="text-xs">Platform</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead>
                    <button className="flex items-center text-xs font-semibold" onClick={() => toggleSort("budget")} data-testid="sort-budget">
                      Budget <SortIcon col="budget" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center text-xs font-semibold" onClick={() => toggleSort("spend")} data-testid="sort-spend">
                      Spend <SortIcon col="spend" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center text-xs font-semibold" onClick={() => toggleSort("leads")} data-testid="sort-leads">
                      Leads <SortIcon col="leads" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center text-xs font-semibold" onClick={() => toggleSort("cpl")} data-testid="sort-cpl">
                      CPL <SortIcon col="cpl" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center text-xs font-semibold" onClick={() => toggleSort("ctr")} data-testid="sort-ctr">
                      CTR <SortIcon col="ctr" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">Perf</TableHead>
                  <TableHead className="text-xs w-20">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((c) => {
                  const isExpanded = expanded.has(c.id);
                  const dailyData = c.dailyData ? JSON.parse(c.dailyData).slice(-14) : [];
                  return (
                    <TableRow key={c.id} className="group cursor-pointer" onClick={() => toggleExpand(c.id)} data-testid={`campaign-row-${c.id}`}>
                      <TableCell className="w-8 px-2">
                        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </TableCell>
                      <TableCell className="font-medium text-xs max-w-[200px] truncate">{c.name}</TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${c.track === "B2B" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}
                        >{c.track}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.platform}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-xs font-mono">${c.budget.toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-mono">${c.spend.toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-mono font-medium">{c.leads.toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-mono">${c.cpl.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono">{c.ctr.toFixed(2)}%</TableCell>
                      <TableCell><PerformanceBadge perf={c.performance} /></TableCell>
                      <TableCell>
                        {dailyData.length > 0 && <SparklineChart data={dailyData} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Expanded detail panels (rendered outside table for proper layout) */}
          {sorted.map((c) =>
            expanded.has(c.id) ? (
              <CampaignDetail key={`detail-${c.id}`} campaign={c} />
            ) : null
          )}
        </CardContent>
      </Card>
    </div>
  );
}
