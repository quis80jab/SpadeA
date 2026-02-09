import { LawyerResponse } from '@/src/state/types';
import { callLawyer } from './agentRouter';

export async function getLawyerResponse(
  userMessage: string,
  surrender: boolean = false
): Promise<LawyerResponse> {
  const json = await callLawyer(userMessage, surrender);
  const data = JSON.parse(json) as LawyerResponse;

  if (!data.message) {
    throw new Error('Invalid lawyer response: missing message');
  }

  return {
    message: data.message,
    updated_points: data.updated_points ?? [],
    fallacies_identified: data.fallacies_identified ?? [],
    assumptions_challenged: data.assumptions_challenged ?? [],
    intensity_level: Math.min(10, Math.max(1, data.intensity_level ?? 3)),
    damage_to_attorney: Math.min(25, Math.max(0, data.damage_to_attorney ?? 5)),
    damage_to_defendant: Math.min(25, Math.max(0, data.damage_to_defendant ?? 5)),
  };
}
