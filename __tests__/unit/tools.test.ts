import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CONTRACTORS,
  JOBS,
  TEST_CONTRACTOR_IDS,
  TEST_JOB_IDS,
  mockQueryResult,
} from "../fixtures.js";

const mockQuery = vi.fn();
vi.mock("../../src/db.js", () => ({
  pool: { query: (...args: unknown[]) => mockQuery(...args) },
}));

const {
  searchContractors,
  getContractor,
  getContractorCV,
  listJobs,
  getJob,
  findMatchingContractors,
  createShortlist,
  addToShortlist,
  getShortlist,
  listShortlists,
  updateShortlistItemStatus,
  draftOutreach,
  listOutreach,
  bookContractor,
  getPipeline,
  updateJobStatus,
} = await import("../../src/tools.js");

beforeEach(() => {
  mockQuery.mockReset();
});

describe("searchContractors", () => {
  it("returns all contractors when no filters are applied", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "3" }]))
      .mockResolvedValueOnce(mockQueryResult(CONTRACTORS.slice(0, 3)));

    const result = await searchContractors({});

    expect(result.total_matches).toBe(3);
    expect(result.showing).toBe(3);
    expect(result.contractors).toHaveLength(3);
    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).not.toContain("WHERE");
  });

  it("applies location filter case-insensitively", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await searchContractors({ location: "London" });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("LOWER(location) = LOWER($1)");
    expect(mockQuery.mock.calls[0][1]).toContain("London");
  });

  it("applies availability filter and skips 'any'", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "2" }]))
      .mockResolvedValueOnce(mockQueryResult(CONTRACTORS.slice(0, 2)));

    await searchContractors({ availability: "available" });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("availability = $1");

    mockQuery.mockReset();
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "6" }]))
      .mockResolvedValueOnce(mockQueryResult(CONTRACTORS));

    await searchContractors({ availability: "any" });

    const countSql2 = mockQuery.mock.calls[0][0] as string;
    expect(countSql2).not.toContain("availability");
  });

  it("applies certifications filter using array overlap", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await searchContractors({ certifications: ["ISO 27001 Lead Auditor"] });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("certifications && $1");
  });

  it("applies skills filter using array overlap", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await searchContractors({ skills: ["GDPR"] });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("skills && $1");
  });

  it("applies max_rate filter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "2" }]))
      .mockResolvedValueOnce(mockQueryResult(CONTRACTORS.slice(0, 2)));

    await searchContractors({ max_rate: 500 });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("day_rate <= $1");
    expect(mockQuery.mock.calls[0][1]).toContain(500);
  });

  it("applies sector filter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await searchContractors({ sector: "Banking" });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("$1 = ANY(sectors)");
  });

  it("applies min_experience filter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[3]]));

    await searchContractors({ min_experience: 15 });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("years_experience >= $1");
  });

  it("applies clearance filter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await searchContractors({ clearance: "SC Cleared" });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("security_clearance = $1");
  });

  it("applies free text query with LIKE across multiple fields", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await searchContractors({ query: "compliance" });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("LOWER(name) LIKE LOWER($1)");
    expect(countSql).toContain("LOWER(title) LIKE LOWER($1)");
    expect(countSql).toContain("LOWER(COALESCE(bio, '')) LIKE LOWER($1)");
    expect(mockQuery.mock.calls[0][1]).toContain("%compliance%");
  });

  it("combines multiple filters with AND", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await searchContractors({ location: "London", max_rate: 600, clearance: "SC Cleared" });

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain("LOWER(location) = LOWER($1)");
    expect(countSql).toContain("day_rate <= $2");
    expect(countSql).toContain("security_clearance = $3");
    expect(countSql).toContain(" AND ");
  });

  it("respects custom limit parameter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "6" }]))
      .mockResolvedValueOnce(mockQueryResult(CONTRACTORS.slice(0, 5)));

    await searchContractors({ limit: 5 });

    const dataSql = mockQuery.mock.calls[1][0] as string;
    expect(dataSql).toContain("LIMIT $1");
    expect(mockQuery.mock.calls[1][1]).toContain(5);
  });

  it("uses default limit of 10 when not specified", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "0" }]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await searchContractors({});

    expect(mockQuery.mock.calls[1][1]).toContain(10);
  });

  it("returns empty results when no matches found", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "0" }]))
      .mockResolvedValueOnce(mockQueryResult([]));

    const result = await searchContractors({ location: "Atlantis" });

    expect(result.total_matches).toBe(0);
    expect(result.showing).toBe(0);
    expect(result.contractors).toHaveLength(0);
  });

  it("correctly parses numeric fields from string DB values", async () => {
    const row = {
      ...CONTRACTORS[0],
      day_rate: "575",
      years_experience: "12",
      rating: "4.8",
      review_count: "23",
      placement_count: "47",
    };
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([row]));

    const result = await searchContractors({});

    expect(typeof result.contractors[0].day_rate).toBe("number");
    expect(result.contractors[0].day_rate).toBe(575);
    expect(typeof result.contractors[0].years_experience).toBe("number");
    expect(typeof result.contractors[0].rating).toBe("number");
  });

  it("handles null rating gracefully", async () => {
    const row = { ...CONTRACTORS[0], rating: null };
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "1" }]))
      .mockResolvedValueOnce(mockQueryResult([row]));

    const result = await searchContractors({});
    expect(result.contractors[0].rating).toBeNull();
  });

  it("parameterises SQL injection attempt in query field", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "0" }]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await searchContractors({ query: "'; DROP TABLE contractors; --" });

    const params = mockQuery.mock.calls[0][1] as string[];
    expect(params[0]).toBe("%'; DROP TABLE contractors; --%");
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).not.toContain("DROP TABLE");
  });

  it("parameterises SQL injection attempt in location field", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ total: "0" }]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await searchContractors({ location: "London' OR 1=1 --" });

    const params = mockQuery.mock.calls[0][1] as string[];
    expect(params[0]).toBe("London' OR 1=1 --");
  });
});

