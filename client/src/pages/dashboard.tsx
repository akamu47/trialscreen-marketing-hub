import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Users, Target, DollarSign, Eye, PieChart as PieIcon,
  Newspaper, CheckCircle, AlertCircle, Clock
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import type { Campaign, ContentItem, AnalyticsData } from "@shared/schema";

const CHART_COLORS = [
  "hsl(183, 98%, 22%)",  // teal
  "hsl(267, 48%, 48%)",  // purple
  "hsl(43, 90%, 52%)",   // gold
  "hsl(142, 55%, 42%)",  // green
  "hsl(12, 80%, 58%)",   // orange-red
  "hsl(210, 70%, 55%)",  // blue
];

function KpiCard({
  label, value, change, trend, icon: Icon, suffix, testId
}: {
  label: string; value: string; change?: string; trend?: "up" | "down"; icon: any; suffix?: string; testId: string;
}) {
  return (
    <Card className="hover-elevate" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-xl font-display font-bold tracking-tight">{value}{suffix && <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        {change && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
              {change}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: content, isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData[]>({
    queryKey: ["/api/analytics"],
  });

  const isLoading = campaignsLoading || contentLoading || analyticsLoading;

  if (isLoading) return <DashboardSkeleton />;

  // Compute KPIs
  const totalLeads = campaigns?.reduce((sum, c) => sum + c.leads, 0) || 0;
  const b2bMQLs = campaigns?.filter(c => c.track === "B2B").reduce((sum, c) => sum + c.leads, 0) || 0;
  const patientLeads = campaigns?.filter(c => c.track === "Patient").reduce((sum, c) => sum + c.leads, 0) || 0;
  const totalSpend = campaigns?.reduce((sum, c) => sum + c.spend, 0) || 0;
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const pipelineValue = b2bMQLs * 4200; // avg deal size estimate
  const patientScreenCompletes = analytics?.reduce((sum, d) => sum + d.preScreenerCompletes, 0) || 0;

  // Monthly lead data for line chart
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const monthlyData = months.map((month, i) => {
    const monthAnalytics = analytics?.filter((_, idx) => Math.floor(idx / 12) === i) || [];
    const b2b = monthAnalytics.filter(d => d.track === "B2B").reduce((s, d) => s + d.qualifiedLeads, 0);
    const patient = monthAnalytics.filter(d => d.track === "Patient").reduce((s, d) => s + d.qualifiedLeads, 0);
    return { month, "B2B MQLs": b2b || Math.floor(80 + i * 35 + Math.random() * 30), "Patient Leads": patient || Math.floor(200 + i * 90 + Math.random() * 60) };
  });

  // Channel mix for pie chart
  const channelTotals: Record<string, number> = {};
  analytics?.forEach(d => {
    channelTotals[d.channel] = (channelTotals[d.channel] || 0) + d.qualifiedLeads;
  });
  const channelMix = Object.entries(channelTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Recent activity
  const recentContent = content?.slice(0, 6) || [];

  const statusIcon = (status: string) => {
    switch (status) {
      case "published": return <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
      case "compliance_check": case "flagged": return <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px]" data-testid="page-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight" data-testid="text-page-title">Executive Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time performance across all marketing tracks</p>
        </div>
      </div>

      <Tabs defaultValue="all" data-testid="tabs-track-selector">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-xs px-3 h-7" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="b2b" className="text-xs px-3 h-7" data-testid="tab-b2b">Track A: B2B</TabsTrigger>
          <TabsTrigger value="patient" className="text-xs px-3 h-7" data-testid="tab-patient">Track B: Patient</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <KpiCard label="Total Leads" value={totalLeads.toLocaleString()} change="+32%" trend="up" icon={Users} testId="kpi-total-leads" />
            <KpiCard label="MQLs (B2B)" value={b2bMQLs.toLocaleString()} change="+18%" trend="up" icon={Target} testId="kpi-b2b-mqls" />
            <KpiCard label="Pre-screener" value={patientScreenCompletes.toLocaleString()} change="+45%" trend="up" icon={CheckCircle} testId="kpi-prescreener" suffix="comp" />
            <KpiCard label="Cost/Lead" value={`$${avgCPL.toFixed(2)}`} change="-8%" trend="up" icon={DollarSign} testId="kpi-cpl" />
            <KpiCard label="Website Visits" value="60.2K" change="+30%" trend="up" icon={Eye} testId="kpi-website" />
            <KpiCard label="Pipeline (B2B)" value={`$${(pipelineValue / 1000000).toFixed(1)}M`} change="+22%" trend="up" icon={PieIcon} testId="kpi-pipeline" />
            <KpiCard label="ResearchFriends" value="14.8K" change="+12%" trend="up" icon={Users} testId="kpi-research-friends" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2" data-testid="chart-lead-trend">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold">Lead Acquisition Trend</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="B2B MQLs" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Patient Leads" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="chart-channel-mix">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold">Channel Mix</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={channelMix}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {channelMix.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card data-testid="section-recent-activity">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {recentContent.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0" data-testid={`activity-item-${item.id}`}>
                    {statusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.author} · {item.contentType} · {item.platform}
                      </p>
                    </div>
                    <Badge
                      variant={item.track === "B2B" ? "default" : "secondary"}
                      className={`text-[10px] shrink-0 ${item.track === "B2B" ? "bg-primary/15 text-primary hover:bg-primary/20" : "bg-secondary/15 text-secondary hover:bg-secondary/20"}`}
                    >
                      {item.track}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="b2b" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="MQLs" value={b2bMQLs.toLocaleString()} change="+18%" trend="up" icon={Target} testId="kpi-b2b-mqls-tab" />
            <KpiCard label="Pipeline Value" value={`$${(pipelineValue / 1000000).toFixed(1)}M`} change="+22%" trend="up" icon={DollarSign} testId="kpi-b2b-pipeline-tab" />
            <KpiCard label="Avg Deal Size" value="$4,200" change="+5%" trend="up" icon={PieIcon} testId="kpi-b2b-deal-tab" />
            <KpiCard label="Win Rate" value="24%" change="+3pp" trend="up" icon={TrendingUp} testId="kpi-b2b-win-tab" />
          </div>
        </TabsContent>

        <TabsContent value="patient" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Patient Leads" value={patientLeads.toLocaleString()} change="+45%" trend="up" icon={Users} testId="kpi-patient-leads-tab" />
            <KpiCard label="Pre-screener Completes" value={patientScreenCompletes.toLocaleString()} change="+38%" trend="up" icon={CheckCircle} testId="kpi-patient-screen-tab" />
            <KpiCard label="Site Referrals" value="2,340" change="+28%" trend="up" icon={Target} testId="kpi-patient-referrals-tab" />
            <KpiCard label="ResearchFriends" value="14.8K" change="+12%" trend="up" icon={Users} testId="kpi-patient-rf-tab" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
