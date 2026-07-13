import { IMeta } from '../interfaces';
import { OptionalNumberType } from '../types';

export interface PaginationInput {
  page?: number;
  take?: number;
}

export const getPaginationQuery = (page?: number, take?: number) => {
  if (page && take) {
    return { skip: (page - 1) * take, take };
  }
  return {};
};

export const generateTakeSkip = (pagination?: PaginationInput) => {
  let skip: OptionalNumberType = undefined;
  let take: OptionalNumberType = undefined;

  if (
    typeof pagination?.page === 'number' &&
    typeof pagination?.take === 'number'
  ) {
    take = pagination.take;
    skip = (Number(pagination.page) - 1) * Number(take);
  }
  return { take, skip };
};

/** Builds the standard pagination meta object. */
export const buildMeta = (
  totalItems: number,
  page: number,
  take: number,
): IMeta => {
  const totalPages = take > 0 ? Math.ceil(totalItems / take) : 0;
  return {
    page,
    take,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
