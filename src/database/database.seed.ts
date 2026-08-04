import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/users.entity';
import { UserRole } from '../common/enums/user-role.enum';

export async function seedDatabase(
  dataSource: DataSource,
) {
  // ============================
  // Clear All Tables
  // ============================

  await dataSource.query(`
    TRUNCATE TABLE
      lesson_progress,
      quiz_attempts,
      quiz_questions,
      quiz_options,
      quizzes,
      lesson_activities,
      lesson_examples,
      lesson_sections,
      lessons,
      grammar_sections,
      grammar_lessons,
      grammar_courses,
      users
    RESTART IDENTITY CASCADE;
  `);

  const repo = dataSource.getRepository(User);

  const password = await bcrypt.hash('Admin@123', 10);

  await repo.save([
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@grammar.com',
      mobile: '9999999991',
      password,
      role: UserRole.ADMIN,
      emailVerified: true,
      mobileVerified: true,
      isActive: true,
    },
    {
      firstName: 'Teacher',
      lastName: 'User',
      email: 'teacher@grammar.com',
      mobile: '9999999992',
      password,
      role: UserRole.TEACHER,
      emailVerified: true,
      mobileVerified: true,
      isActive: true,
    },
    {
      firstName: 'Student',
      lastName: 'User',
      email: 'student@grammar.com',
      mobile: '9999999993',
      password,
      role: UserRole.STUDENT,
      emailVerified: true,
      mobileVerified: true,
      isActive: true,
    },
  ]);

  console.log('✅ Database Seeded Successfully');
}