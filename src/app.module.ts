import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { getThrottlerModuleOptions } from './config/throttle-options';
import { OrderModule } from './order/order.module';
import { ProductModule } from './product/product.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    AuthModule,
    OrderModule,
    ProductModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      useFactory: () => getThrottlerModuleOptions(),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
