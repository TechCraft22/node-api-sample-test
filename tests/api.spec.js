import { test, expect, request } from '@playwright/test';

const BASE_URL = 'http://localhost:3000'; // adjust if needed

test.describe('API Tests', () => {
  
  test('POST /echo returns error for empty body', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/echo`, {
      data: {}
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No data provided');
  });

  test('GET /health returns status OK', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('OK');
    expect(typeof body.timestamp).toBe('string');
  });

  test('GET /status returns server status', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/status`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('Server is running');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.pretty).toBe('string');
    expect(typeof body.timestamp).toBe('string');
  });

  test('GET /version returns API version', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/version`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.version).toBe('1.0.0');
    expect(typeof body.timestamp).toBe('string');
  });
  
  test('homepage has correct title', async ({ page }) => {
    await page.goto(`${BASE_URL}/hello`);
    await expect(page).toHaveTitle(/Hello/);
  });

});
