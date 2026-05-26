import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  getHealth() {
    return {
      service: "learndojoworld-api",
      status: "ok",
      uptime: process.uptime(),
    };
  }
}
