import { describe, expect, it } from "vitest";
import { paginate } from "./pagination";

describe("pagination", () => {
  it("returns the requested page and total information", () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({
      items: [3, 4],
      currentPage: 2,
      totalPages: 3,
      totalItems: 5,
    });
  });

  it("clamps invalid pages after filtering", () => {
    expect(paginate([1], 9, 3).currentPage).toBe(1);
  });

  it("rejects an invalid page size", () => {
    expect(() => paginate([1], 1, 0)).toThrow("pageSize must be at least 1");
  });
});
