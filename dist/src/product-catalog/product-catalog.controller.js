"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCatalogController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const create_product_catalog_item_dto_1 = require("./dto/create-product-catalog-item.dto");
const find_product_catalog_items_dto_1 = require("./dto/find-product-catalog-items.dto");
const update_product_catalog_item_dto_1 = require("./dto/update-product-catalog-item.dto");
const product_catalog_service_1 = require("./product-catalog.service");
const product_price_history_service_1 = require("./product-price-history.service");
const find_product_price_history_dto_1 = require("./dto/find-product-price-history.dto");
let ProductCatalogController = class ProductCatalogController {
    constructor(service, history) {
        this.service = service;
        this.history = history;
    }
    priceHistory(id, query) {
        return this.history.findAll(id, query);
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    create(dto, user) {
        return this.service.create(dto, user);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto, user) {
        return this.service.update(id, dto, user);
    }
    activate(id, user) {
        return this.service.activate(id, user);
    }
    deactivate(id, user) {
        return this.service.deactivate(id, user);
    }
};
exports.ProductCatalogController = ProductCatalogController;
__decorate([
    (0, common_1.Get)(":id/price-history"),
    (0, permissions_decorator_1.Permissions)("product:view"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, find_product_price_history_dto_1.FindProductPriceHistoryDto]),
    __metadata("design:returntype", void 0)
], ProductCatalogController.prototype, "priceHistory", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)("product:view"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_product_catalog_items_dto_1.FindProductCatalogItemsDto]),
    __metadata("design:returntype", void 0)
], ProductCatalogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)("product:manage"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_catalog_item_dto_1.CreateProductCatalogItemDto, Object]),
    __metadata("design:returntype", void 0)
], ProductCatalogController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.Permissions)("product:view"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductCatalogController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.Permissions)("product:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_catalog_item_dto_1.UpdateProductCatalogItemDto, Object]),
    __metadata("design:returntype", void 0)
], ProductCatalogController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(":id/activate"),
    (0, permissions_decorator_1.Permissions)("product:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductCatalogController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(":id/deactivate"),
    (0, permissions_decorator_1.Permissions)("product:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductCatalogController.prototype, "deactivate", null);
exports.ProductCatalogController = ProductCatalogController = __decorate([
    (0, common_1.Controller)("product-catalog"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [product_catalog_service_1.ProductCatalogService,
        product_price_history_service_1.ProductPriceHistoryService])
], ProductCatalogController);
//# sourceMappingURL=product-catalog.controller.js.map