export type QueryParamRecord = Record<string, string | undefined | null>;

export class URLQueryBuilder {
  private searchParams: URLSearchParams;

  constructor() {
    this.searchParams = new URLSearchParams();
  }

  static startQuery(searchParams: string) {
    return `?${searchParams}`;
  }

  addParams(values: QueryParamRecord) {
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        this.searchParams.append(key, value);
      }
    }
    return this;
  }

  build() {
    return this.searchParams.toString();
  }

  buildWithStartQuery() {
    return URLQueryBuilder.startQuery(this.build());
  }

  buildWholeUrl(url: string) {
    return `${url}${this.buildWithStartQuery()}`;
  }
}
