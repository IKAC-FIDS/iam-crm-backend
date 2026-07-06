export class ImportResultDto {
  totalRows: number;
  successful: number;
  failed: number;
  errors: {
    row: number;
    message: string;
  }[];
  summary: {
    companiesCreated: number;
    peopleCreated: number;
  };
}