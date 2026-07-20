import { Module } from '@nestjs/common';
import { ProductCatalogController } from './product-catalog.controller';
import { ProductCatalogService } from './product-catalog.service';
import { ProductPricingService } from './product-pricing.service';

@Module({
  controllers: [ProductCatalogController],
  providers: [ProductCatalogService, ProductPricingService],
  exports: [ProductCatalogService, ProductPricingService],
})
export class ProductCatalogModule {}
