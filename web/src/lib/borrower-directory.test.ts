import { describe, expect, it } from "vitest";
import {
  filterBorrowerDirectory,
  maskGhanaCard,
  type BorrowerDirectoryRecord,
} from "./borrower-directory";

const records: BorrowerDirectoryRecord[] = [
  {
    id: "1",
    customerId: "CUS-0104",
    legalName: "Abena Boateng",
    phone: "+233240000104",
    maskedGhanaCard: "GHA-••••••104",
    ghanaCardVerified: true,
    status: "ACTIVE",
    groupName: "Osu Market Circle",
    groupNumber: "GRP-0018",
    loanNumber: "LN-0204",
    loanStatus: "ACTIVE",
    branchName: "Kasoa Market",
    isSampleData: true,
  },
  {
    id: "2",
    customerId: "CUS-0208",
    legalName: "Daniel Tetteh",
    phone: "+233240000208",
    maskedGhanaCard: "GHA-••••••208",
    ghanaCardVerified: false,
    status: "RESTRICTED",
    groupName: null,
    groupNumber: null,
    loanNumber: null,
    loanStatus: null,
    branchName: "Kasoa Market",
    isSampleData: true,
  },
];

describe("borrower directory", () => {
  it("masks Ghana Card values", () => {
    expect(maskGhanaCard("GHA-100000104-1")).toBe("GHA-••••••4-1");
  });

  it("combines search and directory filters", () => {
    expect(
      filterBorrowerDirectory(records, {
        query: "Daniel",
        status: "RESTRICTED",
        verification: "PENDING",
        membership: "UNGROUPED",
        loan: "NONE",
      }).map((record) => record.customerId),
    ).toEqual(["CUS-0208"]);
  });
});
