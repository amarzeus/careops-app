import { test as base } from "@playwright/test";

type BaseFixtures = {
  // Add common fixtures here (db, auth, etc.)
  seedData: (data: unknown) => Promise<unknown>;
};

export const test = base.extend<BaseFixtures>({
  seedData: async ({ request: _request }, runFixture) => {
    // Placeholder for seeding logic
    await runFixture(async (data) => {
      console.log("Seeding data:", data);
      return data;
    });
  },
});

export { expect } from "@playwright/test";
