import { ConfigService } from '@nestjs/config';
import { CompanyRegistryLookupService } from '../src/companies/company-registry-lookup.service';

describe('CompanyRegistryLookupService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('calls Linka server-side and maps supported company fields', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'LINKA_API_TOKEN' ? 'secret-token' : fallback,
      ),
    } as unknown as ConfigService;
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          companyName: 'شرکت نمونه',
          nationalCode: '10101234567',
          registerNumber: '12345',
          registerDate: '2020-04-05T00:00:00',
          capital: '1,250,000 ریال',
          address: 'تهران، خیابان نمونه',
          status: 'فعال',
        },
      }),
    } as Response);

    const result = await new CompanyRegistryLookupService(config).lookup('10101234567');

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining('nationalCode=10101234567') }),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer secret-token' }),
      }),
    );
    expect(result).toEqual(expect.objectContaining({
      legalName: 'شرکت نمونه',
      nationalId: '10101234567',
      registrationNumber: '12345',
      establishmentDate: '2020-04-05',
      registeredCapital: '1250000',
      activityStatus: 'ACTIVE',
    }));
  });

  it('accepts a deeply nested token returned by Linka login', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'LINKA_API_USERNAME') return 'service-user';
        if (key === 'LINKA_API_PASSWORD') return 'service-password';
        return fallback;
      }),
    } as unknown as ConfigService;
    const fetchMock = jest.spyOn(global, 'fetch');
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: { authentication: { jwtToken: 'header.payload.signature' } } }),
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ companyName: 'شرکت نمونه' }),
      } as Response);

    await new CompanyRegistryLookupService(config).lookup('10101234567');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer header.payload.signature' }),
      }),
    );
  });
});
