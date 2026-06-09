export const buildSocialMediaPostTemplate = (campaign: any) => {
  const details = campaign.launchDetails || {};

  const campaignName = campaign.name || 'Study Abroad Campaign';
  const country = details.targetCountry || 'your preferred country';

  const headline = `${campaignName} - Apply Now`;

  const primaryText =
    campaign.description ||
    `
Start your study abroad journey with expert admission guidance.

✅ University shortlisting
✅ Application support
✅ Visa guidance
✅ Scholarship guidance
✅ End-to-end counselling

Planning to study in ${country}? Our team can help you choose the right course and university.

Apply today and speak with our admissions team.
`.trim();

  return {
    headline,
    primaryText,
    ctaButtonText: details.ctaButtonText || 'LEARN_MORE',
    landingPageUrl:
      details.landingPageUrl ||
      process.env.DEFAULT_LANDING_PAGE_URL ||
      'https://applyuninow.com',
  };
};