describe("getContractor", () => {
  it("returns contractor when found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    const result = await getContractor(TEST_CONTRACTOR_IDS.sarah);

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Sarah Chen");
    expect(typeof result!.day_rate).toBe("number");
  });

  it("returns null for non-existent ID", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await getContractor("00000000-0000-0000-0000-999999999999");
    expect(result).toBeNull();
  });

  it("uses parameterised query for ID lookup", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    await getContractor("test-id");

    expect(mockQuery.mock.calls[0][1]).toEqual(["test-id"]);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("WHERE id = $1");
  });
});

describe("getContractorCV", () => {
  it("returns full CV including education and work history", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    const result = await getContractorCV(TEST_CONTRACTOR_IDS.sarah);

    expect(result).not.toBeNull();
    expect(result!.education).toBeDefined();
    expect(result!.work_history).toBeDefined();
    expect(result!.notable_projects).toBeDefined();
    expect(result!.languages).toBeDefined();
  });

  it("returns null for non-existent contractor", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await getContractorCV("nonexistent-id");
    expect(result).toBeNull();
  });

  it("queries education, work_history, notable_projects, and languages columns", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    await getContractorCV(TEST_CONTRACTOR_IDS.sarah);

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("education");
    expect(sql).toContain("work_history");
    expect(sql).toContain("notable_projects");
    expect(sql).toContain("languages");
  });
});

describe("listJobs", () => {
  it("returns all jobs when no filters applied", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult(JOBS));

    const result = await listJobs({});

    expect(result.total).toBe(3);
    expect(result.jobs).toHaveLength(3);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).not.toContain("WHERE");
  });

  it("filters by status", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([JOBS[0]]));

    await listJobs({ status: "open" });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("status = $1");
  });

  it("filters by sector case-insensitively", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([JOBS[0]]));

    await listJobs({ sector: "Banking" });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("LOWER(sector) = LOWER($1)");
  });

  it("filters by urgency", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([JOBS[0]]));

    await listJobs({ urgency: "urgent" });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("urgency = $1");
  });

  it("filters by location", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    await listJobs({ location: "London" });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("LOWER(location) = LOWER($");
  });

  it("orders by urgency priority", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult(JOBS));

    await listJobs({});

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("CASE urgency");
    expect(sql).toContain("'critical' THEN 1");
  });

  it("uses default limit of 20", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    await listJobs({});

    const params = mockQuery.mock.calls[0][1] as number[];
    expect(params[params.length - 1]).toBe(20);
  });
});

