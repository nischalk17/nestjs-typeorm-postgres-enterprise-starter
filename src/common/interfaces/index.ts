import { HttpStatus } from '@nestjs/common';
import { UserRoleENUM } from '../enums';

export interface IUpdateResult {
  message: string;
}

export interface IProcInterMediateResponse<T> {
  in_out_response_status: 1 | 0;
  in_out_response_message: string;
  in_out_response_data: T;
}

export interface JwtPayload {
  sub: string;
  userId: string;
  email: string;
  role: UserRoleENUM;
}

export interface IMeta {
  page: number;
  take: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ISuccessResponse<T> {
  status: HttpStatus;
  message: string;
  data: T;
}

export interface ISuccessResponseMultiple<T> {
  status: HttpStatus;
  message: string;
  data: T[];
  meta: IMeta;
}

export interface IErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors: string[];
  path?: string;
  timestamp?: string;
}
