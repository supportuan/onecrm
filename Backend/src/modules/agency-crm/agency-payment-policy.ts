/**
 * Agents may create and verify fee payments for referred students when
 * AgencyPartner.capabilities.canPayFees is enabled. Refunds and other
 * payment mutations remain staff-only (no agent routes exist for them).
 */

export const AGENT_PAYMENT_ACTIONS = ['create-order', 'verify'] as const;
export type AgentPaymentAction = (typeof AGENT_PAYMENT_ACTIONS)[number];

export const isAgentPaymentActionAllowed = (action: string): action is AgentPaymentAction =>
  (AGENT_PAYMENT_ACTIONS as readonly string[]).includes(action);

export const assertAgentPaymentAction = (action: string): AgentPaymentAction => {
  if (!isAgentPaymentActionAllowed(action)) {
    throw new Error('agents cannot perform this payment action');
  }
  return action;
};
