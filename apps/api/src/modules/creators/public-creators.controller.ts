import { Controller, Get, Param } from "@nestjs/common";

import { CreatorsService } from "./creators.service";

@Controller("public/creators")
export class PublicCreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get(":username")
  getPublicCreator(@Param("username") username: string) {
    return this.creatorsService.getPublicCreator(username);
  }
}
