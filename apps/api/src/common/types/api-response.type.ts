export type ApiResponseMeta = {
  path?: string;
  timestamp: string;
};

export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  meta: ApiResponseMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string | string[];
  };
  meta: ApiResponseMeta;
};
