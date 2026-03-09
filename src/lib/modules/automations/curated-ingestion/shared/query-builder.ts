export function buildCuratedLeadQueries(input: {
  city: string;
  province: string;
  sportSlug: string;
}) {
  const sport = input.sportSlug.trim().toLowerCase();
  const city = input.city.trim();
  const province = input.province.trim();

  return [
    `${sport} courts in ${province} ${city}`,
    `${sport} court ${city} ${province}`,
    `${sport} reservations ${city} ${province}`,
    `${sport} booking ${city} ${province}`,
    `site:facebook.com ${sport} ${city} ${province}`,
  ];
}
