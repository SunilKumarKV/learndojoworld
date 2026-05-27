import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard, UsersService],
})
export class UsersModule {}
