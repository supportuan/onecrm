"use client";

import React from "react";

const services = [
  {
    title: "ApplyUniNow",
    description: "Study abroad admissions and university support",
    url: "https://applyuninow.com",
  },
  {
    title: "ApplyUniLoans",
    description: "Education loan assistance and financing solutions",
    url: "https://applyuniloans.com",
  },
  {
    title: "ApplyUniHomes",
    description: "Student accommodation and housing support",
    url: "https://applyunihomes.com",
  },
  {
    title: "ApplyUniJobs",
    description: "Student jobs and career support",
    url: "https://applyunijobs.com",
  },
  {
    title: "AUN Tech Consulting",
    description: "Technology consulting and software solutions",
    url: "https://auntechconsulting.com",
  },
  {
    title: "AdminConnects",
    description: "Study abroad admissions and university support",
    url: "https://adminconnects.com",
  },
  {
    title: "UniFeatures",
    description: "University information and student resources",
    url: "https://unifeatures.com",
  },
  {
    title: "InternationalStudentVisas",
    description: "Student visa guidance and documentation",
    url: "https://internationalstudentvisas.com",
  },
  {
    title: "AustraliaSkills",
    description: "Skills assessment and migration support",
    url: "https://australiaskills.com",
  },
  {
    title: "CanadaAdmits",
    description: "Canadian admissions and study support",
    url: "https://canadaadmits.com",
  },
  {
    title: "PikoPop",
    description: "Digital platform and online services",
    url: "https://pikopop.com",
  },
  {
    title: "DeFaComCon",
    description: "Designing Fashion Community Connect",
    url: "https://defacomcon.com",
  },

];

const AlliedServices = () => {
  const handleOpenService = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="mt-3 text-xl font-bold bg-gradient-to-r from-[#1a2b4c] via-[#2563eb] to-[#06b6d4] bg-clip-text text-transparent">
            One Platform. Multiple Services.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => (
            <button
              key={service.title}
              type="button"
              onClick={() => handleOpenService(service.url)}
              className="group flex cursor-pointer flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm transition-all duration-300 hover:scale-105 hover:bg-gray-50 hover:shadow-2xl w-full h-full"

            // className="group flex cursor-pointer flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:scale-105 hover:border-black hover:bg-gray-50 hover:shadow-2xl"
            >


              <h2 className="text-lg font-bold bg-gradient-to-r from-[#1a2b4c] via-[#2563eb] to-[#06b6d4] bg-clip-text text-transparent">
                {service.title}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-black">
                {service.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlliedServices;