export interface ReturnMessage {
  success: boolean;
  msg: string;
  data:  Record<string, any> | any | null;
}

