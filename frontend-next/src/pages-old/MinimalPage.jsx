'use client';
const MinimalPage = ({ title, description }) => (
  <section className="w-auto rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
    <h1 className="text-xl font-semibold text-brand">{title}</h1>
    <p className="mt-2 text-sm text-neutral-600">{description}</p>
  </section>
);

export default MinimalPage;

