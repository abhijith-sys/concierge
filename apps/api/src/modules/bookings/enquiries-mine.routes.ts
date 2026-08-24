import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireAuth } from "../../shared/auth/index.js";
import { ApiError } from "../../shared/errors/index.js";
import { prisma } from "../../shared/db/prisma.js";
import { enquiriesMineService } from "./enquiries-mine.service.js";
import { mineEnquiriesQuerySchema } from "./enquiries-mine.schemas.js";
import { enquiriesGuestLookupService } from "./enquiries-guest-lookup.service.js";
import { guestEnquiryLookupSchema } from "./enquiries-guest-lookup.schemas.js";

export const enquiriesMineRouter = Router();

enquiriesMineRouter.get("/lookup", async (req, res) => {
  const query = guestEnquiryLookupSchema.parse(req.query);
  const result = await enquiriesGuestLookupService.lookup(query);
  res.json(result);
});

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csvRow(values: unknown[]) {
  return values.map(csvEscape).join(",");
}

async function assertBusinessOwner(businessId: string, userId: string, role: Role) {
  if (role === Role.admin) return;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });
  if (!business || business.ownerId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "You cannot export enquiries for this business");
  }
}

enquiriesMineRouter.get("/export", requireAuth, async (req, res) => {
  const query = z
    .object({
      businessId: z.string().uuid(),
      format: z.literal("csv"),
    })
    .parse(req.query);
  await assertBusinessOwner(query.businessId, req.user!.id, req.user!.role);

  const businessId = query.businessId;
  const rows: Array<Record<string, string>> = [];

  const pushRows = (
    vertical: string,
    enquiries: Array<{
      id: string;
      guestName: string;
      guestEmail: string;
      guestPhone?: string | null;
      status: string;
      createdAt: Date;
      notes?: string | null;
    }>,
  ) => {
    for (const row of enquiries) {
      rows.push({
        vertical,
        id: row.id,
        guestName: row.guestName,
        guestEmail: row.guestEmail,
        guestPhone: row.guestPhone ?? "",
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        notes: row.notes ?? "",
      });
    }
  };

  const [
    stays,
    rentals,
    travels,
    events,
    logistics,
    education,
    health,
    professional,
    homeTrade,
    automotive,
    electronics,
  ] = await Promise.all([
    prisma.stayEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.rentalEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.travelEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.eventEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.logisticsEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.educationEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.healthEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.professionalEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.homeTradeEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.automotiveEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.electronicsEnquiry.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  ]);

  pushRows("stay", stays);
  pushRows("rental", rentals);
  pushRows("travel", travels);
  pushRows("event", events);
  pushRows("logistics", logistics);
  pushRows("education", education);
  pushRows("health", health);
  pushRows("professional", professional);
  pushRows("home_trade", homeTrade);
  pushRows("automotive", automotive);
  pushRows("electronics", electronics);

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const header = ["vertical", "id", "guestName", "guestEmail", "guestPhone", "status", "createdAt", "notes"];
  const csv = [csvRow(header), ...rows.map((row) => csvRow(header.map((key) => row[key])))]
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="enquiries-${businessId}.csv"`);
  res.send(csv);
});

enquiriesMineRouter.get("/mine", requireAuth, async (req, res) => {
  const query = mineEnquiriesQuerySchema.parse(req.query);
  const result = await enquiriesMineService.listForUser(req.user!.id, query);
  res.json(result);
});
