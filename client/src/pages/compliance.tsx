import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, FileText, BookOpen
} from "lucide-react";
import type { ContentItem, AuditLog } from "@shared/schema";

const complianceRules = [
  { rule: "No efficacy claims (FDA 21 CFR 312.7)", severity: "critical", description: "Cannot claim or imply that an investigational drug/device is safe or effective." },
  { rule: "Disclose all sponsorships (FTC)", severity: "critical", description: "All sponsored content must clearly identify the sponsor relationship." },
  { rule: "No investigational medicine ads to public (MHRA Reg 279)", severity: "critical", description: "Advertising of investigational medicinal products to the general public is prohibited." },
  { rule: "Patient stories require HIPAA authorization", severity: "high", description: "Any patient testimonial or story requires signed HIPAA authorization before publication." },
  { rule: "Education content: No IRB needed", severity: "info", description: "General educational content about clinical trials does not require IRB approval." },
  { rule: "Recruitment advertising: IRB required BEFORE publishing", severity: "critical", description: "All recruitment advertising materials must receive IRB approval before publication." },
];

function ActionBadge({ action }: { action: string }) {
  const config: Record<string, { icon: any; className: string }> = {
    approved: { icon: CheckCircle, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    flagged: { icon: AlertTriangle, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
    rejected: { icon: XCircle, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  };
  const c = config[action] || config.approved;
  const Icon = c.icon;
  return (
    <Badge className={`text-[10px] gap-1 ${c.className}`}>
      <Icon className="h-3 w-3" />
      <span className="capitalize">{action}</span>
    </Badge>
  );
}

export default function Compliance() {
  const { toast } = useToast();

  const { data: content, isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-log"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: number; action: string; notes?: string }) => {
      // Update content item
      await apiRequest("PATCH", `/api/content/${id}`, {
        complianceStatus: action,
        complianceReviewer: "Sarah Chen",
        complianceDate: new Date().toISOString(),
        complianceNotes: notes || null,
        status: action === "approved" ? "approved" : "compliance_check",
      });
      // Create audit log
      const item = content?.find(c => c.id === id);
      await apiRequest("POST", "/api/audit-log", {
        contentId: id,
        contentTitle: item?.title || "Unknown",
        action,
        reviewer: "Sarah Chen",
        notes: notes || `Content ${action} during compliance review.`,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-log"] });
      toast({ title: "Review submitted", description: "Compliance status updated." });
    },
  });

  const isLoading = contentLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Pending reviews
  const pendingReviews = (content || []).filter(
    c => c.status === "compliance_check" || c.complianceStatus === "pending"
  );

  return (
    <div className="p-4 lg:p-6 space-y-5" data-testid="page-compliance">
      <div>
        <h1 className="text-xl font-display font-bold tracking-tight" data-testid="text-page-title">Compliance Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review content compliance and manage regulatory approvals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Reviews */}
        <Card className="lg:col-span-2" data-testid="pending-reviews">
          <CardHeader className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending Reviews
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{pendingReviews.length} pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {pendingReviews.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Shield className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">All content reviewed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2" data-testid={`review-item-${item.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-semibold leading-tight">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{item.author}</span>
                          <span>·</span>
                          <Badge variant="outline" className="text-[10px] h-4">{item.contentType}</Badge>
                          <Badge
                            className={`text-[10px] h-4 ${item.track === "B2B" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}
                          >{item.track}</Badge>
                          <span>{item.platform}</span>
                        </div>
                      </div>
                      {item.complianceStatus === "flagged" && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">Flagged</Badge>
                      )}
                    </div>
                    {item.complianceNotes && (
                      <p className="text-[10px] text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded px-2 py-1">{item.complianceNotes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => reviewMutation.mutate({ id: item.id, action: "approved", notes: "Approved after compliance review." })}
                        disabled={reviewMutation.isPending}
                        data-testid={`button-approve-${item.id}`}
                      >
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] gap-1 text-yellow-700 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-300"
                        onClick={() => reviewMutation.mutate({ id: item.id, action: "flagged", notes: "Flagged for further review." })}
                        disabled={reviewMutation.isPending}
                        data-testid={`button-flag-${item.id}`}
                      >
                        <AlertTriangle className="h-3 w-3" /> Flag
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] gap-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400"
                        onClick={() => reviewMutation.mutate({ id: item.id, action: "rejected", notes: "Rejected during compliance review." })}
                        disabled={reviewMutation.isPending}
                        data-testid={`button-reject-${item.id}`}
                      >
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Checklist Reference */}
        <Card data-testid="compliance-checklist">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Compliance Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {complianceRules.map((rule, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] shrink-0 mt-0.5 ${
                        rule.severity === "critical" ? "border-red-300 text-red-600 dark:text-red-400" :
                        rule.severity === "high" ? "border-yellow-300 text-yellow-700 dark:text-yellow-300" :
                        "border-blue-300 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {rule.severity}
                    </Badge>
                    <div>
                      <p className="text-xs font-medium leading-tight">{rule.rule}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{rule.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card data-testid="audit-log">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold">Content</TableHead>
                  <TableHead className="text-xs font-semibold">Action</TableHead>
                  <TableHead className="text-xs font-semibold">Reviewer</TableHead>
                  <TableHead className="text-xs font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(auditLogs || []).map((log) => (
                  <TableRow key={log.id} data-testid={`audit-row-${log.id}`}>
                    <TableCell className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-xs font-medium max-w-[220px] truncate">{log.contentTitle}</TableCell>
                    <TableCell><ActionBadge action={log.action} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.reviewer}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{log.notes}</TableCell>
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
