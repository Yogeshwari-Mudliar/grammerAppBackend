import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { seedDatabase } from './database.seed';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,

  entities: [
    __dirname + '/../**/*.entity{.ts,.js}',
  ],

  ssl: {
    rejectUnauthorized: false,
  },

  synchronize: false,
});

async function runSeed() {
  try {
    await dataSource.initialize();

    console.log('🌱 Database connected');

    await seedDatabase(dataSource);

    console.log('🎉 Seed completed successfully');

    await dataSource.destroy();

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    process.exit(1);
  }
}

runSeed();