describe("getJob", () => {
  it("returns job when found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([JOBS[0]]));

    const result = await getJob(TEST_JOB_IDS.auditor);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("ISO 27001 Lead Auditor");
  });

  it("returns null when job not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await getJob("nonexistent");
    expect(result).toBeNull();
  });
});

describe("findMatchingContractors", () => {
  it("returns error when job not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await findMatchingContractors("nonexistent");

    expect(result).toHaveProperty("error", "Job not found");
  });

  it("finds contractors matching job requirements", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([JOBS[0]]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0], CONTRACTORS[1]]));

    const result = await findMatchingContractors(TEST_JOB_IDS.auditor);

    expect(result).toHaveProperty("job");
    expect(result).toHaveProperty("contractors");
    expect(result).toHaveProperty("total_matches");
  });

  it("calculates matching certifications and skills", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([JOBS[0]]))
      .mockResolvedValueOnce(mockQueryResult([CONTRACTORS[0]]));

    const result = await findMatchingContractors(TEST_JOB_IDS.auditor);

    if ("contractors" in result) {
      expect(result.contractors[0]).toHaveProperty("matching_certifications");
      expect(result.contractors[0]).toHaveProperty("matching_skills");
      expect(result.contractors[0]).toHaveProperty("location_match");
      expect(result.contractors[0]).toHaveProperty("within_budget");
    }
  });

  it("excludes unavailable contractors in query", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([JOBS[0]]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await findMatchingContractors(TEST_JOB_IDS.auditor);

    const matchSql = mockQuery.mock.calls[1][0] as string;
    expect(matchSql).toContain("availability != 'unavailable'");
  });

  it("applies job required_certifications filter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([JOBS[0]]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await findMatchingContractors(TEST_JOB_IDS.auditor);

    const matchSql = mockQuery.mock.calls[1][0] as string;
    expect(matchSql).toContain("certifications && $");
  });

  it("applies job required_clearance filter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([JOBS[0]]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await findMatchingContractors(TEST_JOB_IDS.auditor);

    const matchSql = mockQuery.mock.calls[1][0] as string;
    expect(matchSql).toContain("security_clearance = $");
  });

  it("applies experience_min filter", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([JOBS[0]]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await findMatchingContractors(TEST_JOB_IDS.auditor);

    const matchSql = mockQuery.mock.calls[1][0] as string;
    expect(matchSql).toContain("years_experience >= $");
  });

  it("orders results by location match then rating", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([JOBS[0]]))
      .mockResolvedValueOnce(mockQueryResult([]));

    await findMatchingContractors(TEST_JOB_IDS.auditor);

    const matchSql = mockQuery.mock.calls[1][0] as string;
    expect(matchSql).toContain("CASE WHEN LOWER(location) = LOWER($");
    expect(matchSql).toContain("rating DESC");
  });
});

describe("createShortlist", () => {
  it("creates a shortlist with required fields", async () => {
    const shortlistRow = {
      id: "new-shortlist-id",
      name: "Test Shortlist",
      description: null,
      role_title: null,
      client_name: null,
      status: "active",
    };
    mockQuery.mockResolvedValueOnce(mockQueryResult([shortlistRow]));

    const result = await createShortlist({ name: "Test Shortlist" });

    expect(result.name).toBe("Test Shortlist");
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("INSERT INTO shortlists");
    expect(sql).toContain("RETURNING *");
  });

  it("passes optional fields correctly", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([{ id: "id", name: "SL" }]));

    await createShortlist({
      name: "SL",
      description: "desc",
      role_title: "Auditor",
      client_name: "Acme",
    });

    const params = mockQuery.mock.calls[0][1] as string[];
    expect(params).toEqual(["SL", "desc", "Auditor", "Acme"]);
  });
});

