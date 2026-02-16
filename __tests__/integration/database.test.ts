import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import pg from "pg";
import { CONTRACTORS, JOBS, TEST_CONTRACTOR_IDS, TEST_JOB_IDS } from "../fixtures.js";

const { Pool } = pg;

let testPool: pg.Pool;

async function truncateAll() {
  await testPool.query(`
    TRUNCATE outreach_drafts, engagements, shortlist_items, shortlists, jobs, contractors, allowed_users CASCADE
  `);
}

async function seedTestData() {
  for (const c of CONTRACTORS) {
    await testPool.query(
      `INSERT INTO contractors (id, name, initials, title, bio, location, day_rate, years_experience,
        availability, available_from, certifications, sectors, skills, rating, review_count,
        placement_count, security_clearance, email, phone, linkedin_url, profile_photo_url,
        education, work_history, notable_projects, languages)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [
        c.id, c.name, c.initials, c.title, c.bio, c.location, c.day_rate,
        c.years_experience, c.availability, c.available_from, c.certifications,
        c.sectors, c.skills, c.rating, c.review_count, c.placement_count,
        c.security_clearance, c.email, c.phone, c.linkedin_url, c.profile_photo_url,
        JSON.stringify(c.education), JSON.stringify(c.work_history),
        JSON.stringify(c.notable_projects), c.languages,
      ]
    );
  }

  for (const j of JOBS) {
    await testPool.query(
      `INSERT INTO jobs (id, title, client_name, description, location, remote_option,
        day_rate_min, day_rate_max, duration_weeks, start_date, required_certifications,
        required_skills, required_clearance, sector, experience_min, status, urgency, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        j.id, j.title, j.client_name, j.description, j.location, j.remote_option,
        j.day_rate_min, j.day_rate_max, j.duration_weeks, j.start_date,
        j.required_certifications, j.required_skills, j.required_clearance,
        j.sector, j.experience_min, j.status, j.urgency, j.notes,
      ]
    );
  }
}

beforeAll(async () => {
  testPool = new Pool({ connectionString: process.env.DATABASE_URL });

  const { initDatabase } = await import("../../src/db.js");
  await initDatabase();

  await truncateAll();
  await seedTestData();
});

afterEach(async () => {
  await testPool.query(`TRUNCATE outreach_drafts, engagements, shortlist_items, shortlists CASCADE`);
});

afterAll(async () => {
  await truncateAll();
  await testPool.end();
});

describe("Integration: searchContractors", () => {
  it("finds contractors in the database with no filters", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({});

    expect(result.total_matches).toBe(CONTRACTORS.length);
    expect(result.contractors.length).toBeGreaterThan(0);
  });

  it("filters by location", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ location: "Manchester" });

    expect(result.total_matches).toBe(1);
    expect(result.contractors[0].name).toBe("Thomas Wright");
  });

  it("filters by availability", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ availability: "available" });

    const availableCount = CONTRACTORS.filter(c => c.availability === "available").length;
    expect(result.total_matches).toBe(availableCount);
  });

  it("filters by max_rate", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ max_rate: 500 });

    for (const c of result.contractors) {
      expect(c.day_rate).toBeLessThanOrEqual(500);
    }
  });

  it("filters by certifications", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ certifications: ["CISSP"] });

    expect(result.total_matches).toBeGreaterThan(0);
    for (const c of result.contractors) {
      expect(c.certifications).toEqual(expect.arrayContaining(["CISSP"]));
    }
  });

  it("filters by sector", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ sector: "Insurance" });

    expect(result.total_matches).toBeGreaterThan(0);
  });

  it("filters by min_experience", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ min_experience: 15 });

    for (const c of result.contractors) {
      expect(c.years_experience).toBeGreaterThanOrEqual(15);
    }
  });

  it("filters by security clearance", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ clearance: "DV Cleared" });

    expect(result.total_matches).toBe(1);
    expect(result.contractors[0].name).toBe("David Okonkwo");
  });

  it("searches by free text query", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ query: "compliance" });

    expect(result.total_matches).toBeGreaterThan(0);
  });

  it("returns empty results for non-matching search", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ location: "Atlantis" });

    expect(result.total_matches).toBe(0);
    expect(result.contractors).toHaveLength(0);
  });

  it("prevents SQL injection through query parameter", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ query: "'; DROP TABLE contractors; --" });

    expect(result.total_matches).toBe(0);

    const tableCheck = await testPool.query(
      "SELECT COUNT(*) as count FROM contractors"
    );
    expect(parseInt(tableCheck.rows[0].count)).toBe(CONTRACTORS.length);
  });

  it("prevents SQL injection through location parameter", async () => {
    const { searchContractors } = await import("../../src/tools.js");
    const result = await searchContractors({ location: "London' OR 1=1 --" });

    expect(result.total_matches).toBe(0);
  });
});

