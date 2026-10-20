"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
let ReportExportService = class ReportExportService {
    create(format, filename, sheets, maxRows) {
        const rowCount = sheets.reduce((total, sheet) => total + sheet.rows.length, 0);
        if (rowCount > maxRows)
            throw new common_1.BadRequestException({
                code: "EXPORT_ROW_LIMIT_EXCEEDED",
                message: "Export row limit exceeded",
                details: { detectedRowCount: rowCount, allowedMaximum: maxRows },
            });
        const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, "-");
        if (format === "csv") {
            const rows = sheets[0]?.rows ?? [];
            const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
            const csv = [
                headers,
                ...rows.map((row) => headers.map((key) => this.cell(row[key]))),
            ]
                .map((row) => row.map((value) => this.quote(value)).join(","))
                .join("\r\n");
            return {
                buffer: Buffer.from(`\uFEFF${csv}`, "utf8"),
                rowCount,
                contentType: "text/csv; charset=utf-8",
                contentDisposition: this.disposition(`${safeFilename}.csv`),
            };
        }
        const workbook = XLSX.utils.book_new();
        for (const sheet of sheets) {
            const rows = sheet.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, this.cell(value)])));
            const worksheet = XLSX.utils.json_to_sheet(rows);
            worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
            worksheet["!cols"] = this.widths(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, this.sheetName(sheet.name));
        }
        return {
            buffer: XLSX.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
                compression: true,
            }),
            rowCount,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            contentDisposition: this.disposition(`${safeFilename}.xlsx`),
        };
    }
    cell(value) {
        if (value == null)
            return "";
        if (typeof value === "number" || typeof value === "boolean")
            return value;
        const text = typeof value === "string" ? value : JSON.stringify(value);
        return /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    }
    quote(value) {
        const text = String(value);
        return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }
    sheetName(name) {
        return (name.replace(/[\\/?*[\]:]/g, " ").trim() || "Sheet").slice(0, 31);
    }
    disposition(filename) {
        return `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
    }
    widths(rows) {
        const keys = [...new Set(rows.flatMap(Object.keys))];
        return keys.map((key) => ({
            wch: Math.min(50, Math.max(10, key.length, ...rows.slice(0, 200).map((row) => String(row[key] ?? "").length))),
        }));
    }
};
exports.ReportExportService = ReportExportService;
exports.ReportExportService = ReportExportService = __decorate([
    (0, common_1.Injectable)()
], ReportExportService);
//# sourceMappingURL=report-export.service.js.map