describe("addToShortlist", () => {
  it("returns error when contractor not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await addToShortlist({
      shortlist_id: "sl-1",
      contractor_id: "nonexistent",
    });

    expect(result).toHaveProperty("error", "Contractor not found");
  });

  it("adds contractor to shortlist with upsert", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ name: "Sarah Chen", title: "Auditor" }]))
      .mockResolvedValueOnce(mockQueryResult([{ id: "item-1", shortlist_id: "sl-1", contractor_id: "c-1" }]));

    const result = await addToShortlist({
      shortlist_id: "sl-1",
      contractor_id: "c-1",
      notes: "Good fit",
    });

    expect(result).toHaveProperty("contractor_name", "Sarah Chen");
    const insertSql = mockQuery.mock.calls[1][0] as string;
    expect(insertSql).toContain("ON CONFLICT");
  });
});

describe("getShortlist", () => {
  it("returns null when shortlist not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await getShortlist("nonexistent");
    expect(result).toBeNull();
  });

  it("returns shortlist with candidates joined from contractors", async () => {
    const slRow = { id: "sl-1", name: "Test SL", status: "active" };
    const itemRows = [
      { ...CONTRACTORS[0], shortlist_id: "sl-1", status: "shortlisted", notes: null, added_at: "2025-01-01", updated_at: "2025-01-01" },
    ];
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([slRow]))
      .mockResolvedValueOnce(mockQueryResult(itemRows));

    const result = await getShortlist("sl-1");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test SL");
    expect(result!.candidates).toHaveLength(1);
  });
});

describe("listShortlists", () => {
  it("lists all shortlists when no status filter", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([{ id: "sl-1", name: "SL1", candidate_count: "2" }]));

    const result = await listShortlists();

    expect(result).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).not.toContain("WHERE");
  });

  it("filters by status when provided", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    await listShortlists("active");

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("WHERE s.status = $1");
    expect(mockQuery.mock.calls[0][1]).toEqual(["active"]);
  });
});

describe("updateShortlistItemStatus", () => {
  it("returns error when item not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await updateShortlistItemStatus({
      shortlist_id: "sl-1",
      contractor_id: "c-1",
      status: "contacted",
    });

    expect(result).toHaveProperty("error", "Shortlist item not found");
  });

  it("updates status successfully", async () => {
    const updatedRow = { id: "item-1", status: "contacted" };
    mockQuery.mockResolvedValueOnce(mockQueryResult([updatedRow]));

    const result = await updateShortlistItemStatus({
      shortlist_id: "sl-1",
      contractor_id: "c-1",
      status: "contacted",
    });

    expect(result.status).toBe("contacted");
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("UPDATE shortlist_items SET status = $1");
  });
});

describe("draftOutreach", () => {
  it("returns error when contractor not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await draftOutreach({
      contractor_id: "nonexistent",
      subject: "Hello",
      body: "Hi there",
    });

    expect(result).toHaveProperty("error", "Contractor not found");
  });

  it("creates outreach draft and returns contractor info", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ name: "Sarah Chen", email: "sarah@test.com" }]))
      .mockResolvedValueOnce(mockQueryResult([{ id: "outreach-1", subject: "Hello", body: "Hi", status: "draft" }]));

    const result = await draftOutreach({
      contractor_id: "c-1",
      subject: "Hello",
      body: "Hi",
    });

    expect(result).toHaveProperty("contractor_name", "Sarah Chen");
    expect(result).toHaveProperty("contractor_email", "sarah@test.com");
  });
});

