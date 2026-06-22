import { PaginationMeta } from "./pagination-meta.interface";

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}