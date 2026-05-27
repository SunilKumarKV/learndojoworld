import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { AuthenticatedUser } from "../types/authenticated-user.type";

type RequestWithUser = {
  user?: AuthenticatedUser;
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithUser>();

  return request.user;
});
