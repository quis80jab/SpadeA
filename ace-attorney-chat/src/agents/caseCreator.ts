import { CaseData } from '../state/types';
import { callCaseCreator } from './agentRouter';

export async function generateCase(): Promise<CaseData> {
  const json = await callCaseCreator();
  const data = JSON.parse(json) as CaseData;

  // Validate required fields
  if (!data.title || !data.charge || !data.context) {
    throw new Error('Invalid case data: missing required fields');
  }
  if (
    !data.attorney_points ||
    !data.defendant_points ||
    data.attorney_points.length === 0 ||
    data.defendant_points.length === 0
  ) {
    throw new Error('Invalid case data: missing argument points');
  }
  if (!data.opening_statement) {
    throw new Error('Invalid case data: missing opening statement');
  }

  // Ensure all points have correct status
  data.attorney_points = data.attorney_points.map((p) => ({
    ...p,
    status: p.status || 'unchallenged',
  }));
  data.defendant_points = data.defendant_points.map((p) => ({
    ...p,
    status: p.status || 'unchallenged',
  }));

  return data;
}
