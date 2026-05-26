import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Project, Endpoint, AuthConfig } from '../models/project.model';

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  body: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  async execute(project: Project, endpoint: Endpoint): Promise<ApiResponse> {
    const start = Date.now();

    let authToken: string | null = null;
    if (project.auth.type === 'bearer' && project.auth.bearerToken) {
      authToken = project.auth.bearerToken;
    } else if (project.auth.type === 'login') {
      authToken = await this.getToken(project.auth);
    }

    const baseUrl = project.baseUrl.replace(/\/$/, '');
    const path = endpoint.path.startsWith('/') ? endpoint.path : '/' + endpoint.path;
    let url = baseUrl + path;

    const headers: { [key: string]: string } = {};
    endpoint.headers.filter(h => h.enabled && h.key).forEach(h => (headers[h.key] = h.value));
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const activeParams = endpoint.params.filter(p => p.enabled && p.key);
    if (activeParams.length > 0) {
      const search = new URLSearchParams();
      activeParams.forEach(p => search.append(p.key, p.value));
      url += '?' + search.toString();
    }

    let body: any = null;
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      if (endpoint.bodyType === 'json') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        try { body = JSON.parse(endpoint.bodyJson || '{}'); } catch { body = {}; }
      } else if (endpoint.bodyType === 'form-data') {
        const fd = new FormData();
        (endpoint.bodyFormData || []).filter(p => p.enabled && p.key).forEach(p => fd.append(p.key, p.value));
        body = fd;
      } else if (endpoint.bodyType === 'params') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const sp = new URLSearchParams();
        (endpoint.bodyParams || []).filter(p => p.enabled && p.key).forEach(p => sp.append(p.key, p.value));
        body = sp.toString();
      }
    }

    return new Promise((resolve, reject) => {
      this.http.request(endpoint.method, url, {
        headers: new HttpHeaders(headers),
        body,
        observe: 'response',
        responseType: 'text',
      }).subscribe({
        next: (res: HttpResponse<string>) => {
          const duration = Date.now() - start;
          const responseHeaders: { [key: string]: string } = {};
          res.headers.keys().forEach(k => (responseHeaders[k] = res.headers.get(k) || ''));
          resolve({ status: res.status, statusText: res.statusText, headers: responseHeaders, body: res.body || '', duration });
        },
        error: (err) => {
          const duration = Date.now() - start;
          if (err.status !== undefined) {
            resolve({ status: err.status, statusText: err.statusText || 'Error', headers: {}, body: err.error || err.message || '', duration });
          } else {
            reject(err);
          }
        },
      });
    });
  }

  async getToken(auth: AuthConfig): Promise<string | null> {
    if (!auth.loginUrl) return null;
    const body: Record<string, string> = {};
    if (auth.usernameField && auth.username) body[auth.usernameField] = auth.username;
    if (auth.passwordField && auth.password) body[auth.passwordField] = auth.password;

    const req = auth.loginMethod === 'GET'
      ? this.http.get(auth.loginUrl)
      : this.http.post(auth.loginUrl, body);

    return new Promise(resolve => {
      req.subscribe({
        next: (res: any) => resolve(this.extractValue(res, auth.tokenPath || '') ? String(this.extractValue(res, auth.tokenPath || '')) : null),
        error: () => resolve(null),
      });
    });
  }

  async testLogin(auth: AuthConfig): Promise<string> {
    if (!auth.loginUrl) return 'URL de login não configurada.';
    const body: Record<string, string> = {};
    if (auth.usernameField && auth.username) body[auth.usernameField] = auth.username;
    if (auth.passwordField && auth.password) body[auth.passwordField] = auth.password;

    const req = auth.loginMethod === 'GET'
      ? this.http.get(auth.loginUrl, { observe: 'response', responseType: 'text' })
      : this.http.post(auth.loginUrl, body, { observe: 'response', responseType: 'text' });

    return new Promise(resolve => {
      req.subscribe({
        next: (res: any) => {
          try { resolve(JSON.stringify(JSON.parse(res.body || ''), null, 2)); } catch { resolve(res.body || ''); }
        },
        error: (err) => resolve(`Erro ${err.status}: ${err.error || err.message}`),
      });
    });
  }

  private extractValue(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}
