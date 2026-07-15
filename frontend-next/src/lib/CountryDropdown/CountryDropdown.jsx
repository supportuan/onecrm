"use client";

import { useEffect, useState } from "react";
import { getAvailableCountries } from "@/services/countryApi";

const DEFAULT_CLASS_NAME =
    "w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition focus:border-[#0084ff] focus:outline-none focus:ring-2 focus:ring-[#0084ff]/20 disabled:cursor-not-allowed disabled:opacity-60";

const CountryDropdown = ({
    value = "",
    onChange,
    placeholder = "Select country",
    disabled = false,
    required = false,
    className = "",
    id,
    name,
}) => {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        const loadCountries = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getAvailableCountries();

                const list = Array.isArray(response?.data)
                    ? response.data
                    : [];

                if (mounted) {
                    setCountries(list);
                }
            } catch (err) {
                console.error("Failed to load countries:", err);

                if (mounted) {
                    setCountries([]);
                    setError(err?.message || "Failed to load countries");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadCountries();

        return () => {
            mounted = false;
        };
    }, []);

    const handleChange = (event) => {
        const selectedId = event.target.value;

        const selectedCountry =
            countries.find(
                (country) => String(country.id) === selectedId
            ) || null;

        onChange?.(selectedCountry);
    };

    return (
        <div className="space-y-1">
            <select
                id={id}
                name={name}
                value={value ? String(value) : ""}
                onChange={handleChange}
                disabled={disabled || loading}
                required={required}
                className={className || DEFAULT_CLASS_NAME}
            >
                <option value="">
                    {loading ? "Loading countries..." : placeholder}
                </option>

                {countries.map((country) => (
                    <option
                        key={country.id}
                        value={String(country.id)}
                    >
                        {country.name}
                    </option>
                ))}
            </select>

            {error && (
                <p className="text-xs font-medium text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

export default CountryDropdown;