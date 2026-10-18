export function pageCount(totalItems: number, pageSize: number) {
  if (pageSize < 1) throw new Error("pageSize must be at least 1");
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), Math.max(1, totalPages));
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
) {
  const totalPages = pageCount(items.length, pageSize);
  const currentPage = clampPage(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    totalItems: items.length,
  };
}
