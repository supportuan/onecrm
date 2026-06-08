/**
 * In-app channel adapter.
 *
 * The dispatcher always persists a Notification row (every channel, every
 * dispatch — including failures — so we get a clean audit trail). The
 * "delivery" for the IN_APP channel is just that DB row showing up in the
 * recipient's `/api/notifications` inbox / bell.
 *
 * This adapter therefore has nothing extra to do.
 */
export const sendInApp = async (): Promise<void> => {
  // intentional no-op
};
