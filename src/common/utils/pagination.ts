export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Converts 1-based page / pageSize parameters into Prisma's take / skip values.
 * @param page - 1-based page number (defaults to 1)
 * @param pageSize - Number of items per page (defaults to DEFAULT_PAGE_SIZE)
 * @returns Object containing `take` and `skip` values for Prisma queries
 */
export function paginationParamsToTakeAndSkip(page: number = DEFAULT_PAGE, pageSize: number = DEFAULT_PAGE_SIZE): { take: number; skip: number } {
  const skip = (page - 1) * pageSize;
  return { take: pageSize, skip };
}
