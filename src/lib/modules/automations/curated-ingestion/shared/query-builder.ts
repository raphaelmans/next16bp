export interface CuratedLeadQueryPlan {
  primary: string[];
  fallback: string[];
}

export function buildCuratedLeadQueryPlan(input: {
  city: string;
  province: string;
  sportSlug: string;
}): CuratedLeadQueryPlan {
  const sport = input.sportSlug.trim().toLowerCase();
  const city = input.city.trim();
  const province = input.province.trim();

  return {
    primary: [
      `${sport} courts in ${province} ${city}`,
      `${sport} court ${city} ${province}`,
      `courts in ${city} ${province} ${sport}`,
      `sports center ${city} ${province} ${sport}`,
      `${sport} club ${city} ${province}`,
      `${sport} reservations ${city} ${province}`,
    ],
    fallback: [
      `site:facebook.com ${sport} ${city} ${province}`,
      `site:instagram.com ${sport} ${city} ${province}`,
      `dink ${city} ${sport}`,
    ],
  };
}