describe("Integration: getContractor", () => {
  it("returns a contractor by ID", async () => {
    const { getContractor } = await import("../../src/tools.js");
    const result = await getContractor(TEST_CONTRACTOR_IDS.sarah);

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Sarah Chen");
    expect(typeof result!.day_rate).toBe("number");
  });

  it("returns null for non-existent UUID", async () => {
    const { getContractor } = await import("../../src/tools.js");
    const result = await getContractor("00000000-0000-0000-0000-999999999999");

    expect(result).toBeNull();
  });
});

describe("Integration: getContractorCV", () => {
  it("returns full CV with education and work history", async () => {
    const { getContractorCV } = await import("../../src/tools.js");
    const result = await getContractorCV(TEST_CONTRACTOR_IDS.sarah);

    expect(result).not.toBeNull();
    expect(result!.education).toHaveLength(1);
    expect(result!.work_history).toHaveLength(1);
    expect(result!.notable_projects).toHaveLength(1);
    expect(result!.languages).toContain("English");
  });
});

describe("Integration: listJobs", () => {
  it("lists all jobs", async () => {
    const { listJobs } = await import("../../src/tools.js");
    const result = await listJobs({});

    expect(result.total).toBe(JOBS.length);
  });

  it("filters by status", async () => {
    const { listJobs } = await import("../../src/tools.js");
    const result = await listJobs({ status: "open" });

    const openCount = JOBS.filter(j => j.status === "open").length;
    expect(result.total).toBe(openCount);
  });
});

describe("Integration: getJob", () => {
  it("returns a job by ID", async () => {
    const { getJob } = await import("../../src/tools.js");
    const result = await getJob(TEST_JOB_IDS.auditor);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("ISO 27001 Lead Auditor");
  });
});

describe("Integration: findMatchingContractors", () => {
  it("finds contractors matching job requirements", async () => {
    const { findMatchingContractors } = await import("../../src/tools.js");
    const result = await findMatchingContractors(TEST_JOB_IDS.auditor);

    expect(result).toHaveProperty("job");
    expect(result).toHaveProperty("contractors");
    if ("contractors" in result) {
      expect(result.contractors.length).toBeGreaterThan(0);
      for (const c of result.contractors) {
        expect(c).toHaveProperty("matching_certifications");
        expect(c).toHaveProperty("matching_skills");
        expect(c).toHaveProperty("location_match");
        expect(c).toHaveProperty("within_budget");
      }
    }
  });

  it("returns error for non-existent job", async () => {
    const { findMatchingContractors } = await import("../../src/tools.js");
    const result = await findMatchingContractors("00000000-0000-0000-0000-999999999999");

    expect(result).toHaveProperty("error", "Job not found");
  });
});

