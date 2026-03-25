import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, FileText, Send, User, Calendar } from "lucide-react";
import type { ContentItem } from "@shared/schema";

const STATUSES = [
  { key: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { key: "in_review", label: "In Review", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { key: "compliance_check", label: "Compliance Check", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { key: "approved", label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { key: "published", label: "Published", color: "bg-primary/10 text-primary" },
];

const complianceChecklist = [
  "No efficacy claims (FDA 21 CFR 312.7)",
  "All sponsorships disclosed (FTC)",
  "No investigational medicine ads to public (MHRA)",
  "Patient stories have HIPAA authorization",
  "IRB approval obtained if recruitment ad",
  "No misleading compensation language",
];

function ContentCard({ item, onMove }: { item: ContentItem; onMove: (id: number, status: string) => void }) {
  const nextStatus: Record<string, string> = {
    draft: "in_review",
    in_review: "compliance_check",
    compliance_check: "approved",
    approved: "published",
  };

  return (
    <Card className="mb-2 hover-elevate cursor-default" data-testid={`content-card-${item.id}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-semibold leading-tight line-clamp-2">{item.title}</h4>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">{item.contentType}</Badge>
          <Badge
            className={`text-[10px] h-5 px-1.5 ${item.track === "B2B" ? "bg-primary/15 text-primary hover:bg-primary/20" : "bg-secondary/15 text-secondary hover:bg-secondary/20"}`}
          >
            {item.track}
          </Badge>
          {item.complianceStatus === "flagged" && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Flagged</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{item.author}</span>
          <Calendar className="h-3 w-3 ml-1" />
          <span>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
        {item.complianceNotes && (
          <p className="text-[10px] text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded px-2 py-1 line-clamp-2">{item.complianceNotes}</p>
        )}
        {nextStatus[item.status] && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] w-full mt-1 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onMove(item.id, nextStatus[item.status])}
            data-testid={`button-move-${item.id}`}
          >
            Move to {STATUSES.find(s => s.key === nextStatus[item.status])?.label} →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContentHub() {
  const [open, setOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(complianceChecklist.length).fill(false));
  const { toast } = useToast();

  const { data: content, isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/content", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setOpen(false);
      setCheckedItems(new Array(complianceChecklist.length).fill(false));
      toast({ title: "Content created", description: "New content item added to drafts." });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/content/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    createMutation.mutate({
      title: form.get("title"),
      body: form.get("body"),
      contentType: form.get("contentType"),
      track: form.get("track"),
      platform: form.get("platform"),
      author: "Sarah Chen",
      status: "draft",
      complianceStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  const grouped = STATUSES.map(s => ({
    ...s,
    items: (content || []).filter(c => c.status === s.key),
  }));

  return (
    <div className="p-4 lg:p-6 space-y-4" data-testid="page-content-hub">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight" data-testid="text-page-title">Content Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage content workflows from draft to publication</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5" data-testid="button-create-content">
              <Plus className="h-3.5 w-3.5" />
              New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Create New Content</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Content Type</Label>
                  <Select name="contentType" required>
                    <SelectTrigger data-testid="select-content-type"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="social">Social Post</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="ad">Ad Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Track</Label>
                  <Select name="track" required>
                    <SelectTrigger data-testid="select-track"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B2B">B2B</SelectItem>
                      <SelectItem value="Patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Platform</Label>
                <Select name="platform" required>
                  <SelectTrigger data-testid="select-platform"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="X">X (Twitter)</SelectItem>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Reddit">Reddit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input name="title" required placeholder="Enter content title..." data-testid="input-title" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Body</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary">
                    <Sparkles className="h-3 w-3" /> AI Assist
                  </Button>
                </div>
                <Textarea name="body" rows={5} placeholder="Write your content..." data-testid="input-body" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Compliance Checklist</Label>
                <div className="space-y-2 bg-muted/50 rounded-md p-3">
                  {complianceChecklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Checkbox
                        id={`check-${i}`}
                        checked={checkedItems[i]}
                        onCheckedChange={(checked) => {
                          const next = [...checkedItems];
                          next[i] = checked === true;
                          setCheckedItems(next);
                        }}
                        data-testid={`checkbox-compliance-${i}`}
                      />
                      <label htmlFor={`check-${i}`} className="text-xs leading-tight cursor-pointer">{item}</label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full gap-1.5" disabled={createMutation.isPending} data-testid="button-submit-content">
                <Send className="h-3.5 w-3.5" />
                {createMutation.isPending ? "Creating..." : "Submit for Review"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-3 min-h-[600px]" data-testid="kanban-board">
        {grouped.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{col.items.length}</span>
              </div>
            </div>
            <div className="flex-1 bg-muted/30 rounded-lg p-2 space-y-0">
              {col.items.map((item) => (
                <ContentCard key={item.id} item={item} onMove={(id, status) => moveMutation.mutate({ id, status })} />
              ))}
              {col.items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="h-6 w-6 mb-2 opacity-30" />
                  <p className="text-[10px]">No items</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
