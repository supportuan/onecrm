'use client';

import MinimalPage from './MinimalPage';

const formatTitle = (value) =>
  value
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const SectionPage = ({ section }) => {
  const { subpage } = useParams();
  const title = subpage ? formatTitle(subpage) : section;

  return (
    <MinimalPage
      title={title}
      description={`Manage ${title.toLowerCase()} within ${section}.`}
    />
  );
};

export default SectionPage;

