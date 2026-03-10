export interface CuratedLeadQueryPlan {
  primary: string[];
  knownDomain: string[];
  fallback: string[];
}

export function buildCuratedLeadQueryPlan(input: {
  city: string;
  province: string;
  sportSlug: string;
  knownDomainQueries?: string[];
}): CuratedLeadQueryPlan {
  const sport = input.sportSlug.trim().toLowerCase();
  const city = input.city.trim();
  const province = input.province.trim();

  return {
    primary: [
      `${sport} courts in ${province} ${city}`,
      `${sport} court ${city} ${province}`,
      `${city} ${sport}`,
      `courts in ${city} ${province} ${sport}`,
      `sports center ${city} ${province} ${sport}`,
      `${sport} club ${city} ${province}`,
      `${sport} reservations ${city} ${province}`,
    ],
    knownDomain: input.knownDomainQueries ?? [],
    fallback: [
      `site:pickleheads.com ${sport} ${city} ${province}`,
      `site:playtimescheduler.com ${sport} ${city} ${province}`,
      `site:app.court-access.com ${sport} ${city} ${province}`,
      `dink ${city} ${sport}`,
    ],
  };
}
