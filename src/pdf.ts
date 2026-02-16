import PDFDocument from "pdfkit";
import { pool } from "./db.js";
import fs from "fs";
import path from "path";
import { QueryResultRow } from "pg";

const REPORTS_DIR = path.join(process.cwd(), "reports");

interface ContractorRow extends QueryResultRow {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  location: string;
  day_rate: string;
  years_experience: number;
  availability: string;
  available_from: string | null;
  certifications: string[];
  sectors: string[];
  skills: string[];
  rating: string | null;
  review_count: number;
  placement_count: number;
  security_clearance: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  education: EducationEntry[];
  work_history: WorkHistoryEntry[];
  notable_projects: ProjectEntry[];
  languages: string[];
}

interface EducationEntry {
  institution: string;
  degree: string;
  year?: number;
}

interface WorkHistoryEntry {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface ProjectEntry {
  name: string;
  client?: string;
  description: string;
}

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function formatDate(date: string | Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string): void {
  doc.rect(0, 0, doc.page.width, 80).fill("#1a1a2e");
  doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold").text(title, 40, 25, { width: doc.page.width - 80 });
  if (subtitle) {
    doc.fontSize(11).font("Helvetica").fillColor("#a0a0cc").text(subtitle, 40, 52, { width: doc.page.width - 80 });
  }
  doc.fillColor("#333333");
  doc.y = 100;
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.rect(40, y, 3, 16).fill("#4a90d9");
  doc.fillColor("#1a1a2e").fontSize(13).font("Helvetica-Bold").text(title, 50, y + 1);
  doc.fillColor("#333333").font("Helvetica").fontSize(10);
  doc.moveDown(0.3);
}

function drawKeyValue(doc: PDFKit.PDFDocument, key: string, value: string, x = 50): void {
  doc.font("Helvetica-Bold").text(`${key}: `, x, doc.y, { continued: true });
  doc.font("Helvetica").text(value);
}

function drawDivider(doc: PDFKit.PDFDocument): void {
  doc.moveDown(0.3);
  const y = doc.y;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
  doc.moveDown(0.3);
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  const y = doc.page.height - 40;
  doc.fontSize(8).fillColor("#999999")
    .text(`Generated ${new Date().toLocaleString("en-GB")} | Contractor Search MCP`, 40, y, { width: doc.page.width - 80, align: "center" });
}

export async function generateContractorPDF(contractorId: string, baseUrl: string): Promise<{ url: string; filename: string } | { error: string }> {
  const result = await pool.query(
    `SELECT * FROM contractors WHERE id = $1`,
    [contractorId]
  );
  if (result.rows.length === 0) return { error: "Contractor not found" };

  const c: ContractorRow = result.rows[0];
  ensureReportsDir();

  const filename = `contractor-${c.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawHeader(doc, c.name, c.title);

    drawSectionTitle(doc, "Profile Summary");
    drawKeyValue(doc, "Location", c.location);
    drawKeyValue(doc, "Day Rate", `£${parseInt(c.day_rate, 10).toLocaleString()}`);
    drawKeyValue(doc, "Experience", `${c.years_experience} years`);
    drawKeyValue(doc, "Availability", c.availability === "available" ? "Available now" : c.availability === "within_30" ? `Available from ${formatDate(c.available_from)}` : c.availability);
    drawKeyValue(doc, "Security Clearance", c.security_clearance || "None");
    if (c.rating) drawKeyValue(doc, "Rating", `${parseFloat(c.rating).toFixed(1)}/5 (${c.review_count} reviews, ${c.placement_count} placements)`);

    drawDivider(doc);

    if (c.bio) {
      drawSectionTitle(doc, "Bio");
      doc.fontSize(10).text(c.bio, 50, doc.y, { width: doc.page.width - 100 });
    }

    drawDivider(doc);

    drawSectionTitle(doc, "Contact Details");
    if (c.email) drawKeyValue(doc, "Email", c.email);
    if (c.phone) drawKeyValue(doc, "Phone", c.phone);
    if (c.linkedin_url) drawKeyValue(doc, "LinkedIn", c.linkedin_url);

    drawDivider(doc);

    if (c.certifications?.length > 0) {
      drawSectionTitle(doc, "Certifications");
      doc.fontSize(10).text(c.certifications.join("  •  "), 50, doc.y, { width: doc.page.width - 100 });
    }

    if (c.skills?.length > 0) {
      drawSectionTitle(doc, "Skills");
      doc.fontSize(10).text(c.skills.join("  •  "), 50, doc.y, { width: doc.page.width - 100 });
    }

    if (c.sectors?.length > 0) {
      drawSectionTitle(doc, "Sectors");
      doc.fontSize(10).text(c.sectors.join("  •  "), 50, doc.y, { width: doc.page.width - 100 });
    }

    drawDivider(doc);

    if (c.work_history && c.work_history.length > 0) {
      drawSectionTitle(doc, "Work History");
      for (const job of c.work_history) {
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
          drawFooter(doc);
        }
        doc.font("Helvetica-Bold").fontSize(10).text(`${job.role} — ${job.company}`, 50, doc.y);
        doc.font("Helvetica").fontSize(9).fillColor("#666666").text(job.period, 50, doc.y);
        doc.fillColor("#333333").fontSize(9).text(job.description, 50, doc.y, { width: doc.page.width - 100 });
        doc.moveDown(0.5);
      }
    }

    if (c.education && c.education.length > 0) {
      drawSectionTitle(doc, "Education");
      for (const edu of c.education) {
        doc.font("Helvetica-Bold").fontSize(10).text(`${edu.degree} — ${edu.institution}`, 50, doc.y);
        if (edu.year) doc.font("Helvetica").fontSize(9).fillColor("#666666").text(edu.year.toString(), 50, doc.y);
        doc.fillColor("#333333");
        doc.moveDown(0.3);
      }
    }

    if (c.notable_projects && c.notable_projects.length > 0) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      drawSectionTitle(doc, "Notable Projects");
      for (const proj of c.notable_projects) {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          drawFooter(doc);
        }
        doc.font("Helvetica-Bold").fontSize(10).text(proj.name, 50, doc.y);
        doc.font("Helvetica").fontSize(9).text(proj.description, 50, doc.y, { width: doc.page.width - 100 });
        doc.moveDown(0.3);
      }
    }

    if (c.languages?.length > 0) {
      drawSectionTitle(doc, "Languages");
      doc.fontSize(10).text(c.languages.join("  •  "), 50, doc.y, { width: doc.page.width - 100 });
    }

    drawFooter(doc);
    doc.end();

    stream.on("finish", () => {
      resolve({ url: `${baseUrl}/reports/${filename}`, filename });
    });
    stream.on("error", reject);
  });
}

export async function generateShortlistPDF(shortlistId: string, baseUrl: string): Promise<{ url: string; filename: string } | { error: string }> {
  const shortlist = await pool.query(`SELECT * FROM shortlists WHERE id = $1`, [shortlistId]);
  if (shortlist.rows.length === 0) return { error: "Shortlist not found" };

  const sl = shortlist.rows[0];

  const items = await pool.query(
    `SELECT si.*, c.name, c.title, c.location, c.day_rate, c.availability, c.rating,
            c.review_count, c.years_experience, c.certifications, c.skills,
            c.security_clearance, c.email, c.phone, c.bio
     FROM shortlist_items si
     JOIN contractors c ON si.contractor_id = c.id
     WHERE si.shortlist_id = $1
     ORDER BY si.added_at`,
    [shortlistId]
  );

  ensureReportsDir();
  const filename = `shortlist-${sl.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawHeader(doc, sl.name, `${sl.role_title || ""}${sl.client_name ? ` — ${sl.client_name}` : ""} | ${items.rows.length} candidates`);

    if (sl.description) {
      doc.fontSize(10).text(sl.description, 50, doc.y, { width: doc.page.width - 100 });
      doc.moveDown(0.5);
    }

    drawSectionTitle(doc, "Summary");
    drawKeyValue(doc, "Status", sl.status);
    drawKeyValue(doc, "Created", formatDate(sl.created_at));
    drawKeyValue(doc, "Total Candidates", items.rows.length.toString());

    drawDivider(doc);

    for (let i = 0; i < items.rows.length; i++) {
      const candidate = items.rows[i];

      if (doc.y > doc.page.height - 200) {
        doc.addPage();
        drawFooter(doc);
      }

      drawSectionTitle(doc, `${i + 1}. ${candidate.name}`);
      doc.font("Helvetica").fontSize(10).fillColor("#666666").text(candidate.title, 50, doc.y);
      doc.fillColor("#333333");

      drawKeyValue(doc, "Location", candidate.location);
      drawKeyValue(doc, "Day Rate", `£${parseInt(candidate.day_rate, 10).toLocaleString()}`);
      drawKeyValue(doc, "Experience", `${candidate.years_experience} years`);
      drawKeyValue(doc, "Availability", candidate.availability === "available" ? "Available now" : candidate.availability);
      drawKeyValue(doc, "Security Clearance", candidate.security_clearance || "None");
      drawKeyValue(doc, "Status on Shortlist", candidate.status);
      if (candidate.rating) drawKeyValue(doc, "Rating", `${parseFloat(candidate.rating).toFixed(1)}/5 (${candidate.review_count} reviews)`);
      if (candidate.email) drawKeyValue(doc, "Email", candidate.email);

      if (candidate.certifications?.length > 0) {
        drawKeyValue(doc, "Certifications", candidate.certifications.join(", "));
      }

      if (candidate.notes) {
        doc.moveDown(0.2);
        doc.font("Helvetica-Oblique").fontSize(9).fillColor("#4a90d9").text(`Notes: ${candidate.notes}`, 50, doc.y, { width: doc.page.width - 100 });
        doc.fillColor("#333333").font("Helvetica");
      }

      if (i < items.rows.length - 1) drawDivider(doc);
    }

    drawFooter(doc);
    doc.end();

    stream.on("finish", () => {
      resolve({ url: `${baseUrl}/reports/${filename}`, filename });
    });
    stream.on("error", reject);
  });
}

