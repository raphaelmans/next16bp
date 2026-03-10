export function buildFacebookPageLeadQueries(input: {
  city: string;
  province: string;
  sportSlug: string;
}) {
  const sport = input.sportSlug.trim().toLowerCase();
  const city = input.city.trim();
  const province = input.province.trim();

  return [
    `site:facebook.com ${sport} ${city} ${province}`,
    `site:facebook.com "${city}" "${province}" "${sport}"`,
    `site:facebook.com "${city}" "${sport} club"`,
    `site:facebook.com "${city}" "${sport} court"`,
    `site:facebook.com "${province}" "${sport}"`,
  ];
}
