/**
 * Creates a mock Prisma error for testing purposes.
 * Default message is 'Database error'.
 * The error is marked with a custom property to simulate a Prisma error.
 * @returns A mock Prisma error.
 */
export function createMockPrismaError(): Error {
  const error = new Error('Database error');
  // @ts-expect-error using this flag to mark the error as a Prisma error
  error.isPrismaError = true;
  return error;
}

/**
 * Creates a mock unknown database error for testing purposes.
 * Default message is 'Database error'.
 * The error is not marked as a Prisma error.
 * @returns A mock unknown database error.
 */
export function createMockUnknownDbError(): Error {
  const error = new Error('Database error');
  // @ts-expect-error using this flag to explicitly mark the error as NOT a Prisma error
  error.isPrismaError = false;
  return error;
}