interface ComparisonContractor extends QueryResultRow {
  id: string;
  name: string;
  title: string;
  location: string;
  day_rate: string;
  years_experience: number;
  availability: string;
  available_from: string | null;
  certifications: string[];
  skills: string[];
  sectors: string[];
  rating: string | null;
  review_count: number;
  placement_count: number;
  security_clearance: string | null;
  email: string | null;
  phone: string | null;
}

export async function generateComparisonPDF(contractorIds: string[], baseUrl: string): Promise<{ url: string; filename: string } | { error: string }> {
  if (!contractorIds || contractorIds.length < 2) return { error: "Provide at least 2 contractor IDs to compare" };
  if (contractorIds.length > 10) return { error: "Maximum 10 contractors for comparison" };

  const placeholders = contractorIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await pool.query(
    `SELECT id, name, title, location, day_rate, years_experience, availability, available_from,
            certifications, skills, sectors, rating, review_count, placement_count,
            security_clearance, email, phone, bio
     FROM contractors WHERE id IN (${placeholders})`,
    contractorIds
  );

  if (result.rows.length === 0) return { error: "No contractors found" };

  const contractors: ComparisonContractor[] = result.rows;
  ensureReportsDir();
  const filename = `comparison-${contractors.length}-contractors-${Date.now()}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawHeader(doc, "Contractor Comparison", `${contractors.length} contractors compared | ${formatDate(new Date())}`);

    const colWidth = (doc.page.width - 160) / contractors.length;
    const labelX = 40;
    const startX = 160;
    let currentY = doc.y + 10;

    doc.rect(labelX, currentY, doc.page.width - 80, 25).fill("#f0f0f5");
    doc.fillColor("#1a1a2e").font("Helvetica-Bold").fontSize(10);
    doc.text("", labelX + 5, currentY + 7);
    contractors.forEach((c, i) => {
      doc.text(c.name, startX + (i * colWidth), currentY + 7, { width: colWidth - 10 });
    });
    currentY += 30;
    doc.fillColor("#333333");

    const fields: [string, (c: ComparisonContractor) => string][] = [
      ["Title", (c) => c.title],
      ["Location", (c) => c.location],
      ["Day Rate", (c) => `£${parseInt(c.day_rate, 10).toLocaleString()}`],
      ["Experience", (c) => `${c.years_experience} years`],
      ["Availability", (c) => c.availability === "available" ? "Available now" : c.availability === "within_30" ? `From ${formatDate(c.available_from)}` : c.availability],
      ["Clearance", (c) => c.security_clearance || "None"],
      ["Rating", (c) => c.rating ? `${parseFloat(c.rating).toFixed(1)}/5` : "N/A"],
      ["Reviews", (c) => `${c.review_count}`],
      ["Placements", (c) => `${c.placement_count}`],
      ["Email", (c) => c.email || "N/A"],
    ];

    for (let fi = 0; fi < fields.length; fi++) {
      const [label, getter] = fields[fi];
      const bgColor = fi % 2 === 0 ? "#fafafa" : "#ffffff";
      const rowHeight = 18;

      doc.rect(labelX, currentY, doc.page.width - 80, rowHeight).fill(bgColor);
      doc.fillColor("#333333").font("Helvetica-Bold").fontSize(9);
      doc.text(label, labelX + 5, currentY + 4);

      doc.font("Helvetica").fontSize(9);
      contractors.forEach((c, i) => {
        doc.text(getter(c), startX + (i * colWidth), currentY + 4, { width: colWidth - 10 });
      });

      currentY += rowHeight;
    }

    currentY += 10;

    const listFields: [string, (c: ComparisonContractor) => string[]][] = [
      ["Certifications", (c) => c.certifications || []],
      ["Skills", (c) => c.skills || []],
      ["Sectors", (c) => c.sectors || []],
    ];

    for (const [label, getter] of listFields) {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        drawFooter(doc);
        currentY = 60;
      }

      doc.fillColor("#1a1a2e").font("Helvetica-Bold").fontSize(11).text(label, labelX, currentY);
      currentY += 16;

      const maxItems = Math.max(...contractors.map(c => getter(c).length));
      for (let r = 0; r < maxItems; r++) {
        const bgColor = r % 2 === 0 ? "#fafafa" : "#ffffff";
        doc.rect(labelX, currentY, doc.page.width - 80, 16).fill(bgColor);
        doc.fillColor("#333333").font("Helvetica").fontSize(8);
        contractors.forEach((c, i) => {
          const items = getter(c);
          if (items[r]) {
            doc.text(items[r], startX + (i * colWidth), currentY + 3, { width: colWidth - 10 });
          }
        });
        currentY += 16;
      }
      currentY += 8;
    }

    drawFooter(doc);
    doc.end();

    stream.on("finish", () => {
      resolve({ url: `${baseUrl}/reports/${filename}`, filename });
    });
    stream.on("error", reject);
  });
}
