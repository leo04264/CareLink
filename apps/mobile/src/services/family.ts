import type {
  CreateFamilyResponse,
  ElderSummary,
  GetFamilyResponse,
} from '@carelink/shared';
import { apiRequest } from './apiClient';

// Caregiver-side family + elder management. Used by the auto-bootstrap
// flow on first login (commit 3) and by future settings screens.
//
// There's no "list my families" endpoint (spec deliberately keeps the
// JWT minimal — only sub + type + role). The bootstrap caller is
// responsible for caching familyId in storage after createFamily; we
// just expose the raw CRUD here.

export async function createFamily(name: string): Promise<CreateFamilyResponse> {
  return apiRequest<CreateFamilyResponse>('/family', {
    method: 'POST',
    body: { name },
  });
}

export async function getFamily(familyId: string): Promise<GetFamilyResponse> {
  return apiRequest<GetFamilyResponse>(`/family/${familyId}`);
}

export async function createElder(
  familyId: string,
  input: { name: string; birthDate?: string },
): Promise<ElderSummary> {
  return apiRequest<ElderSummary>(`/family/${familyId}/elders`, {
    method: 'POST',
    body: input,
  });
}
