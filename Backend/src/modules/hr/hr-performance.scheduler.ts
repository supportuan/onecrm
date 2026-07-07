import { generatePerformanceReviewsFromConversion } from './hr.prisma.service.js';
import { getPreviousIsoWeekPeriod, getPreviousMonthPeriod } from './hr-period.js';

let schedulerStarted = false;

export const startHrPerformanceReviewScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;

  import('node-cron')
    .then(({ default: cron }) => {
      cron.schedule('0 6 * * 1', async () => {
        try {
          const { period, cycle } = getPreviousIsoWeekPeriod();
          const reviews = await generatePerformanceReviewsFromConversion({ period, cycle });
          console.log(
            `[HR] Weekly performance reviews generated for ${period} (${reviews.length} reviews)`
          );
        } catch (error: any) {
          console.error('[HR] Weekly review generation failed:', error?.message || error);
        }
      });

      cron.schedule('30 6 1 * *', async () => {
        try {
          const { period, cycle } = getPreviousMonthPeriod();
          const reviews = await generatePerformanceReviewsFromConversion({ period, cycle });
          console.log(
            `[HR] Monthly performance reviews generated for ${period} (${reviews.length} reviews)`
          );
        } catch (error: any) {
          console.error('[HR] Monthly review generation failed:', error?.message || error);
        }
      });

      console.log('[HR] Performance review scheduler started (weekly Mon 06:00, monthly 1st 06:30)');
    })
    .catch((error) => {
      console.warn('[HR] Performance review scheduler skipped:', error);
    });
};
