/**
 * Term types shared between frontend and backend
 */

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CreateTermDto {
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UpdateTermDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

