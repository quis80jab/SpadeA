import { LawyerResponse } from '../state/types';
import { callLawyer } from './agentRouter';

export async function getLawyerResponse(
  userMessage: string,
  surrender: boolean = false
): Promise<LawyerResponse> {
  const json = await callLawyer(userMessage, surrender);
  const data = JSON.parse(json) as LawyerResponse;

  // Validate and set defaults
  if (!data.message) {
    throw new Error('Invalid lawyer response: missing message');
  }

  return {
    message: data.message,
    updated_points: data.updated_points ?? [],
    fallacies_identified: data.fallacies_identified ?? [],
    assumptions_challenged: data.assumptions_challenged ?? [],
    intensity_level: Math.min(10, Math.max(1, data.intensity_level ?? 3)),
  };
}
