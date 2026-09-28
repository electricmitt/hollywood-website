// Church contact details and service times, shared across the site.

const ADDRESS_QUERY = "4931 SW 20th Street, West Park, FL 33023";

export const CHURCH = {
  email: "hollywoodtabernacle1@gmail.com",
  addressLine1: "4931 SW 20th Street",
  addressLine2: "West Park, FL 33023",
  mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(ADDRESS_QUERY)}`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS_QUERY)}`,
  mapsEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_QUERY)}&output=embed`,
  youtubeUrl: "https://www.youtube.com/@hollywoodtabernacle",
  facebookUrl: "https://www.facebook.com/profile.php?id=100070361948296",
  youversionUrl: "https://www.bible.com/organizations/28dd611b-8c4e-4622-9d13-2d2d5777be88",
};

export const SERVICE_TIMES = [
  { label: "Friday Evening", time: "7:30 PM" },
  { label: "Saturday", time: "10:00 AM – Sundown" },
];

/** mailto: link to the church, optionally with a subject line. */
export const emailLink = (subject?: string) =>
  `mailto:${CHURCH.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
