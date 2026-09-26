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
});
