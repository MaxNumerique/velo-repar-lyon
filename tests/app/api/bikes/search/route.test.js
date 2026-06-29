import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/bikes/search/route';
import { createMockRequest } from 'tests/lib/api-test-utils';

// Mocks
global.fetch = vi.fn();

describe('Public Bike Search API (/api/bikes/search)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty list if query is too short', async () => {
    const req = createMockRequest({ url: 'http://localhost/api/bikes/search?query=a' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.bikes).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('proxies request to Bike Index API for valid queries', async () => {
    const mockBikes = [{ id: 1, title: 'Specialized Stumpjumper' }];
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bikes: mockBikes })
    });
    const req = createMockRequest({ url: 'http://localhost/api/bikes/search?query=specialized' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.bikes).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('bikeindex.org/api/v3/search'),
        expect.any(Object)
    );
  });

  it('returns 500 if Bike Index API fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502
    });
    const req = createMockRequest({ url: 'http://localhost/api/bikes/search?query=error' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to fetch from Bike Index');
  });
});
