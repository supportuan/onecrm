import authFetch from "@/lib/api";

const API_URL = "/api/countries";

export const getAvailableCountries = async () => {
  const res = await authFetch(`${API_URL}/available`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to load countries");
  }

  return data;
};