import { readEventStream } from './builder/event-stream.js';

export class GatewayError extends Error {
  constructor(message, { status = 0, code = '', details = null } = {}) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const SIGNED_PREVIEW_TTL = '24h';

export class ClankGateway {
  constructor(baseURL, accessToken, fetcher = fetch) {
    if (!baseURL || !accessToken) throw new Error('Gateway URL and access token are required.');
    this.baseURL = baseURL.replace(/\/$/, '');
    this.accessToken = accessToken;
    this.fetcher = fetcher;
  }

  async request(path, { method = 'GET', body, signal } = {}) {
    const headers = { Authorization: `Bearer ${this.accessToken}` };
    const init = { method, headers, signal };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await this.fetcher(`${this.baseURL}${path}`, init);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new GatewayError(`Could not reach your Clank gateway: ${error}`);
    }

    if (response.status === 204) return undefined;
    const contentType = response.headers.get('content-type') || '';
    const value = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '');

    if (!response.ok) {
      const message = value?.error || (typeof value === 'string' && value.trim()) || `Gateway returned HTTP ${response.status}.`;
      throw new GatewayError(message, {
        status: response.status,
        code: value?.code || '',
        details: value
      });
    }
    return value;
  }

  templates() { return this.request('/v1/templates'); }

  createProject(cloneURL, name) {
    if (!cloneURL || !name?.trim()) throw new Error('A template and project name are required.');
    return this.request('/v1/projects/create', { method: 'POST', body: { clone_url: cloneURL, name } });
  }

  sessions(signal) { return this.request('/sessions', { signal }); }
  messages(id, signal) { return this.request(`/sessions/${encodeURIComponent(id)}/messages`, { signal }); }
  permissions(id, signal) { return this.request(`/sessions/${encodeURIComponent(id)}/pending-permission`, { signal }); }
  abortSession(id) { return this.request(`/sessions/${encodeURIComponent(id)}/abort`, { method: 'POST' }); }
  replyPermission(id, requestID, allow) {
    return this.request(`/sessions/${encodeURIComponent(id)}/permissions/${encodeURIComponent(requestID)}/reply`, { method: 'POST', body: { allow } });
  }
  async sessionEvents(id, onEvent, signal) {
    const response = await this.fetcher(`${this.baseURL}/sessions/${encodeURIComponent(id)}/events`, {
      headers: { Authorization: `Bearer ${this.accessToken}`, Accept: 'text/event-stream' }, signal
    });
    if (!response.ok) throw new GatewayError(`Live updates disconnected (HTTP ${response.status}).`, { status: response.status });
    if (!response.body) throw new Error('The gateway returned an empty event stream.');
    await readEventStream(response.body, onEvent, signal);
  }

  inspectPullRequest(locator, signal) {
    return this.request('/v1/github/pull-requests/inspect', { method: 'POST', body: locator, signal });
  }

  launchPullRequest(request, signal) {
    return this.request('/v1/github/pull-requests/launch', {
      method: 'POST',
      body: request,
      signal
    });
  }

  inspectRepository(locator, signal) {
    return this.request('/v1/github/repositories/inspect', { method: 'POST', body: locator, signal });
  }

  launchRepository(locator, signal) {
    return this.request('/v1/github/repositories/launch', { method: 'POST', body: locator, signal });
  }

  githubConnectStart() {
    return this.request('/v1/github/connect/start', { method: 'POST' });
  }

  githubConnectStatus(flowID) {
    return this.request(`/v1/github/connect/status?flow_id=${encodeURIComponent(flowID)}`);
  }

  previewStart(worktreeID, name) {
    return this.request(`/worktrees/${encodeURIComponent(worktreeID)}/preview/start`, {
      method: 'POST',
      body: name ? { name } : undefined
    });
  }

  previewStatus(worktreeID, name) {
    const query = name ? `?name=${encodeURIComponent(name)}` : '';
    return this.request(`/worktrees/${encodeURIComponent(worktreeID)}/preview/status${query}`);
  }

  previewLogs(worktreeID, name) {
    const query = name ? `?name=${encodeURIComponent(name)}` : '';
    return this.request(`/worktrees/${encodeURIComponent(worktreeID)}/preview/logs${query}`);
  }

  signPreviewToken(token, backend, sessionID) {
    if (!backend) throw new Error('An editing backend is required before signing a preview.');
    return this.request(`/v1/preview/tokens/${encodeURIComponent(token)}/sign`, {
      method: 'POST',
      body: { ttl: SIGNED_PREVIEW_TTL, backend, ...(sessionID ? { session_id: sessionID } : {}) }
    });
  }

  providers() {
    return this.request('/auth/providers');
  }

  providerDeviceStart(providerID) {
    return this.request(`/auth/${encodeURIComponent(providerID)}/device/start`, { method: 'POST' });
  }

  providerAPIKey(providerID, key, metadata) {
    return this.request(`/auth/${encodeURIComponent(providerID)}/apikey`, {
      method: 'POST',
      body: { key, ...(metadata && Object.keys(metadata).length ? { metadata } : {}) }
    });
  }

  providerOAuthStart(providerID) {
    return this.request(`/auth/${encodeURIComponent(providerID)}/oauth/start`, { method: 'POST' });
  }

  providerOAuthSubmit(providerID, flowID, code) {
    return this.request(`/auth/${encodeURIComponent(providerID)}/oauth/submit`, {
      method: 'POST',
      body: { flow_id: flowID, code }
    });
  }

  providerFlowStatus(providerID, flowID) {
    return this.request(`/auth/${encodeURIComponent(providerID)}/flow/status?flow_id=${encodeURIComponent(flowID)}`);
  }

  presets(backend) {
    return this.request(`/presets?backend=${encodeURIComponent(backend)}`);
  }

  createSession(request) {
    return this.request('/sessions', { method: 'POST', body: request });
  }

  session(sessionID) {
    return this.request(`/sessions/${encodeURIComponent(sessionID)}`);
  }

  sendSessionMessage(sessionID, text) {
    return this.request(`/sessions/${encodeURIComponent(sessionID)}/message`, {
      method: 'POST',
      body: { text }
    });
  }

  markSessionDone(sessionID) {
    return this.request(`/sessions/${encodeURIComponent(sessionID)}/visibility`, {
      method: 'POST',
      body: { visibility: 'done' }
    });
  }
}
