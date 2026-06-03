import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PrismaModule } from "../../lib/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { CreatorsController } from "./creators.controller";
import { CreatorsService } from "./creators.service";

@Module({
  imports: [PrismaModule, JwtModule, AuthModule],
  controllers: [CreatorsController],
  providers: [CreatorsService],
})
export class CreatorsModule {}
