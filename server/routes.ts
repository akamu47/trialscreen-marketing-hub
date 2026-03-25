import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertContentItemSchema, insertCampaignSchema, insertAuditLogSchema, insertContactSchema, insertActivitySchema } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

export async function registerRoutes(server: Server, app: Express) {
  // Content Items
  app.get("/api/content", (_req, res) => {
    const items = storage.getContentItems();
    res.json(items);
  });

  app.get("/api/content/:id", (req, res) => {
    const item = storage.getContentItem(parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  app.post("/api/content", (req, res) => {
    const parsed = insertContentItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const item = storage.createContentItem(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/content/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const existing = storage.getContentItem(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = storage.updateContentItem(id, req.body);
    res.json(updated);
  });

  app.delete("/api/content/:id", (req, res) => {
    storage.deleteContentItem(parseInt(req.params.id));
    res.status(204).send();
  });

  // Campaigns
  app.get("/api/campaigns", (_req, res) => {
    const items = storage.getCampaigns();
    res.json(items);
  });

  app.get("/api/campaigns/:id", (req, res) => {
    const item = storage.getCampaign(parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  app.post("/api/campaigns", (req, res) => {
    const parsed = insertCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const item = storage.createCampaign(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/campaigns/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const existing = storage.getCampaign(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = storage.updateCampaign(id, req.body);
    res.json(updated);
  });

  // Audit Log
  app.get("/api/audit-log", (_req, res) => {
    const logs = storage.getAuditLogs();
    res.json(logs);
  });

  app.post("/api/audit-log", (req, res) => {
    const parsed = insertAuditLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const log = storage.createAuditLog(parsed.data);
    res.status(201).json(log);
  });

  // Analytics
  app.get("/api/analytics", (_req, res) => {
    const data = storage.getAnalyticsData();
    res.json(data);
  });

  // Contacts CRUD
  app.get("/api/contacts", (_req, res) => {
    const items = storage.getContacts();
    res.json(items);
  });

  app.get("/api/contacts/:id", (req, res) => {
    const item = storage.getContact(parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  app.post("/api/contacts", (req, res) => {
    const parsed = insertContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const item = storage.createContact(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/contacts/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const existing = storage.getContact(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = storage.updateContact(id, req.body);
    res.json(updated);
  });

  app.delete("/api/contacts/:id", (req, res) => {
    storage.deleteContact(parseInt(req.params.id));
    res.status(204).send();
  });

  // Activities
  app.get("/api/contacts/:id/activities", (req, res) => {
    const contactId = parseInt(req.params.id);
    const items = storage.getActivitiesByContact(contactId);
    res.json(items);
  });

  app.post("/api/contacts/:id/activities", (req, res) => {
    const contactId = parseInt(req.params.id);
    const body = { ...req.body, contactId };
    const parsed = insertActivitySchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const item = storage.createActivity(parsed.data);
    // Update last activity date on the contact
    storage.updateContact(contactId, { lastActivityDate: body.date });
    res.status(201).json(item);
  });

  // Seed contacts from JSON
  app.post("/api/contacts/seed", (_req, res) => {
    seedContacts();
    res.json({ message: "Contacts seeded" });
  });

  // Seed endpoint
  app.post("/api/seed", (_req, res) => {
    seedDatabase();
    res.json({ message: "Database seeded" });
  });
}

function seedDatabase() {
  // Check if already seeded
  const existing = storage.getContentItems();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const authors = ["Sarah Chen", "Marcus Johnson", "Emily Rivera", "David Park", "Lisa Thompson"];

  // Seed content items
  const contentData = [
    { title: "Clinical Trial Awareness Campaign - Q1 Blog Series", contentType: "blog", track: "Patient", platform: "Blog", author: authors[0], status: "published", complianceStatus: "approved" },
    { title: "Top 5 Benefits of Clinical Trial Participation", contentType: "blog", track: "Patient", platform: "Blog", author: authors[2], status: "published", complianceStatus: "approved" },
    { title: "Site Investigator Recruitment LinkedIn Post", contentType: "social", track: "B2B", platform: "LinkedIn", author: authors[1], status: "approved", complianceStatus: "approved" },
    { title: "Patient Pre-screening Process Explained", contentType: "email", track: "Patient", platform: "Email", author: authors[0], status: "compliance_check", complianceStatus: "pending" },
    { title: "ResearchFriends Community Newsletter - March", contentType: "email", track: "Patient", platform: "Email", author: authors[3], status: "in_review", complianceStatus: "pending" },
    { title: "Pharma Partner Case Study: Oncology Trial", contentType: "blog", track: "B2B", platform: "Blog", author: authors[4], status: "draft", complianceStatus: "pending" },
    { title: "Facebook Ad - Diabetes Study Recruitment", contentType: "ad", track: "Patient", platform: "Facebook", author: authors[2], status: "compliance_check", complianceStatus: "flagged", complianceNotes: "Need to remove efficacy claim in line 3. FDA 21 CFR 312.7 violation." },
    { title: "LinkedIn Sponsored - CRO Partnership Value Prop", contentType: "ad", track: "B2B", platform: "LinkedIn", author: authors[1], status: "approved", complianceStatus: "approved" },
    { title: "Instagram Story - Trial Participant Testimonial", contentType: "social", track: "Patient", platform: "Instagram", author: authors[3], status: "compliance_check", complianceStatus: "pending", complianceNotes: "Verifying HIPAA authorization for patient story." },
    { title: "CRO Decision-Maker Email Sequence", contentType: "email", track: "B2B", platform: "Email", author: authors[4], status: "draft", complianceStatus: "pending" },
    { title: "Google Ads - Find Clinical Trials Near You", contentType: "ad", track: "Patient", platform: "Google", author: authors[0], status: "published", complianceStatus: "approved" },
    { title: "Reddit AMA - Understanding Clinical Trials", contentType: "social", track: "Patient", platform: "Reddit", author: authors[2], status: "in_review", complianceStatus: "pending" },
    { title: "X Thread - Site Enrollment Best Practices", contentType: "social", track: "B2B", platform: "X", author: authors[1], status: "draft", complianceStatus: "pending" },
    { title: "Meta Ad - Heart Health Study Awareness", contentType: "ad", track: "Patient", platform: "Facebook", author: authors[3], status: "approved", complianceStatus: "approved" },
  ];

  contentData.forEach((c, i) => {
    const daysAgo = Math.floor(Math.random() * 30);
    const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
    storage.createContentItem({
      ...c,
      body: `Content body for: ${c.title}`,
      createdAt: created,
      updatedAt: created,
      complianceNotes: c.complianceNotes || null,
      complianceReviewer: c.complianceStatus === "approved" ? "Dr. Karen Walsh" : null,
      complianceDate: c.complianceStatus === "approved" ? created : null,
    });
  });

  // Seed campaigns
  const campaignData = [
    { name: "LinkedIn B2B Awareness - Q1", track: "B2B", platform: "LinkedIn", status: "active", budget: 25000, spend: 18420, leads: 342, impressions: 892000, clicks: 12450, conversions: 342, ctr: 1.4, cpc: 1.48, cpl: 53.86, performance: "on-track", startDate: "2025-01-15" },
    { name: "Meta Patient Recruitment - Oncology", track: "Patient", platform: "Meta", status: "active", budget: 40000, spend: 31200, leads: 1280, impressions: 2450000, clicks: 48200, conversions: 1280, ctr: 1.97, cpc: 0.65, cpl: 24.38, performance: "on-track", startDate: "2025-01-10" },
    { name: "Google Ads - Trial Finder", track: "Patient", platform: "Google", status: "active", budget: 30000, spend: 22100, leads: 890, impressions: 1680000, clicks: 34200, conversions: 890, ctr: 2.04, cpc: 0.65, cpl: 24.83, performance: "on-track", startDate: "2025-02-01" },
    { name: "Reddit Community Engagement", track: "Patient", platform: "Reddit", status: "active", budget: 8000, spend: 4200, leads: 156, impressions: 320000, clicks: 8900, conversions: 156, ctr: 2.78, cpc: 0.47, cpl: 26.92, performance: "needs-attention", startDate: "2025-02-15" },
    { name: "LinkedIn CRO Targeting", track: "B2B", platform: "LinkedIn", status: "active", budget: 35000, spend: 28900, leads: 189, impressions: 560000, clicks: 7820, conversions: 189, ctr: 1.4, cpc: 3.7, cpl: 152.91, performance: "needs-attention", startDate: "2025-01-20" },
    { name: "Meta - Diabetes Study Recruitment", track: "Patient", platform: "Meta", status: "paused", budget: 20000, spend: 15400, leads: 620, impressions: 1200000, clicks: 22800, conversions: 620, ctr: 1.9, cpc: 0.68, cpl: 24.84, performance: "off-track", startDate: "2024-12-01", endDate: "2025-02-28" },
    { name: "Google Ads - B2B Site Solutions", track: "B2B", platform: "Google", status: "active", budget: 18000, spend: 12300, leads: 98, impressions: 420000, clicks: 5600, conversions: 98, ctr: 1.33, cpc: 2.2, cpl: 125.51, performance: "on-track", startDate: "2025-03-01" },
    { name: "Email Nurture - Patient Re-engagement", track: "Patient", platform: "Email", status: "completed", budget: 5000, spend: 4800, leads: 340, impressions: 48000, clicks: 9600, conversions: 340, ctr: 20.0, cpc: 0.5, cpl: 14.12, performance: "on-track", startDate: "2025-01-01", endDate: "2025-03-15" },
  ];

  campaignData.forEach((c) => {
    const dailyPoints = [];
    for (let d = 0; d < 30; d++) {
      dailyPoints.push({
        date: new Date(Date.now() - (29 - d) * 86400000).toISOString().split("T")[0],
        impressions: Math.floor(c.impressions / 30 * (0.7 + Math.random() * 0.6)),
        clicks: Math.floor(c.clicks / 30 * (0.7 + Math.random() * 0.6)),
        leads: Math.floor(c.leads / 30 * (0.5 + Math.random())),
        spend: Math.round(c.spend / 30 * (0.8 + Math.random() * 0.4) * 100) / 100,
      });
    }
    storage.createCampaign({
      ...c,
      endDate: c.endDate || null,
      dailyData: JSON.stringify(dailyPoints),
    });
  });

  // Seed audit log
  const auditData = [
    { contentTitle: "Clinical Trial Awareness Campaign - Q1 Blog Series", action: "approved", reviewer: "Dr. Karen Walsh", notes: "All claims substantiated. IRB approval attached.", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { contentTitle: "Site Investigator Recruitment LinkedIn Post", action: "approved", reviewer: "Dr. Karen Walsh", notes: "No regulatory issues.", timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
    { contentTitle: "Facebook Ad - Diabetes Study Recruitment", action: "flagged", reviewer: "Dr. Karen Walsh", notes: "Efficacy claim in line 3 violates FDA 21 CFR 312.7. Remove before resubmitting.", timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
    { contentTitle: "Google Ads - Find Clinical Trials Near You", action: "approved", reviewer: "James Morton", notes: "IRB approval verified. Copy compliant.", timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
    { contentTitle: "LinkedIn Sponsored - CRO Partnership Value Prop", action: "approved", reviewer: "James Morton", notes: "B2B content, no patient-facing claims.", timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
    { contentTitle: "Meta Ad - Heart Health Study Awareness", action: "approved", reviewer: "Dr. Karen Walsh", notes: "Educational content approved. No treatment claims.", timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
    { contentTitle: "Top 5 Benefits of Clinical Trial Participation", action: "approved", reviewer: "James Morton", notes: "Reviewed per IRB protocol. Approved.", timestamp: new Date(Date.now() - 7 * 86400000).toISOString() },
    { contentTitle: "Patient Recruitment Video - Phase II Trial", action: "rejected", reviewer: "Dr. Karen Walsh", notes: "Contains identifiable patient information without proper HIPAA authorization. Must obtain signed consent.", timestamp: new Date(Date.now() - 8 * 86400000).toISOString() },
  ];

  auditData.forEach((a) => {
    storage.createAuditLog({ ...a, contentId: null });
  });

  // Seed analytics data - 6 months of channel data
  const channels = ["LinkedIn", "Meta", "Google", "Reddit", "Organic", "Email"];
  const tracks = ["B2B", "Patient"];

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);
    const dateStr = date.toISOString().split("T")[0];

    channels.forEach((channel) => {
      tracks.forEach((track) => {
        const multiplier = 1 + (5 - monthOffset) * 0.15; // Growth over time
        const isB2B = track === "B2B";
        const baseImpressions = isB2B ? (channel === "LinkedIn" ? 180000 : 40000) : (channel === "Meta" ? 400000 : channel === "Google" ? 280000 : 80000);
        const baseCTR = channel === "Email" ? 0.18 : channel === "Reddit" ? 0.028 : channel === "Google" ? 0.02 : 0.015;

        const impressions = Math.floor(baseImpressions * multiplier * (0.85 + Math.random() * 0.3));
        const clicks = Math.floor(impressions * baseCTR * (0.9 + Math.random() * 0.2));
        const landingPageViews = Math.floor(clicks * 0.82);
        const preScreenerStarts = isB2B ? 0 : Math.floor(landingPageViews * 0.35);
        const preScreenerCompletes = isB2B ? 0 : Math.floor(preScreenerStarts * 0.62);
        const qualifiedLeads = isB2B ? Math.floor(clicks * 0.028) : Math.floor(preScreenerCompletes * 0.48);
        const siteReferrals = isB2B ? 0 : Math.floor(qualifiedLeads * 0.7);
        const baseSpend = isB2B ? (channel === "LinkedIn" ? 4200 : 1500) : (channel === "Meta" ? 6500 : channel === "Google" ? 5000 : 1200);
        const spend = Math.round(baseSpend * multiplier * (0.9 + Math.random() * 0.2) * 100) / 100;

        storage.createAnalyticsData({
          date: dateStr,
          channel,
          impressions,
          clicks,
          landingPageViews,
          preScreenerStarts,
          preScreenerCompletes,
          qualifiedLeads,
          siteReferrals,
          spend,
          track,
        });
      });
    });
  }
}

function seedContacts() {
  const count = storage.getContactsCount();
  if (count > 0) return;

  // Try multiple possible paths for the contacts JSON
  const possiblePaths = [
    path.resolve(process.cwd(), "../trialscreen-contacts.json"),
    path.resolve(process.cwd(), "trialscreen-contacts.json"),
    path.resolve("/home/user/workspace/trialscreen-contacts.json"),
  ];

  let rawData: string | null = null;
  for (const p of possiblePaths) {
    try {
      rawData = fs.readFileSync(p, "utf-8");
      break;
    } catch {}
  }

  if (!rawData) {
    console.error("Could not find trialscreen-contacts.json");
    return;
  }

  const data = JSON.parse(rawData);
  const contactsList = data.contacts || [];
  const now = new Date().toISOString();

  contactsList.forEach((c: any) => {
    // Determine pipeline stage based on rules
    let pipelineStage = "prospect";
    if (c.segment === "Competitor") {
      pipelineStage = "monitor";
    } else if (c.relationship_status === "warm") {
      pipelineStage = "engaged";
    }
    // cold + any priority and known contacts = prospect (default)

    storage.createContact({
      company: c.company,
      segment: c.segment,
      hqLocation: c.hq_location,
      region: c.region,
      keyTitles: JSON.stringify(c.key_titles),
      companySize: c.company_size,
      annualRdSpend: c.annual_rd_spend || null,
      activeTrials: c.active_trials || null,
      relationshipStatus: c.relationship_status,
      priority: c.priority,
      notes: c.notes || "",
      pipelineStage,
      existingConnection: c.existing_connection || false,
      lastActivityDate: null,
      createdAt: now,
    });
  });

  console.log(`Seeded ${contactsList.length} contacts`);
}

// Auto-seed on import
seedDatabase();
seedContacts();
