import { IUpdateResult } from '../interfaces';
import { UserRoleENUM } from '../enums';

export type OrderType = 'ASC' | 'DESC';
export type OptionalNumberType = number | null | undefined;
export type PlainErrMsgType = string;
export type ListErrMsgType = string[];
export type ObjectErrMsgType = Record<'message', string | string[]>;
export type UpdateResultType = IUpdateResult;
export type AsyncUpdateResultType = Promise<IUpdateResult>;

export interface LoggedInUser {
  id: string;
  fullname: string;
  email: string;
  position?: string;
  role?: UserRoleENUM;
}
