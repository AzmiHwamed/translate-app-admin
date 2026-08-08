export interface ApiResponse<T> {
  status_code: number;
  title: string;
  body: string;
  data: T;
}