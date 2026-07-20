import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PricingCurrency, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCatalogItemDto } from './dto/create-product-catalog-item.dto';
import { FindProductCatalogItemsDto } from './dto/find-product-catalog-items.dto';
import { UpdateProductCatalogItemDto } from './dto/update-product-catalog-item.dto';
import { ProductPricingService } from './product-pricing.service';

const productInclude = { calculatedExchangeRate: { select: { id: true, rate: true, validFrom: true, validTo: true } } } satisfies Prisma.ProductCatalogItemInclude;

@Injectable()
export class ProductCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly pricing: ProductPricingService,
  ) {}

  async findAll(query: FindProductCatalogItemsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProductCatalogItemWhereInput = {};

    if (query.active !== undefined) {
      where.isActive = query.active === 'true';
    }

    if (query.category?.trim()) {
      where.category = {
        equals: query.category.trim(),
        mode: 'insensitive',
      };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();

      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.productCatalogItem.findMany({
        where,
        include: productInclude,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.productCatalogItem.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.productCatalogItem.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!item) {
      throw new NotFoundException('محصول یا سرویس پیدا نشد');
    }

    return item;
  }

  async create(dto: CreateProductCatalogItemDto, user: CurrentUserPayload) {
    const code = this.normalizeCode(dto.code);

    const existing = await this.prisma.productCatalogItem.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException('کد محصول یا سرویس قبلاً ثبت شده است');
    }

    const compatibilityPrice = dto.inPersonInputPrice ?? dto.defaultUnitPrice ?? '0';
    const prices = await this.pricing.calculate({
      pricingCurrency: dto.pricingCurrency ?? PricingCurrency.IRR,
      inPersonInputPrice: compatibilityPrice,
      digikalaInputPrice: dto.digikalaInputPrice ?? compatibilityPrice,
      inPersonProfitPercent: dto.inPersonProfitPercent,
      digikalaProfitPercent: dto.digikalaProfitPercent,
    });
    const item = await this.prisma.productCatalogItem.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() || undefined,
        category: dto.category?.trim() || undefined,
        unit: dto.unit?.trim() || undefined,
        ...prices,
        defaultUnitPrice: prices.inPersonPriceIrr,
        currency: 'IRR',
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }, include: productInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'product-catalog-item',
      entityId: item.id,
      action: 'product.created',
      after: item,
    });

    return item;
  }

  async update(
    id: string,
    dto: UpdateProductCatalogItemDto,
    user: CurrentUserPayload,
  ) {
    const current = await this.findOne(id);

    const data: Prisma.ProductCatalogItemUpdateInput = {};

    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);

      const duplicate = await this.prisma.productCatalogItem.findFirst({
        where: {
          code,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ConflictException('کد محصول یا سرویس قبلاً ثبت شده است');
      }

      data.code = code;
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('نام محصول یا سرویس الزامی است');
      }

      data.name = name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.category !== undefined) {
      data.category = dto.category?.trim() || null;
    }

    if (dto.unit !== undefined) {
      data.unit = dto.unit?.trim() || null;
    }

    const pricingChanged = dto.pricingCurrency !== undefined || dto.inPersonInputPrice !== undefined || dto.digikalaInputPrice !== undefined || dto.inPersonProfitPercent !== undefined || dto.digikalaProfitPercent !== undefined || dto.defaultUnitPrice !== undefined;
    if (pricingChanged) {
      const nextCurrency = dto.pricingCurrency ?? current.pricingCurrency;
      const compatibilityPrice = dto.defaultUnitPrice;
      const prices = await this.pricing.calculate({
        pricingCurrency: nextCurrency,
        inPersonInputPrice: dto.inPersonInputPrice ?? compatibilityPrice ?? current.inPersonInputPrice,
        digikalaInputPrice: dto.digikalaInputPrice ?? compatibilityPrice ?? current.digikalaInputPrice,
        inPersonProfitPercent: dto.inPersonProfitPercent !== undefined ? dto.inPersonProfitPercent : nextCurrency === PricingCurrency.IRR ? null : current.inPersonProfitPercent,
        digikalaProfitPercent: dto.digikalaProfitPercent !== undefined ? dto.digikalaProfitPercent : nextCurrency === PricingCurrency.IRR ? null : current.digikalaProfitPercent,
      });
      Object.assign(data, prices, { defaultUnitPrice: prices.inPersonPriceIrr, currency: 'IRR' });
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    const updated = await this.prisma.productCatalogItem.update({
      where: { id },
      data,
      include: productInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'product-catalog-item',
      entityId: id,
      action: 'product.updated',
      before: current,
      after: updated,
    });

    return updated;
  }

  async activate(id: string, user: CurrentUserPayload) {
    const current = await this.findOne(id);

    const updated = await this.prisma.productCatalogItem.update({
      where: { id },
      data: { isActive: true },
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'product-catalog-item',
      entityId: id,
      action: 'product.activated',
      before: current,
      after: updated,
    });

    return updated;
  }

  async deactivate(id: string, user: CurrentUserPayload) {
    const current = await this.findOne(id);

    const updated = await this.prisma.productCatalogItem.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'product-catalog-item',
      entityId: id,
      action: 'product.deactivated',
      before: current,
      after: updated,
    });

    return updated;
  }

  private normalizeCode(code: string) {
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      throw new BadRequestException('کد محصول یا سرویس الزامی است');
    }

    return normalized;
  }
}
