import { Controller, Get } from "@nestjs/common";

import { CoursesService } from "./courses.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  getCategories() {
    return this.coursesService.getCategories();
  }
}
