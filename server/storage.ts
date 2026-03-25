import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";
import {
  contentItems,
  campaigns,
  auditLog,
  analyticsData,
  type InsertContentItem,
  type ContentItem,
  type InsertCampaign,
  type Campaign,
  type InsertAuditLog,
  type AuditLog,
  type InsertAnalyticsData,
  type AnalyticsData,
} from "@shared/schema";

const sqlite = new Database("data.db");
const db = drizzle(sqlite);

export interface IStorage {
  // Content Items
  getContentItems(): ContentItem[];
  getContentItem(id: number): ContentItem | undefined;
  createContentItem(item: InsertContentItem): ContentItem;
  updateContentItem(id: number, item: Partial<InsertContentItem>): ContentItem | undefined;
  deleteContentItem(id: number): void;

  // Campaigns
  getCampaigns(): Campaign[];
  getCampaign(id: number): Campaign | undefined;
  createCampaign(campaign: InsertCampaign): Campaign;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Campaign | undefined;

  // Audit Log
  getAuditLogs(): AuditLog[];
  createAuditLog(log: InsertAuditLog): AuditLog;

  // Analytics
  getAnalyticsData(): AnalyticsData[];
  createAnalyticsData(data: InsertAnalyticsData): AnalyticsData;
}

export class DatabaseStorage implements IStorage {
  getContentItems(): ContentItem[] {
    return db.select().from(contentItems).orderBy(desc(contentItems.updatedAt)).all();
  }

  getContentItem(id: number): ContentItem | undefined {
    return db.select().from(contentItems).where(eq(contentItems.id, id)).get();
  }

  createContentItem(item: InsertContentItem): ContentItem {
    return db.insert(contentItems).values(item).returning().get();
  }

  updateContentItem(id: number, item: Partial<InsertContentItem>): ContentItem | undefined {
    return db
      .update(contentItems)
      .set({ ...item, updatedAt: new Date().toISOString() })
      .where(eq(contentItems.id, id))
      .returning()
      .get();
  }

  deleteContentItem(id: number): void {
    db.delete(contentItems).where(eq(contentItems.id, id)).run();
  }

  getCampaigns(): Campaign[] {
    return db.select().from(campaigns).all();
  }

  getCampaign(id: number): Campaign | undefined {
    return db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  }

  createCampaign(campaign: InsertCampaign): Campaign {
    return db.insert(campaigns).values(campaign).returning().get();
  }

  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Campaign | undefined {
    return db.update(campaigns).set(campaign).where(eq(campaigns.id, id)).returning().get();
  }

  getAuditLogs(): AuditLog[] {
    return db.select().from(auditLog).orderBy(desc(auditLog.timestamp)).all();
  }

  createAuditLog(log: InsertAuditLog): AuditLog {
    return db.insert(auditLog).values(log).returning().get();
  }

  getAnalyticsData(): AnalyticsData[] {
    return db.select().from(analyticsData).all();
  }

  createAnalyticsData(data: InsertAnalyticsData): AnalyticsData {
    return db.insert(analyticsData).values(data).returning().get();
  }
}

export const storage = new DatabaseStorage();
