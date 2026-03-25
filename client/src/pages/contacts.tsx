import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Flame,
  Star,
  BarChart3,
  Search,
  X,
  Building2,
  MapPin,
  DollarSign,
  FlaskConical,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Video,
  Linkedin,
  StickyNote,
  Calendar,
  Plus,
  Clock,
  Globe,
  Link2,
} from "lucide-react";
import type { Contact, Activity } from "@shared/schema";
import { SEED_CONTACTS } from "@/data/seed-contacts";

// Segment color map
const SEGMENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Pharma Sponsor": { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", dot: "bg-[#01696F]" },
  "CRO": { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", dot: "bg-[#6A3FB5]" },
  "Site Network": { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", dot: "bg-[#2563EB]" },
  "Academic Institution": { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-[#D97706]" },
  "Patient Advocacy Group": { bg: "bg-pink-50 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-300", dot: "bg-[#DB2777]" },
  "Industry Body": { bg: "bg-slate-50 dark:bg-slate-800/40", text: "text-slate-700 dark:text-slate-300", dot: "bg-[#475569]" },
  "Competitor": { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", dot: "bg-[#DC2626]" },
};

const REGION_COLORS: Record<string, string> = {
  US: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  UK: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  APAC: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Global: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  EU: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
};

const PRIORITY_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-800 dark:text-teal-200" },
  2: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-200" },
  3: { bg: "bg-gray-100 dark:bg-gray-800/40", text: "text-gray-600 dark:text-gray-400" },
};

const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string }> = {
  warm: { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300" },
  known: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
  cold: { bg: "bg-gray-100 dark:bg-gray-800/40", text: "text-gray-600 dark:text-gray-400" },
};

const PIPELINE_STAGES = ["prospect", "outreach", "engaged", "opportunity", "customer", "monitor"] as const;

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  outreach: "Outreach",
  engaged: "Engaged",
  opportunity: "Opportunity",
  customer: "Customer",
  monitor: "Monitor",
};

const ACTIVITY_ICONS: Record<string, any> = {
  email: Mail,
  call: Phone,
  meeting: Video,
  linkedin: Linkedin,
  note: StickyNote,
  event: Calendar,
};

const ALL_SEGMENTS = ["Pharma Sponsor", "CRO", "Site Network", "Academic Institution", "Patient Advocacy Group", "Industry Body", "Competitor"];
const ALL_REGIONS = ["US", "UK", "APAC", "Global", "EU"];

type SortField = "company" | "segment" | "region" | "priority" | "pipelineStage" | "relationshipStatus" | "lastActivityDate";
type SortDir = "asc" | "desc";

function SegmentBadge({ segment }: { segment: string }) {
  const colors = SEGMENT_COLORS[segment] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {segment}
    </span>
  );
}

function PipelineStageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    prospect: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    outreach: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    engaged: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    opportunity: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    customer: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    monitor: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[stage] || colors.prospect}`}>
      {STAGE_LABELS[stage] || stage}
    </span>
  );
}

// Pipeline summary card component
function PipelineCard({
  label, value, subtitle, icon: Icon, color, testId
}: {
  label: string; value: number | string; subtitle?: string; icon: any; color: string; testId: string;
}) {
  return (
    <Card className="hover-elevate" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</p>
            <p className="text-lg font-display font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          </div>
          <div className={`h-8 w-8 rounded-md ${color} flex items-center justify-center`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ContactsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-lg" />
      ))}
    </div>
  );
}

// The main contacts table
function ContactsTable({
  contacts,
  sortField,
  sortDir,
  onSort,
  onSelectContact,
  onStageChange,
}: {
  contacts: Contact[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onSelectContact: (contact: Contact) => void;
  onStageChange: (id: number, stage: string) => void;
}) {
  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
      onClick={(e) => { e.stopPropagation(); onSort(field); }}
      data-testid={`sort-${field}`}
    >
      {children}
      {sortField === field ? (
        sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider w-[200px]">
                <SortButton field="company">Company</SortButton>
              </TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">
                <SortButton field="segment">Segment</SortButton>
              </TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">
                <SortButton field="region">Region</SortButton>
              </TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider w-[60px]">
                <SortButton field="priority">Priority</SortButton>
              </TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider w-[130px]">
                <SortButton field="pipelineStage">Stage</SortButton>
              </TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">
                <SortButton field="relationshipStatus">Status</SortButton>
              </TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider hidden xl:table-cell">Key Titles</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell">
                <SortButton field="lastActivityDate">Last Activity</SortButton>
              </TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider hidden 2xl:table-cell w-[200px]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => {
              const keyTitles = (() => { try { return JSON.parse(contact.keyTitles); } catch { return []; } })();
              const priorityColor = PRIORITY_COLORS[contact.priority] || PRIORITY_COLORS[3];
              const relColor = RELATIONSHIP_COLORS[contact.relationshipStatus] || RELATIONSHIP_COLORS.cold;
              const regionColor = REGION_COLORS[contact.region] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

              return (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectContact(contact)}
                  data-testid={`contact-row-${contact.id}`}
                >
                  <TableCell className="font-medium text-sm py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="truncate max-w-[160px]">{contact.company}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <SegmentBadge segment={contact.segment} />
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${regionColor}`}>
                      {contact.region}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${priorityColor.bg} ${priorityColor.text}`}>
                      {contact.priority}
                    </span>
                  </TableCell>
                  <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={contact.pipelineStage}
                      onValueChange={(v) => onStageChange(contact.id, v)}
                    >
                      <SelectTrigger
                        className="h-7 text-[11px] w-[110px] border-dashed"
                        data-testid={`stage-select-${contact.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{STAGE_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${relColor.bg} ${relColor.text}`}>
                      {contact.relationshipStatus}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 hidden xl:table-cell">
                    <div className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                      {keyTitles.slice(0, 2).join(", ")}
                      {keyTitles.length > 2 && <span className="text-muted-foreground/60"> +{keyTitles.length - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <span className="text-[11px] text-muted-foreground">
                      {contact.lastActivityDate
                        ? new Date(contact.lastActivityDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "No activity"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 hidden 2xl:table-cell">
                    <p className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                      {contact.notes || "—"}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })}
            {contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                  No contacts match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Contact Detail Sheet
function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
  onAddActivity,
}: {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddActivity: () => void;
}) {
  const { toast } = useToast();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/contacts", contact?.id, "activities"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/contacts/${contact!.id}/activities`);
      return res.json();
    },
    enabled: !!contact,
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      await apiRequest("PATCH", `/api/contacts/${contact!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact updated" });
    },
  });

  if (!contact) return null;

  const keyTitles = (() => { try { return JSON.parse(contact.keyTitles); } catch { return []; } })();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="contact-detail-sheet">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-base font-display font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {contact.company}
            </SheetTitle>
          </SheetHeader>

          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <SegmentBadge segment={contact.segment} />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${REGION_COLORS[contact.region] || ""}`}>
                {contact.region}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${PRIORITY_COLORS[contact.priority]?.bg} ${PRIORITY_COLORS[contact.priority]?.text}`}>
                Priority {contact.priority}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">HQ</p>
                  <p className="text-xs font-medium">{contact.hqLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Size</p>
                  <p className="text-xs font-medium">{contact.companySize}</p>
                </div>
              </div>
              {contact.annualRdSpend && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">R&D Spend</p>
                    <p className="text-xs font-medium">{contact.annualRdSpend}</p>
                  </div>
                </div>
              )}
              {contact.activeTrials && (
                <div className="flex items-start gap-2">
                  <FlaskConical className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Trials</p>
                    <p className="text-xs font-medium">{contact.activeTrials}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Connection</p>
                  <p className="text-xs font-medium">{contact.existingConnection ? "Existing" : "None"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Decision-maker titles */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Target Decision-Makers</h4>
              <div className="flex flex-wrap gap-1.5">
                {keyTitles.map((t: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-muted rounded-md text-[11px] font-medium">{t}</span>
                ))}
              </div>
            </div>

            <Separator />

            {/* Pipeline & Status (editable) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pipeline Stage</Label>
                <Select
                  value={contact.pipelineStage}
                  onValueChange={(v) => updateContactMutation.mutate({ pipelineStage: v })}
                >
                  <SelectTrigger className="h-8 mt-1 text-xs" data-testid="detail-stage-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{STAGE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Relationship</Label>
                <Select
                  value={contact.relationshipStatus}
                  onValueChange={(v) => updateContactMutation.mutate({ relationshipStatus: v })}
                >
                  <SelectTrigger className="h-8 mt-1 text-xs" data-testid="detail-relationship-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm" className="text-xs">Warm</SelectItem>
                    <SelectItem value="known" className="text-xs">Known</SelectItem>
                    <SelectItem value="cold" className="text-xs">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Notes (editable) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Notes</h4>
                {!editingNotes ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => { setNotesValue(contact.notes); setEditingNotes(true); }}
                    data-testid="button-edit-notes"
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setEditingNotes(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        updateContactMutation.mutate({ notes: notesValue });
                        setEditingNotes(false);
                      }}
                      data-testid="button-save-notes"
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
              {editingNotes ? (
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  className="text-xs min-h-[80px]"
                  data-testid="textarea-notes"
                />
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">{contact.notes || "No notes yet."}</p>
              )}
            </div>

            <Separator />

            {/* Activity Log */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Activity Log</h4>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-[11px] gap-1"
                  onClick={onAddActivity}
                  data-testid="button-add-activity"
                >
                  <Plus className="h-3 w-3" />
                  Add Activity
                </Button>
              </div>

              {activitiesLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-md" />)}
                </div>
              ) : activitiesData && activitiesData.length > 0 ? (
                <div className="space-y-2">
                  {activitiesData.map((a) => {
                    const Icon = ACTIVITY_ICONS[a.activityType] || StickyNote;
                    return (
                      <div key={a.id} className="flex gap-3 p-2.5 rounded-md bg-muted/40 border border-border/50" data-testid={`activity-${a.id}`}>
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-semibold text-primary">{a.activityType}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5">{a.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">by {a.createdBy}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No activities yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Add your first interaction to start tracking</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Add Activity Dialog — rendered at page level to avoid z-index issues with Sheet
function AddActivityDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [newActivityType, setNewActivityType] = useState("note");
  const [newActivityDesc, setNewActivityDesc] = useState("");

  const addActivityMutation = useMutation({
    mutationFn: async (data: { activityType: string; description: string; date: string; createdBy: string }) => {
      const res = await apiRequest("POST", `/api/contacts/${contact!.id}/activities`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contact?.id, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      onOpenChange(false);
      setNewActivityDesc("");
      setNewActivityType("note");
      toast({ title: "Activity added" });
    },
  });

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="add-activity-dialog">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Log Activity — {contact.company}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={newActivityType} onValueChange={setNewActivityType}>
              <SelectTrigger className="mt-1 h-8 text-xs" data-testid="select-activity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email" className="text-xs">Email</SelectItem>
                <SelectItem value="call" className="text-xs">Call</SelectItem>
                <SelectItem value="meeting" className="text-xs">Meeting</SelectItem>
                <SelectItem value="linkedin" className="text-xs">LinkedIn</SelectItem>
                <SelectItem value="note" className="text-xs">Note</SelectItem>
                <SelectItem value="event" className="text-xs">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              className="mt-1 text-xs min-h-[60px]"
              placeholder="What happened?"
              value={newActivityDesc}
              onChange={(e) => setNewActivityDesc(e.target.value)}
              data-testid="textarea-activity-desc"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs"
            disabled={!newActivityDesc.trim() || addActivityMutation.isPending}
            onClick={() => {
              addActivityMutation.mutate({
                activityType: newActivityType,
                description: newActivityDesc.trim(),
                date: new Date().toISOString(),
                createdBy: "Sarah Chen",
              });
            }}
            data-testid="button-submit-activity"
          >
            {addActivityMutation.isPending ? "Saving..." : "Log Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// MAIN PAGE COMPONENT
export default function Contacts() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);

  const { data: apiContacts, isLoading: apiLoading, isError } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    retry: 1,
    retryDelay: 500,
  });

  // Fallback to embedded seed data when API is unavailable (static deployment)
  const contacts: Contact[] | undefined = (apiContacts && apiContacts.length > 0)
    ? apiContacts
    : isError || (!apiLoading && (!apiContacts || apiContacts.length === 0))
      ? SEED_CONTACTS.map((c, i) => ({ ...c, id: i + 1 } as Contact))
      : undefined;
  const isLoading = apiLoading && !isError;

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: number; stage: string }) => {
      await apiRequest("PATCH", `/api/contacts/${id}`, { pipelineStage: stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  // Compute pipeline stats
  const stats = useMemo(() => {
    if (!contacts) return { total: 0, warm: 0, p1: 0, byStage: {} as Record<string, number>, bySegment: {} as Record<string, number> };
    const byStage: Record<string, number> = {};
    const bySegment: Record<string, number> = {};
    let warm = 0;
    let p1 = 0;
    contacts.forEach((c) => {
      byStage[c.pipelineStage] = (byStage[c.pipelineStage] || 0) + 1;
      bySegment[c.segment] = (bySegment[c.segment] || 0) + 1;
      if (c.relationshipStatus === "warm") warm++;
      if (c.priority === 1) p1++;
    });
    return { total: contacts.length, warm, p1, byStage, bySegment };
  }, [contacts]);

  // Build segment breakdown string
  const segmentBreakdown = useMemo(() => {
    const parts = Object.entries(stats.bySegment)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([seg, count]) => `${count} ${seg.split(" ")[0]}`);
    return parts.join(", ");
  }, [stats.bySegment]);

  // Pipeline stage visual
  const stageBreakdown = useMemo(() => {
    return PIPELINE_STAGES.map((s) => ({
      stage: s,
      label: STAGE_LABELS[s],
      count: stats.byStage[s] || 0,
    }));
  }, [stats.byStage]);

  // Filter & sort contacts
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    let result = [...contacts];

    // Tab-based stage filtering
    if (activeTab !== "all") {
      result = result.filter((c) => c.pipelineStage === activeTab);
    }

    // Filters
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.company.toLowerCase().includes(q));
    }
    if (segmentFilter !== "all") {
      result = result.filter((c) => c.segment === segmentFilter);
    }
    if (regionFilter !== "all") {
      result = result.filter((c) => c.region === regionFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((c) => c.priority === parseInt(priorityFilter));
    }
    if (stageFilter !== "all") {
      result = result.filter((c) => c.pipelineStage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (sortField === "lastActivityDate") {
        aVal = aVal || "";
        bVal = bVal || "";
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [contacts, activeTab, search, segmentFilter, regionFilter, priorityFilter, stageFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setSheetOpen(true);
  };

  const handleStageChange = (id: number, stage: string) => {
    updateStageMutation.mutate({ id, stage });
  };

  const clearFilters = () => {
    setSearch("");
    setSegmentFilter("all");
    setRegionFilter("all");
    setPriorityFilter("all");
    setStageFilter("all");
  };

  const hasFilters = search || segmentFilter !== "all" || regionFilter !== "all" || priorityFilter !== "all" || stageFilter !== "all";

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-5 max-w-[1600px]">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-10 w-full" />
        <ContactsTableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px]" data-testid="page-contacts">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight" data-testid="text-page-title">
            CRM Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.total} contacts across {Object.keys(stats.bySegment).length} segments
          </p>
        </div>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PipelineCard
          label="Total Contacts"
          value={stats.total}
          subtitle={segmentBreakdown}
          icon={Users}
          color="bg-[#01696F]"
          testId="kpi-total-contacts"
        />
        <PipelineCard
          label="Warm Leads"
          value={stats.warm}
          subtitle={`${stats.total > 0 ? Math.round((stats.warm / stats.total) * 100) : 0}% of pipeline`}
          icon={Flame}
          color="bg-green-600"
          testId="kpi-warm-leads"
        />
        <PipelineCard
          label="Priority 1 Targets"
          value={stats.p1}
          subtitle="Highest-value accounts"
          icon={Star}
          color="bg-[#6A3FB5]"
          testId="kpi-priority1"
        />
        <Card className="hover-elevate" data-testid="kpi-pipeline-stages">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Pipeline by Stage</p>
              </div>
              <div className="h-8 w-8 rounded-md bg-[#2563EB] flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-muted">
              {stageBreakdown.filter(s => s.count > 0).map((s) => {
                const colors: Record<string, string> = {
                  prospect: "bg-gray-400 dark:bg-gray-500",
                  outreach: "bg-blue-500",
                  engaged: "bg-teal-500",
                  opportunity: "bg-purple-500",
                  customer: "bg-green-500",
                  monitor: "bg-amber-500",
                };
                return (
                  <div
                    key={s.stage}
                    className={`${colors[s.stage] || "bg-gray-400"} transition-all`}
                    style={{ width: `${(s.count / stats.total) * 100}%` }}
                    title={`${s.label}: ${s.count}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
              {stageBreakdown.filter(s => s.count > 0).map((s) => (
                <span key={s.stage} className="text-[10px] text-muted-foreground">
                  {s.label} <span className="font-semibold text-foreground">{s.count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-pipeline">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-xs px-3 h-7" data-testid="tab-all">
            All <span className="ml-1 text-muted-foreground">{stats.total}</span>
          </TabsTrigger>
          {PIPELINE_STAGES.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs px-3 h-7" data-testid={`tab-${s}`}>
              {STAGE_LABELS[s]}
              {(stats.byStage[s] || 0) > 0 && (
                <span className="ml-1 text-muted-foreground">{stats.byStage[s]}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-4" data-testid="filter-bar">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs pl-8"
              data-testid="input-search"
            />
          </div>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs" data-testid="filter-segment">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Segments</SelectItem>
              {ALL_SEGMENTS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="h-8 w-[110px] text-xs" data-testid="filter-region">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Regions</SelectItem>
              {ALL_REGIONS.map((r) => (
                <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-[110px] text-xs" data-testid="filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              <SelectItem value="1" className="text-xs">Priority 1</SelectItem>
              <SelectItem value="2" className="text-xs">Priority 2</SelectItem>
              <SelectItem value="3" className="text-xs">Priority 3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs" data-testid="filter-stage">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Stages</SelectItem>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground"
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto">
            {filteredContacts.length} result{filteredContacts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table renders the same for all tabs since filtering is handled above */}
        <div className="mt-3">
          <ContactsTable
            contacts={filteredContacts}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            onSelectContact={handleSelectContact}
            onStageChange={handleStageChange}
          />
        </div>
      </Tabs>

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            if (selectedContact) {
              const updated = contacts?.find(c => c.id === selectedContact.id);
              if (updated) setSelectedContact(updated);
            }
          }
        }}
        onAddActivity={() => setActivityDialogOpen(true)}
      />

      {/* Add Activity Dialog -- rendered at page level to avoid z-index clash with Sheet */}
      <AddActivityDialog
        contact={selectedContact}
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
      />
    </div>
  );
}
