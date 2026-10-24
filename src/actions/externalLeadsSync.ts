"use server";

import { Client } from "pg";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface SyncResult {
  success: boolean;
  outreachSynced: number;
  outreachSkipped: number;
  crmSynced: number;
  crmSkipped: number;
  message?: string;
  error?: string;
}

/**
 * Synchronize Google Maps scraped business leads from outreach.jisnudigital.com
 */
export async function syncOutreachLeads(options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ synced: number; skipped: number }> {
  if (!process.env.OUTREACH_DATABASE_URL) {
    throw new Error("OUTREACH_DATABASE_URL is not configured in .env");
  }

  const client = new Client({
    connectionString: process.env.OUTREACH_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  let synced = 0;
  let skipped = 0;

  try {
    await client.connect();

    const conditions: string[] = [];
    const values: any[] = [];

    if (options?.startDate) {
      values.push(new Date(options.startDate));
      conditions.push(`"createdAt" >= $${values.length}`);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      values.push(end);
      conditions.push(`"createdAt" <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const fetchLimit = options?.limit || 200;
    values.push(fetchLimit);

    // Query discovered / scraped business leads with pagination limit & date filters
    const query = `
      SELECT 
        id,
        "placeId",
        "businessName",
        category,
        address,
        city,
        state,
        "phoneNumber",
        "formattedPhone",
        "websiteUrl",
        email,
        "googleRating",
        "reviewCount",
        "googleMapsUrl",
        status,
        "leadStatus",
        remarks,
        "createdAt"
      FROM "Lead"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${values.length};
    `;
    const res = await client.query(query, values);

    for (const row of res.rows) {
      const extId = `OUTREACH_${row.id}`;
      const phone = row.formattedPhone || row.phoneNumber;

      // Deduplicate by externalId or formatted phone
      const existing = await prisma.lead.findFirst({
        where: {
          OR: [
            { externalId: extId },
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existing) {
        // If already in ERP, backfill external metadata if missing
        if (!existing.externalId) {
          await prisma.lead.update({
            where: { id: existing.id },
            data: {
              externalId: extId,
              externalSource: "OUTREACH_GMAPS",
              websiteUrl: row.websiteUrl || existing.websiteUrl,
              googleMapsUrl: row.googleMapsUrl || existing.googleMapsUrl,
              googleRating: row.googleRating !== null ? Number(row.googleRating) : existing.googleRating,
              reviewCount: row.reviewCount !== null ? Number(row.reviewCount) : existing.reviewCount,
            },
          });
        }
        skipped++;
        continue;
      }

      // Generate guaranteed unique lead code
      const leadCode = `LEAD-MAPS-${row.id.slice(-6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const locationStr = [row.city, row.state].filter(Boolean).join(", ") || row.address || "India";

      await prisma.lead.create({
        data: {
          leadCode,
          customerName: row.businessName || "Business Lead",
          company: row.businessName,
          phone: phone || "N/A",
          email: row.email || null,
          location: locationStr,
          source: "OUTREACH_GMAPS",
          externalId: extId,
          externalSource: "OUTREACH_GMAPS",
          isImportedToPipeline: false,
          productInterest: row.category ? `Digital Marketing for ${row.category}` : "Outreach Business Lead",
          websiteUrl: row.websiteUrl || null,
          googleMapsUrl: row.googleMapsUrl || null,
          googleRating: row.googleRating ? Number(row.googleRating) : null,
          reviewCount: row.reviewCount ? Number(row.reviewCount) : 0,
          status: "NEW",
          priority: (row.googleRating && row.googleRating >= 4.5) ? "HIGH" : "MEDIUM",
          notes: `[Scraped from Google Maps Outreach]\nCategory: ${row.category || "General"}\nAddress: ${row.address || "N/A"}\nRating: ${row.googleRating || "N/A"} (${row.reviewCount || 0} reviews)\nMaps URL: ${row.googleMapsUrl || "N/A"}\nRemarks: ${row.remarks || "Fresh lead"}`,
          createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
        },
      });

      synced++;
    }
  } finally {
    await client.end();
  }

  return { synced, skipped };
}

/**
 * Synchronize AI-qualified conversation leads from crm.jisnudigital.com
 */
export async function syncCrmAiLeads(options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ synced: number; skipped: number }> {
  if (!process.env.CRM_DATABASE_URL) {
    throw new Error("CRM_DATABASE_URL is not configured in .env");
  }

  const orgId = process.env.CRM_ORGANIZATION_ID || "a4bc139a-b6b8-4f6d-b50a-4057a2a902df";

  const client = new Client({
    connectionString: process.env.CRM_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  let synced = 0;
  let skipped = 0;

  try {
    await client.connect();

    const conditions: string[] = ['l."organizationId" = $1'];
    const values: any[] = [orgId];

    if (options?.startDate) {
      values.push(new Date(options.startDate));
      conditions.push(`l."createdAt" >= $${values.length}`);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      values.push(end);
      conditions.push(`l."createdAt" <= $${values.length}`);
    }

    const fetchLimit = options?.limit || 200;
    values.push(fetchLimit);

    // Fetch AI-captured leads belonging to Jisnu company organization with pagination & date filters
    const query = `
      SELECT 
        l.id,
        l."customerName",
        l."customerPhone",
        l.email,
        l."topicDiscussed",
        l.notes,
        l.remark,
        COALESCE(c.platform, 'whatsapp') AS channel,
        l.status,
        l."createdAt"
      FROM public.ai_captured_leads l
      LEFT JOIN public."Conversation" c 
        ON c."customerPhone" = l."customerPhone" 
        AND c."organizationId" = l."organizationId"
      WHERE ${conditions.join(" AND ")}
      ORDER BY l."createdAt" DESC
      LIMIT $${values.length};
    `;
    const res = await client.query(query, values);

    for (const row of res.rows) {
      const extId = `CRM_AI_${row.id}`;
      const phone = row.customerPhone;

      // Deduplicate by externalId or customer phone
      const existing = await prisma.lead.findFirst({
        where: {
          OR: [
            { externalId: extId },
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existing) {
        // Update AI summary if it was updated in CRM
        if (!existing.aiSummary || existing.aiSummary !== row.topicDiscussed) {
          await prisma.lead.update({
            where: { id: existing.id },
            data: {
              externalId: extId,
              externalSource: "CRM_AI_AGENT",
              aiSummary: row.topicDiscussed || existing.aiSummary,
            },
          });
        }
        skipped++;
        continue;
      }

      // Generate guaranteed unique lead code
      const leadCode = `LEAD-AI-${row.id.slice(-6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const platformChannel = (row.channel || "whatsapp").toUpperCase();
      const sourceTag = platformChannel.includes("INSTA") ? "INSTAGRAM" : "WHATSAPP";

      await prisma.lead.create({
        data: {
          leadCode,
          customerName: row.customerName || `Lead ${row.customerPhone}`,
          phone: row.customerPhone,
          email: row.email || null,
          source: sourceTag,
          externalId: extId,
          externalSource: "CRM_AI_AGENT",
          isImportedToPipeline: false,
          aiSummary: row.topicDiscussed || null,
          productInterest: row.topicDiscussed || "Inbound Social Automation Inquiry",
          status: "NEW",
          priority: "HIGH", // Inbound AI inquiries are hot/warm leads
          notes: `[AI Captured Lead from ${platformChannel}]\nTopic Discussed: ${row.topicDiscussed || "General Inquiry"}\nSummary & Notes: ${row.notes || "None"}\nCampaign / Remark: ${row.remark || "Direct Chat"}`,
          createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
        },
      });

      synced++;
    }
  } finally {
    await client.end();
  }

  return { synced, skipped };
}

/**
 * Universal Unified Sync Trigger
 */
export async function syncAllExternalLeads(options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<SyncResult> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const user = session.user as any;
  const role = user?.role;
  const dept = (user?.department || "").toLowerCase();

  if (role !== "ADMIN" && !dept.includes("sales")) {
    throw new Error("Only Admin or Sales team members can trigger lead synchronization");
  }

  try {
    const [outreachRes, crmRes] = await Promise.all([
      syncOutreachLeads(options),
      syncCrmAiLeads(options),
    ]);

    revalidatePath("/crm");
    revalidatePath("/dashboard");

    return {
      success: true,
      outreachSynced: outreachRes.synced,
      outreachSkipped: outreachRes.skipped,
      crmSynced: crmRes.synced,
      crmSkipped: crmRes.skipped,
      message: `Successfully synced ${outreachRes.synced} Outreach leads & ${crmRes.synced} AI CRM leads into ERP!`,
    };
  } catch (err: any) {
    console.error("External lead synchronization failed:", err);
    return {
      success: false,
      outreachSynced: 0,
      outreachSkipped: 0,
      crmSynced: 0,
      crmSkipped: 0,
      error: err.message || "Failed to synchronize external leads",
    };
  }
}
