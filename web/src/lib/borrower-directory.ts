export type BorrowerDirectoryRecord = {
  id: string;
  customerId: string;
  legalName: string;
  phone: string;
  maskedGhanaCard: string;
  ghanaCardVerified: boolean;
  status: "ACTIVE" | "RESTRICTED";
  groupName: string | null;
  groupNumber: string | null;
  loanNumber: string | null;
  loanStatus: string | null;
  branchName: string;
  isSampleData: boolean;
};

export type BorrowerDirectoryFilters = {
  query: string;
  status: string;
  verification: string;
  membership: string;
  loan: string;
};

export function maskGhanaCard(value: string) {
  const prefix = value.slice(0, 4);
  const suffix = value.slice(-3);
  return `${prefix}••••••${suffix}`;
}

export function filterBorrowerDirectory(
  records: readonly BorrowerDirectoryRecord[],
  filters: BorrowerDirectoryFilters,
) {
  const query = filters.query.trim().toLowerCase();
  return records.filter((record) => {
    const searchable = [
      record.customerId,
      record.legalName,
      record.phone,
      record.groupName,
      record.groupNumber,
      record.loanNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      searchable.includes(query) &&
      (filters.status === "ALL" || record.status === filters.status) &&
      (filters.verification === "ALL" ||
        (filters.verification === "VERIFIED") === record.ghanaCardVerified) &&
      (filters.membership === "ALL" ||
        (filters.membership === "GROUPED") === Boolean(record.groupName)) &&
      (filters.loan === "ALL" ||
        (filters.loan === "NONE"
          ? record.loanStatus === null
          : record.loanStatus === filters.loan))
    );
  });
}