describe("listOutreach", () => {
  it("lists all outreach when no filters", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await listOutreach();

    expect(result).toEqual([]);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).not.toContain("WHERE");
  });

  it("filters by contractor_id", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    await listOutreach({ contractor_id: "c-1" });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("od.contractor_id = $1");
  });

  it("filters by status", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    await listOutreach({ status: "draft" });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("od.status = $1");
  });

  it("combines contractor_id and status filters", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    await listOutreach({ contractor_id: "c-1", status: "draft" });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("od.contractor_id = $1");
    expect(sql).toContain("od.status = $2");
  });
});

describe("bookContractor", () => {
  it("returns error when contractor not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await bookContractor({
      contractor_id: "nonexistent",
      role_title: "Auditor",
    });

    expect(result).toHaveProperty("error", "Contractor not found");
  });

  it("creates engagement and marks contractor unavailable", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ name: "Sarah", title: "Auditor", email: "s@test.com" }]))
      .mockResolvedValueOnce(mockQueryResult([{ id: "eng-1", status: "confirmed" }]))
      .mockResolvedValueOnce(mockQueryResult([]))
      ;

    const result = await bookContractor({
      contractor_id: "c-1",
      role_title: "ISO 27001 Auditor",
    });

    expect(result).toHaveProperty("engagement");
    expect(result).toHaveProperty("message");
    expect(result.message).toContain("booked");

    const insertSql = mockQuery.mock.calls[1][0] as string;
    expect(insertSql).toContain("INSERT INTO engagements");

    const updateSql = mockQuery.mock.calls[2][0] as string;
    expect(updateSql).toContain("UPDATE contractors SET availability = 'unavailable'");
  });

  it("updates shortlist item status when shortlist_id provided", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ name: "Sarah", title: "Auditor", email: "s@test.com" }]))
      .mockResolvedValueOnce(mockQueryResult([{ id: "eng-1", status: "confirmed" }]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      ;

    await bookContractor({
      contractor_id: "c-1",
      role_title: "Auditor",
      shortlist_id: "sl-1",
    });

    expect(mockQuery).toHaveBeenCalledTimes(4);
    const shortlistSql = mockQuery.mock.calls[3][0] as string;
    expect(shortlistSql).toContain("UPDATE shortlist_items SET status = 'accepted'");
  });
});

describe("getPipeline", () => {
  it("returns pipeline overview with all sections", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      ;

    const result = await getPipeline();

    expect(result).toHaveProperty("open_jobs");
    expect(result).toHaveProperty("active_shortlists");
    expect(result).toHaveProperty("active_engagements");
    expect(result).toHaveProperty("pending_outreach");
    expect(result).toHaveProperty("summary");
    expect(result.summary).toHaveProperty("open_jobs_count", 0);
    expect(result.summary).toHaveProperty("active_shortlists_count", 0);
    expect(result.summary).toHaveProperty("active_engagements_count", 0);
    expect(result.summary).toHaveProperty("pending_outreach_count", 0);
  });

  it("excludes filled and cancelled jobs from open_jobs", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      ;

    await getPipeline();

    const jobsSql = mockQuery.mock.calls[0][0] as string;
    expect(jobsSql).toContain("status NOT IN ('filled', 'cancelled')");
  });

  it("only returns draft outreach", async () => {
    mockQuery
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([]))
      ;

    await getPipeline();

    const outreachSql = mockQuery.mock.calls[3][0] as string;
    expect(outreachSql).toContain("od.status = 'draft'");
  });
});

describe("updateJobStatus", () => {
  it("returns error when job not found", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const result = await updateJobStatus("nonexistent", "filled");

    expect(result).toHaveProperty("error", "Job not found");
  });

  it("updates job status and returns updated row", async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([{ ...JOBS[0], status: "shortlisting" }]));

    const result = await updateJobStatus(TEST_JOB_IDS.auditor, "shortlisting");

    expect(result.status).toBe("shortlisting");
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("UPDATE jobs SET status = $1");
    expect(sql).toContain("WHERE id = $2");
    expect(mockQuery.mock.calls[0][1]).toEqual(["shortlisting", TEST_JOB_IDS.auditor]);
  });
});