describe("Integration: shortlist lifecycle", () => {
  it("creates, populates, and retrieves a shortlist", async () => {
    const { createShortlist, addToShortlist, getShortlist, listShortlists } = await import("../../src/tools.js");

    const sl = await createShortlist({
      name: "Test Shortlist",
      description: "Integration test shortlist",
      role_title: "Auditor",
      client_name: "TestCo",
    });
    expect(sl.name).toBe("Test Shortlist");
    expect(sl.status).toBe("active");

    const added = await addToShortlist({
      shortlist_id: sl.id,
      contractor_id: TEST_CONTRACTOR_IDS.sarah,
      notes: "Strong ISO 27001 background",
    });
    expect(added.contractor_name).toBe("Sarah Chen");

    const retrieved = await getShortlist(sl.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.candidates).toHaveLength(1);
    expect(retrieved!.candidates[0].name).toBe("Sarah Chen");

    const all = await listShortlists();
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it("handles adding non-existent contractor to shortlist", async () => {
    const { createShortlist, addToShortlist } = await import("../../src/tools.js");

    const sl = await createShortlist({ name: "Empty SL" });

    const result = await addToShortlist({
      shortlist_id: sl.id,
      contractor_id: "00000000-0000-0000-0000-999999999999",
    });

    expect(result).toHaveProperty("error", "Contractor not found");
  });
});

describe("Integration: updateShortlistItemStatus", () => {
  it("updates candidate status through pipeline stages", async () => {
    const { createShortlist, addToShortlist, updateShortlistItemStatus } = await import("../../src/tools.js");

    const sl = await createShortlist({ name: "Status Test SL" });
    await addToShortlist({ shortlist_id: sl.id, contractor_id: TEST_CONTRACTOR_IDS.sarah });

    const result = await updateShortlistItemStatus({
      shortlist_id: sl.id,
      contractor_id: TEST_CONTRACTOR_IDS.sarah,
      status: "contacted",
    });

    expect(result.status).toBe("contacted");
  });
});

describe("Integration: outreach lifecycle", () => {
  it("creates and lists outreach drafts", async () => {
    const { draftOutreach, listOutreach } = await import("../../src/tools.js");

    const draft = await draftOutreach({
      contractor_id: TEST_CONTRACTOR_IDS.sarah,
      subject: "Opportunity: ISO 27001 Auditor",
      body: "Dear Sarah, we have an exciting opportunity...",
    });

    expect(draft.contractor_name).toBe("Sarah Chen");
    expect(draft.contractor_email).toBe("sarah.chen@test.com");
    expect(draft.status).toBe("draft");

    const all = await listOutreach();
    expect(all.length).toBeGreaterThanOrEqual(1);

    const filtered = await listOutreach({ contractor_id: TEST_CONTRACTOR_IDS.sarah });
    expect(filtered.length).toBeGreaterThanOrEqual(1);
  });

  it("returns error for non-existent contractor", async () => {
    const { draftOutreach } = await import("../../src/tools.js");
    const result = await draftOutreach({
      contractor_id: "00000000-0000-0000-0000-999999999999",
      subject: "Test",
      body: "Test",
    });

    expect(result).toHaveProperty("error", "Contractor not found");
  });
});

describe("Integration: booking lifecycle", () => {
  it("books a contractor and marks them unavailable", async () => {
    const { bookContractor, getContractor } = await import("../../src/tools.js");

    const result = await bookContractor({
      contractor_id: TEST_CONTRACTOR_IDS.priya,
      role_title: "GRC Analyst",
      client_name: "TestBank",
      start_date: "2025-04-01",
      end_date: "2025-07-01",
      agreed_rate: 480,
    });

    expect(result).toHaveProperty("engagement");
    expect(result.engagement.status).toBe("confirmed");
    expect(result.message).toContain("Priya Patel");
    expect(result.message).toContain("booked");

    const contractor = await getContractor(TEST_CONTRACTOR_IDS.priya);
    expect(contractor!.availability).toBe("unavailable");
  });

  it("returns error for non-existent contractor", async () => {
    const { bookContractor } = await import("../../src/tools.js");
    const result = await bookContractor({
      contractor_id: "00000000-0000-0000-0000-999999999999",
      role_title: "Test",
    });

    expect(result).toHaveProperty("error", "Contractor not found");
  });
});

describe("Integration: updateJobStatus", () => {
  it("updates job status", async () => {
    const { updateJobStatus } = await import("../../src/tools.js");
    const result = await updateJobStatus(TEST_JOB_IDS.auditor, "shortlisting");

    expect(result.status).toBe("shortlisting");

    await testPool.query(`UPDATE jobs SET status = 'open' WHERE id = $1`, [TEST_JOB_IDS.auditor]);
  });

  it("returns error for non-existent job", async () => {
    const { updateJobStatus } = await import("../../src/tools.js");
    const result = await updateJobStatus("00000000-0000-0000-0000-999999999999", "filled");

    expect(result).toHaveProperty("error", "Job not found");
  });
});

describe("Integration: getPipeline", () => {
  it("returns pipeline overview", async () => {
    const { getPipeline } = await import("../../src/tools.js");
    const result = await getPipeline();

    expect(result).toHaveProperty("open_jobs");
    expect(result).toHaveProperty("active_shortlists");
    expect(result).toHaveProperty("active_engagements");
    expect(result).toHaveProperty("pending_outreach");
    expect(result).toHaveProperty("summary");
    expect(result.summary.open_jobs_count).toBeGreaterThanOrEqual(0);
  });
});
