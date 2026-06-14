/**
 * Shared API request/response shapes.
 * Components depend on these types — never on raw HTTP response shapes.
 */

export interface ApiError {
  status:  number;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data:       T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  data:    T;
  message?: string;
}

export interface QueryParams {
  page?:     number;
  pageSize?: number;
  search?:   string;
  sortBy?:   string;
  sortDir?:  'asc' | 'desc';
  [key: string]: unknown;
}
