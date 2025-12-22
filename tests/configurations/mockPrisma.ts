import { vi, type Mock } from 'vitest';
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@prismaClient';

/**
 * Creates a deep mock Prisma client using vitest-mock-extended.
 * This is required for Vitest 4.0+ which validates vi.spyOn() targets are functions.
 * Prisma uses Proxy objects where methods don't exist until accessed.
 *
 * vitest-mock-extended handles all the complexity of mocking Prisma's nested structure.
 *
 * @returns A deep mock of PrismaClient with all methods mocked
 */
export function createMockPrisma(): DeepMockProxy<PrismaClient> {
  return mockDeep<PrismaClient>();
}

/**
 * Creates a spy on a Prisma method for Vitest 4.0+.
 *
 * Vitest 4.0 changed how vi.spyOn works - it now validates that the method
 * is an own property descriptor. Prisma Client uses Proxies, so methods like
 * prisma.job.findMany don't have own property descriptors - they're accessed
 * through Proxy get traps.
 *
 * This function works around the limitation by:
 * 1. Validating the original method exists and is a function
 * 2. Replacing it with a vi.fn() mock that can be controlled in tests
 * 3. Returning the mock function for assertions
 *
 * @param target - The Prisma model (e.g., prisma.job)
 * @param method - The method name (e.g., 'findMany')
 * @returns A vi.fn() mock that replaces the original method
 *
 * @example
 * ```ts
 * const findManySpy = createPrismaSpy(prisma.job, 'findMany');
 * findManySpy.mockRejectedValueOnce(new Error('DB error'));
 * ```
 */
export const createPrismaSpy = <T extends object, K extends keyof T>(target: T, method: K): Mock => {
  const original = target[method];

  if (typeof original !== 'function') {
    throw new TypeError(`Cannot spy on '${String(method)}': property is not a function`);
  }

  const mockFn = vi.fn();

  Object.defineProperty(target, method, {
    value: mockFn,
    writable: true,
    configurable: true,
  });

  return mockFn;
};
