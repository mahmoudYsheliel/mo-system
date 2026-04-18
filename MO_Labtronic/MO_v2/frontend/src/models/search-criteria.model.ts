export interface SortCriteria {
  field: string;
  order: "DESC" | "ASC";
}
export interface FilterCriteria {
  field: string;
  criteria: FilterType;
  value: string;
}

export type FilterType =
  | "eq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not contains";
export function mapFilterTypeToPB(filter: FilterType) {
  switch (filter) {
    case "eq":
      return "=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "contains":
      return "~";
    case "not contains":
      return "!~";
  }
}

export class SearchCriteriaModel {
  page: number = 1;
  perPage: number = 10e6;
  sort: SortCriteria[] = [{ field: "updated", order: "DESC" }];
  filter: FilterCriteria[] = [];
  filterJoinMethod: '||' | '&&' = '&&'
  expand: string[] = [];
  fields: string[] = [];

  constructor(params?: Partial<SearchCriteriaModel>) {
    Object.assign(this, params || {});
  }

  getJsonString() {
    const page = this.page;
    const perPage = this.perPage;
    const sort = this.sort
      .map((sc) => (sc.order === "ASC" ? `+${sc.field}` : `-${sc.field}`))
      .join(",");
    // Pocket base filter method: ?filter=(id='abc' && created>'2022-01-01')
    const filter = this.filter.length
      ? `(${this.filter
          .map(
            (fc) => `${fc.field}${mapFilterTypeToPB(fc.criteria)} '${fc.value}'`
          )
          .join(this.filterJoinMethod)})`
      : "";

    const expand = this.expand.join(",");
    const fields = this.fields.join(",");

    return { page, perPage, sort, filter, expand, fields };
  }
}
