import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LessonsModule } from './lessons/lessons.module';
import { ProgressModule } from './progress/progress.module';
import { QuizModule } from './quiz/quiz.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GrammarModule } from './grammar/grammar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],

    //   useFactory: (config: ConfigService) => ({
    //     type: 'postgres',

    //     host: config.get<string>('DB_HOST', 'localhost'),

    //     port: config.get<number>('DB_PORT', 5432),

    //     username: config.get<string>('DB_USERNAME', 'postgres'),

    //     password: config.get<string>('DB_PASSWORD', 'postgres123'),

    //     database: config.get<string>('DB_NAME', 'learning-1'),

    //     autoLoadEntities: true,

    //     synchronize:
    //       config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
    //   }),
    // }),
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],

  useFactory: (config: ConfigService) => ({
    type: 'postgres',

    url: config.get<string>('DATABASE_URL'),

    autoLoadEntities: true,

    synchronize:
      config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',

    ssl: {
      rejectUnauthorized: false,
    },
  }),
}),
    UsersModule,

    AuthModule,

    LessonsModule,

    ProgressModule,

    QuizModule,

    DashboardModule,

    GrammarModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}