export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuthType = 'none' | 'bearer' | 'login';
export type BodyType = 'none' | 'json' | 'form-data' | 'params';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  loginUrl?: string;
  loginMethod?: 'POST' | 'GET';
  usernameField?: string;
  username?: string;
  passwordField?: string;
  password?: string;
  tokenPath?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  statusText: string;
  duration: number;
  responseBody: string;
  responseHeaders: { [key: string]: string };
}

export interface Endpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  bodyType: BodyType;
  bodyJson?: string;
  bodyFormData?: KeyValuePair[];
  bodyParams?: KeyValuePair[];
  variables?: { [key: string]: string };
  history?: HistoryEntry[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  auth: AuthConfig;
  endpoints: Endpoint[];
}
