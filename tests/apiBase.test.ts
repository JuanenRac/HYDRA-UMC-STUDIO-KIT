import { describe, expect, it } from 'vitest';
import { apiUrl, resolveApiBase, wsUrl } from '../src/index.js';

describe('resolveApiBase', () => {
  it('is empty in development (the proxy forwards relative paths)', () => {
    expect(resolveApiBase({ dev: true, configured: 'http://x:1', location: { protocol: 'http:', hostname: 'h', port: '5173' } })).toBe('');
  });

  it('uses the configured address without trailing slashes', () => {
    expect(resolveApiBase({ configured: ' https://api.example:8443/// ' })).toBe('https://api.example:8443');
  });

  it('drops a very long run of trailing slashes in one pass', () => {
    const started = Date.now();
    expect(resolveApiBase({ configured: 'http://h:1' + '/'.repeat(200000) + 'x' + '/'.repeat(200000) })).toBe('http://h:1' + '/'.repeat(200000) + 'x');
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('falls back to the origin of the page, with its own port', () => {
    expect(resolveApiBase({ location: { protocol: 'http:', hostname: '192.168.0.180', port: '3000' } })).toBe('http://192.168.0.180:3000');
  });

  it('follows the scheme of the page and invents no port behind a proxy', () => {
    expect(resolveApiBase({ location: { protocol: 'https:', hostname: 'cm5.local', port: '' } })).toBe('https://cm5.local');
  });

  it('works without a page', () => {
    expect(resolveApiBase({})).toBe('http://localhost');
  });
});

describe('apiUrl and wsUrl', () => {
  it('joins the base and the path, keeping an absolute address as it is', () => {
    expect(apiUrl('http://h:3000', '/api/a')).toBe('http://h:3000/api/a');
    expect(apiUrl('', 'api/a')).toBe('/api/a');
    expect(apiUrl('http://h', 'https://other/x')).toBe('https://other/x');
  });

  it('turns the base into a WebSocket address', () => {
    expect(wsUrl('http://h:3000', '/ws')).toBe('ws://h:3000/ws');
    expect(wsUrl('https://h', 'ws')).toBe('wss://h/ws');
  });

  it('follows the page when the base is empty', () => {
    expect(wsUrl('', '/ws', { protocol: 'https:', host: 'cm5.local:3000' })).toBe('wss://cm5.local:3000/ws');
    expect(wsUrl('', '/ws', null)).toBe('ws://localhost/ws');
  });
});
