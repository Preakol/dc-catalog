export type DataSource = 'api' | 'browser';

export interface Environment {
  /** 'api' talks to the local mock API; 'browser' keeps the catalogue in localStorage. */
  dataSource: DataSource;
  apiUrl: string;
  heroesApiUrl: string;
  stripePublishableKey: string;
}
