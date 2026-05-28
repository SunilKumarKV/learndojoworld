import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PrismaModule } from "../../lib/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { CategoriesController } from "./categories.controller";
import { CoursesController } from "./courses.controller";
import { EnrollmentsController } from "./enrollments.controller";
import { CoursesService } from "./courses.service";

@Module({
  imports: [PrismaModule, JwtModule, AuthModule],
  controllers: [CategoriesController, CoursesController, EnrollmentsController],
  providers: [CoursesService],
})
export class CoursesModule {}
