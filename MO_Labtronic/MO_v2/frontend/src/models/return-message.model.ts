export interface ReturnMessage<T = any> {
  success: boolean;
  msg?: string;
  data?: T;
  error?: PbErrorResponse<T>;
}

interface PbValidationError {
  code: string;
  message: string;
}

export interface PbErrorResponse<T> {
  status: number;
  message: string;
  data: Partial<Record<keyof T, PbValidationError>>;
}
