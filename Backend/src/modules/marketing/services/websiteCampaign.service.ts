export const execute = async (campaign: any, leads: any[]) => {
  console.log(`[Website Campaign Service] Launching campaign: ${campaign.name} on website`);
  // Stub: Simulate publishing campaign content to a landing page or promotions widget
  return {
    success: true,
    channel: 'WEBSITE',
    leadsProcessed: leads.length,
    details: {
      publishedUrl: `/promotions/mock-campaign-${campaign.id}`,
      status: 'PUBLISHED_LIVE',
    }
  };
};
