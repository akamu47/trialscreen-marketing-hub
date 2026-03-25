import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Content items for the content hub / workflow
export const contentItems = sqliteTable("content_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body"),
  contentType: text("content_type").notNull(), // blog, social, email, ad
  track: text("track").notNull(), // B2B, Patient
  platform: text("platform").notNull(), // LinkedIn, Facebook, Instagram, X, Blog, Email
  author: text("author").notNull(),
  status: text("status").notNull().default("draft"), // draft, in_review, compliance_check, approved, published
  complianceStatus: text("compliance_status").default("pending"), // pending, approved, flagged
  complianceNotes: text("compliance_notes"),
  complianceReviewer: text("compliance_reviewer"),
  complianceDate: text("compliance_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({ id: true });
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;

// Campaigns
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  track: text("track").notNull(), // B2B, Patient
  platform: text("platform").notNull(),
  status: text("status").notNull().default("active"), // active, paused, completed
  budget: real("budget").notNull(),
  spend: real("spend").notNull().default(0),
  leads: integer("leads").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  ctr: real("ctr").notNull().default(0),
  cpc: real("cpc").notNull().default(0),
  cpl: real("cpl").notNull().default(0),
  performance: text("performance").notNull().default("on-track"), // on-track, needs-attention, off-track
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  dailyData: text("daily_data"), // JSON string of daily performance
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Audit log for compliance
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id"),
  contentTitle: text("content_title").notNull(),
  action: text("action").notNull(), // approved, rejected, flagged
  reviewer: text("reviewer").notNull(),
  notes: text("notes"),
  timestamp: text("timestamp").notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({ id: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

// Analytics data points
export const analyticsData = sqliteTable("analytics_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  channel: text("channel").notNull(),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  landingPageViews: integer("landing_page_views").notNull().default(0),
  preScreenerStarts: integer("pre_screener_starts").notNull().default(0),
  preScreenerCompletes: integer("pre_screener_completes").notNull().default(0),
  qualifiedLeads: integer("qualified_leads").notNull().default(0),
  siteReferrals: integer("site_referrals").notNull().default(0),
  spend: real("spend").notNull().default(0),
  track: text("track").notNull(), // B2B, Patient
});

export const insertAnalyticsDataSchema = createInsertSchema(analyticsData).omit({ id: true });
export type InsertAnalyticsData = z.infer<typeof insertAnalyticsDataSchema>;
export type AnalyticsData = typeof analyticsData.$inferSelect;

// CRM Contacts
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  segment: text("segment").notNull(),
  hqLocation: text("hq_location").notNull(),
  region: text("region").notNull(),
  keyTitles: text("key_titles").notNull(), // JSON array
  companySize: text("company_size").notNull(),
  annualRdSpend: text("annual_rd_spend"),
  activeTrials: text("active_trials"),
  relationshipStatus: text("relationship_status").notNull(), // warm, known, cold
  priority: integer("priority").notNull(),
  notes: text("notes").notNull().default(""),
  pipelineStage: text("pipeline_stage").notNull().default("prospect"), // prospect, outreach, engaged, opportunity, customer, monitor
  existingConnection: integer("existing_connection", { mode: "boolean" }).notNull().default(false),
  lastActivityDate: text("last_activity_date"),
  createdAt: text("created_at").notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({ id: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// CRM Activities
export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contact_id").notNull(),
  activityType: text("activity_type").notNull(), // email, call, meeting, linkedin, note, event
  description: text("description").notNull(),
  date: text("date").notNull(),
  createdBy: text("created_by").notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
