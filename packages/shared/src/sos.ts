import type { ISODate } from './family';

export interface SosLocation {
  lat: number;
  lng: number;
}

export interface CreateSosRequest {
  location?: SosLocation;
}

export interface SosEventRecord {
  id: string;
  triggeredAt: ISODate;
  acknowledgedAt: ISODate | null;
  acknowledgedBy: { id: string; name: string } | null;
  location: SosLocation | null;
}

export interface CreateSosResponse {
  id: string;
  triggeredAt: ISODate;
  notifiedMembers: { userId: string; name: string }[];
}

export interface SosHistoryMeta {
  page: number;
  limit: number;
  total: number;
}

export interface SosHistoryResponse {
  items: SosEventRecord[];
  meta: SosHistoryMeta;
}
