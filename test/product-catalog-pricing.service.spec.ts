import { PricingCurrency, Prisma, UserRole } from '@prisma/client';
import { ProductCatalogService } from '../src/product-catalog/product-catalog.service';
import { ProductPricingService } from '../src/product-catalog/product-pricing.service';
const actor = { userId: 'user-1', email: 'a@example.com', role: UserRole.ADMIN };
function setup(rate: any = null) {
  const prisma = { currencyExchangeRate: { findFirst: jest.fn().mockResolvedValue(rate) }, productCatalogItem: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() } };
  const pricing = new ProductPricingService(prisma as any); const service = new ProductCatalogService(prisma as any, { record: jest.fn() } as any, pricing);
  return { prisma, service };
}
describe('ProductCatalogService pricing compatibility', () => {
  it('creates an IRR product and synchronizes defaultUnitPrice', async () => {
    const { prisma, service } = setup(); prisma.productCatalogItem.create.mockImplementation(({ data }: any) => ({ id: 'p1', ...data }));
    const result = await service.create({ code: 'p', name: 'Product', pricingCurrency: PricingCurrency.IRR, inPersonInputPrice: '100', digikalaInputPrice: '120' }, actor as any);
    expect(result.defaultUnitPrice.toString()).toBe('100'); expect(result.currency).toBe('IRR'); expect(result.digikalaPriceIrr.toString()).toBe('120');
  });
  it('creates a USD product using the active rate', async () => {
    const { prisma, service } = setup({ id: 'r1', rate: new Prisma.Decimal('1900000') }); prisma.productCatalogItem.create.mockImplementation(({ data }: any) => ({ id: 'p1', ...data }));
    const result = await service.create({ code: 'p', name: 'Product', pricingCurrency: PricingCurrency.USD, inPersonInputPrice: '100', digikalaInputPrice: '100', inPersonProfitPercent: '5', digikalaProfitPercent: '30' }, actor as any);
    expect(result.defaultUnitPrice.toString()).toBe('199500000'); expect(result.digikalaPriceIrr.toString()).toBe('247000000'); expect(result.currency).toBe('IRR');
  });
  it('updates USD channel inputs and keeps the compatibility snapshot synchronized', async () => {
    const { prisma, service } = setup({ id: 'r2', rate: new Prisma.Decimal('2000000') });
    const current = { id: 'p1', code: 'P', name: 'Product', pricingCurrency: PricingCurrency.USD, inPersonInputPrice: new Prisma.Decimal('100'), digikalaInputPrice: new Prisma.Decimal('100'), inPersonProfitPercent: new Prisma.Decimal('5'), digikalaProfitPercent: new Prisma.Decimal('30') };
    prisma.productCatalogItem.findUnique.mockResolvedValue(current); prisma.productCatalogItem.update.mockImplementation(({ data }: any) => ({ ...current, ...data }));
    const result = await service.update('p1', { inPersonInputPrice: '110' }, actor as any);
    expect(result.defaultUnitPrice.toString()).toBe('231000000'); expect(result.currency).toBe('IRR');
  });
});
