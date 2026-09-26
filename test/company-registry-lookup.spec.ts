import { ConfigService } from '@nestjs/config';
import { CompanyRegistryLookupService } from '../src/companies/company-registry-lookup.service';

describe('CompanyRegistryLookupService', () => {
  afterEach(() => jest.restoreAllMocks());

  const prisma = () => ({
    companyRegistrySnapshot: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
    },
  });

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
          totalStock: 75000000000,
          address: 'تهران، خیابان نمونه',
          status: 'فعال',
        },
      }),
    } as Response);

    const result = await new CompanyRegistryLookupService(config, prisma() as never)
      .lookup('10101234567', 'org-1');

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
      registeredCapital: '75000000000',
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
    fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: { authentication: { jwtToken: 'header.payload.signature' } } }),
        headers: new Headers(),
      } as Response).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { companyName: 'شرکت نمونه' } }),
      } as Response);

    await new CompanyRegistryLookupService(config, prisma() as never)
      .lookup('10101234567', 'org-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer header.payload.signature' }),
      }),
    );
  });

  it('combines current and historical company roles for a person', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'LINKA_API_TOKEN' ? 'secret-token' : fallback,
      ),
    } as unknown as ConfigService;
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      const rows = url.includes('PersonCompanyHistory')
        ? [{
            companyNationalCode: '14004176070', companyName: 'فاوا ایمن الکا',
            postDescription: 'مدیرعامل', startDate: '2016-10-31T00:00:00',
            endDate: '2019-02-07T00:00:00', personAttendanceStatusDescription: 'غیرفعال',
            fullName: 'فرزاد نوروزی فرد',
          }]
        : [{
            companyNationalCode: '10320508911', companyName: 'نانو فناور ستاره کاسپین',
            postDescription: 'مدیرعامل', startDate: '2011-04-09T00:00:00',
            personAttendanceStatusDescription: 'فعال', fullName: 'فرزاد نوروزی فرد',
          }];
      return { ok: true, status: 200, json: async () => ({ success: true, data: { rows } }) } as Response;
    });

    const result = await new CompanyRegistryLookupService(config, prisma() as never)
      .lookupPersonCompanies('0079474871', 'org-1');

    expect(result).toEqual(expect.objectContaining({
      nationalCode: '0079474871',
      fullName: 'فرزاد نوروزی فرد',
      current: [expect.objectContaining({ companyNationalCode: '10320508911', active: true })],
      history: [expect.objectContaining({ companyNationalCode: '14004176070', active: false })],
    }));
  });
});
