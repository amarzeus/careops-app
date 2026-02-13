import { test as base } from '@playwright/test';

type BaseFixtures = {
  // Add common fixtures here (db, auth, etc.)
  seedData: (data: any) => Promise<any>;
};

export const test = base.extend<BaseFixtures>({
  seedData: async ({ request }, use) => {
    // Placeholder for seeding logic
    await use(async (data) => {
      console.log('Seeding data:', data);
      return data;
    });
  },
});

export { expect } from '@playwright/test';
