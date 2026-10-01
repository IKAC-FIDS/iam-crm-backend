"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPED_SUCCESS_PAYLOADS = exports.RESPONSE_CONTRACT_SCHEMAS = void 0;
const client_1 = require("@prisma/client");
const uuid = { type: "string", format: "uuid" };
const nullableUuid = { ...uuid, nullable: true };
const dateTime = { type: "string", format: "date-time" };
const nullableDateTime = { ...dateTime, nullable: true };
const nullableString = { type: "string", nullable: true };
const enumOf = (values) => ({
    type: "string",
    enum: Object.values(values).filter((value) => typeof value === "string"),
});
const nullableRef = (name) => ({
    type: "object",
    allOf: [{ $ref: `#/components/schemas/${name}` }],
    nullable: true,
});
const companyScalarProperties = {
    id: uuid,
    leadCode: uuid,
    legalName: { type: "string" },
    brandName: nullableString,
    registrationNo: nullableString,
    registrationNumber: nullableString,
    nationalId: nullableString,
    economicCode: nullableString,
    establishmentDate: nullableDateTime,
    foundedYear: { type: "integer", nullable: true },
    companyType: nullableString,
    ownership: { ...enumOf(client_1.CompanyOwnership), nullable: true },
    activityStatus: enumOf(client_1.CompanyActivityStatus),
    activityGroup: nullableString,
    marketSize: nullableString,
    industryId: nullableUuid,
    industry: nullableString,
    parentCompanyId: nullableUuid,
    website: nullableString,
    publicEmail: nullableString,
    headOfficeProvince: nullableString,
    headOfficeCity: nullableString,
    headOfficeAddress: nullableString,
    postalCode: nullableString,
    centralPhone: nullableString,
    registeredCapital: {
        type: "string",
        nullable: true,
        description: "Prisma Decimal serialized as a decimal string.",
    },
    employeeCount: { type: "integer", nullable: true },
    annualRevenue: {
        type: "string",
        nullable: true,
        pattern: "^[0-9]+$",
        description: "BigInt serialized as a decimal string.",
    },
    ownerId: nullableUuid,
    priority: enumOf(client_1.Priority),
    stage: enumOf(client_1.LegacyPipelineStage),
    sourceId: nullableUuid,
    source: nullableString,
    nextActionDate: nullableDateTime,
    archivedAt: nullableDateTime,
    archivedById: nullableUuid,
    archiveReason: nullableString,
    researchCompletion: { type: "object", nullable: true },
    createdAt: dateTime,
    updatedAt: dateTime,
    organizationId: uuid,
};
const companyRequired = [
    "id",
    "leadCode",
    "legalName",
    "brandName",
    "registrationNo",
    "registrationNumber",
    "nationalId",
    "economicCode",
    "establishmentDate",
    "foundedYear",
    "companyType",
    "ownership",
    "activityStatus",
    "activityGroup",
    "marketSize",
    "industryId",
    "industry",
    "parentCompanyId",
    "website",
    "publicEmail",
    "headOfficeProvince",
    "headOfficeCity",
    "headOfficeAddress",
    "postalCode",
    "centralPhone",
    "registeredCapital",
    "employeeCount",
    "annualRevenue",
    "ownerId",
    "priority",
    "stage",
    "sourceId",
    "source",
    "nextActionDate",
    "archivedAt",
    "archivedById",
    "archiveReason",
    "researchCompletion",
    "createdAt",
    "updatedAt",
    "organizationId",
];
const taskScalarProperties = {
    id: uuid,
    title: { type: "string" },
    description: nullableString,
    status: enumOf(client_1.TaskStatus),
    priority: enumOf(client_1.Priority),
    dueAt: nullableDateTime,
    reminderAt: nullableDateTime,
    companyId: nullableUuid,
    personId: nullableUuid,
    opportunityId: nullableUuid,
    commercialDocumentId: nullableUuid,
    paymentId: nullableUuid,
    assignedToId: nullableUuid,
    createdById: nullableUuid,
    completedAt: nullableDateTime,
    completedById: nullableUuid,
    completionNote: nullableString,
    cancelledAt: nullableDateTime,
    cancelReason: nullableString,
    createdAt: dateTime,
    updatedAt: dateTime,
    organizationId: uuid,
};
exports.RESPONSE_CONTRACT_SCHEMAS = {
    UserSummary: {
        type: "object",
        required: ["id", "fullName"],
        properties: {
            id: uuid,
            fullName: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            team: nullableString,
        },
    },
    IndustrySummary: {
        type: "object",
        required: ["id", "name", "description"],
        properties: {
            id: uuid,
            name: { type: "string" },
            description: nullableString,
        },
    },
    LeadSourceSummary: {
        type: "object",
        required: ["id", "code", "name", "description", "isActive"],
        properties: {
            id: uuid,
            code: { type: "string" },
            name: { type: "string" },
            description: nullableString,
            isActive: { type: "boolean" },
        },
    },
    CompanyListItem: {
        type: "object",
        required: [...companyRequired, "owner", "industryRef", "sourceRef"],
        properties: {
            ...companyScalarProperties,
            owner: nullableRef("UserSummary"),
            industryRef: nullableRef("IndustrySummary"),
            sourceRef: nullableRef("LeadSourceSummary"),
        },
    },
    CompanyResponse: {
        type: "object",
        required: [
            ...companyRequired,
            "owner",
            "industryRef",
            "sourceRef",
            "parentCompanies",
            "subsidiaryCompanies",
        ],
        properties: {
            ...companyScalarProperties,
            owner: nullableRef("UserSummary"),
            industryRef: nullableRef("IndustrySummary"),
            sourceRef: nullableRef("LeadSourceSummary"),
            parentCompanies: {
                type: "array",
                items: { $ref: "#/components/schemas/CompanyScalar" },
            },
            subsidiaryCompanies: {
                type: "array",
                items: { $ref: "#/components/schemas/CompanyScalar" },
            },
            people: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            branches: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            socialChannels: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            activities: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            opportunities: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            legalDocuments: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            stageHistory: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            callCard: nullableRef("RelatedEntity"),
            parentRelations: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
            subsidiaryRelations: {
                type: "array",
                items: { $ref: "#/components/schemas/RelatedEntity" },
            },
        },
    },
    CompanyScalar: {
        type: "object",
        required: companyRequired,
        properties: companyScalarProperties,
    },
    RelatedEntity: { type: "object", required: ["id"], properties: { id: uuid } },
    TaskCompanySummary: {
        type: "object",
        required: ["id", "legalName", "brandName", "ownerId"],
        properties: {
            id: uuid,
            legalName: { type: "string" },
            brandName: nullableString,
            ownerId: nullableUuid,
        },
    },
    TaskPersonSummary: {
        type: "object",
        required: ["id", "fullName", "title", "companyId"],
        properties: {
            id: uuid,
            fullName: { type: "string" },
            title: nullableString,
            companyId: uuid,
        },
    },
    TaskOpportunitySummary: {
        type: "object",
        required: ["id", "title", "companyId", "ownerId", "priority", "archivedAt"],
        properties: {
            id: uuid,
            title: { type: "string" },
            companyId: uuid,
            ownerId: nullableUuid,
            priority: enumOf(client_1.Priority),
            archivedAt: nullableDateTime,
        },
    },
    TaskCommercialDocumentSummary: {
        type: "object",
        required: ["id", "type", "status", "number", "title", "opportunityId"],
        properties: {
            id: uuid,
            type: { type: "string" },
            status: { type: "string" },
            number: nullableString,
            title: { type: "string" },
            opportunityId: uuid,
        },
    },
    TaskPaymentSummary: {
        type: "object",
        required: [
            "id",
            "status",
            "amount",
            "currency",
            "dueDate",
            "opportunityId",
        ],
        properties: {
            id: uuid,
            status: { type: "string" },
            amount: { type: "string" },
            currency: { type: "string" },
            dueDate: nullableDateTime,
            opportunityId: uuid,
        },
    },
    TaskResponse: {
        type: "object",
        required: [
            ...Object.keys(taskScalarProperties),
            "company",
            "person",
            "opportunity",
            "commercialDocument",
            "payment",
            "assignedTo",
            "createdBy",
            "completedBy",
        ],
        properties: {
            ...taskScalarProperties,
            company: nullableRef("TaskCompanySummary"),
            person: nullableRef("TaskPersonSummary"),
            opportunity: nullableRef("TaskOpportunitySummary"),
            commercialDocument: nullableRef("TaskCommercialDocumentSummary"),
            payment: nullableRef("TaskPaymentSummary"),
            assignedTo: nullableRef("UserSummary"),
            createdBy: nullableRef("UserSummary"),
            completedBy: nullableRef("UserSummary"),
        },
    },
    DeletedTaskResponse: {
        type: "object",
        required: Object.keys(taskScalarProperties),
        properties: taskScalarProperties,
    },
    OperationsWorkspace: {
        type: "object",
        required: ["attention", "today", "recentConversations"],
        properties: {
            attention: {
                type: "object",
                required: [
                    "dueTodayTasks",
                    "overdueTasks",
                    "unreadConversationMessages",
                    "meetingsToday",
                    "activeOpportunities",
                ],
                properties: {
                    dueTodayTasks: { type: "integer", minimum: 0 },
                    overdueTasks: { type: "integer", minimum: 0 },
                    unreadConversationMessages: { type: "integer", minimum: 0 },
                    meetingsToday: { type: "integer", minimum: 0 },
                    activeOpportunities: { type: "integer", minimum: 0 },
                },
            },
            today: {
                type: "object",
                required: ["tasks", "meetings"],
                properties: {
                    tasks: {
                        type: "array",
                        items: { type: "object", additionalProperties: true },
                    },
                    meetings: {
                        type: "array",
                        items: { type: "object", additionalProperties: true },
                    },
                },
            },
            recentConversations: {
                type: "array",
                items: { type: "object", additionalProperties: true },
            },
        },
    },
    OperationsCompanyRow: {
        type: "object",
        required: [
            "company",
            "activeOpportunities",
            "tasks",
            "conversation",
            "lastActivity",
            "nextMeeting",
            "nextAction",
            "attention",
        ],
        properties: {
            company: {
                type: "object",
                required: [
                    "id",
                    "legalName",
                    "brandName",
                    "logoObjectKey",
                    "priority",
                    "activityStatus",
                    "owner",
                ],
                properties: {
                    id: uuid,
                    legalName: { type: "string" },
                    brandName: nullableString,
                    logoObjectKey: nullableString,
                    priority: enumOf(client_1.Priority),
                    activityStatus: enumOf(client_1.CompanyActivityStatus),
                    owner: nullableRef("OperationsUserSummary"),
                },
            },
            activeOpportunities: {
                type: "object",
                required: ["count", "items"],
                properties: {
                    count: { type: "integer", minimum: 0 },
                    items: {
                        type: "array",
                        maxItems: 3,
                        items: {
                            $ref: "#/components/schemas/OperationsOpportunitySummary",
                        },
                    },
                },
            },
            tasks: {
                type: "object",
                required: ["open", "overdue", "dueToday", "next"],
                properties: {
                    open: { type: "integer", minimum: 0 },
                    overdue: { type: "integer", minimum: 0 },
                    dueToday: { type: "integer", minimum: 0 },
                    next: { type: "object", nullable: true, additionalProperties: true },
                },
            },
            conversation: {
                type: "object",
                required: ["unreadCount", "latestMessage"],
                properties: {
                    unreadCount: { type: "integer", minimum: 0 },
                    latestMessage: {
                        type: "object",
                        nullable: true,
                        additionalProperties: true,
                    },
                },
            },
            lastActivity: {
                type: "object",
                nullable: true,
                additionalProperties: true,
            },
            nextMeeting: {
                type: "object",
                nullable: true,
                additionalProperties: true,
            },
            nextAction: {
                type: "object",
                nullable: true,
                additionalProperties: true,
            },
            attention: {
                type: "object",
                required: ["state", "reason"],
                properties: {
                    state: {
                        type: "string",
                        enum: ["OVERDUE", "TODAY", "UPCOMING", "NO_NEXT_ACTION", "NORMAL"],
                    },
                    reason: nullableString,
                },
            },
        },
    },
    OperationsUserSummary: {
        type: "object",
        required: ["id", "fullName", "avatarObjectKey"],
        properties: {
            id: uuid,
            fullName: { type: "string" },
            avatarObjectKey: nullableString,
        },
    },
    OperationsOpportunitySummary: {
        type: "object",
        required: [
            "id",
            "companyId",
            "title",
            "priority",
            "expectedCloseDate",
            "stage",
        ],
        properties: {
            id: uuid,
            companyId: uuid,
            title: { type: "string" },
            priority: enumOf(client_1.Priority),
            expectedCloseDate: nullableDateTime,
            stage: {
                type: "object",
                required: ["id", "label", "terminalType"],
                properties: {
                    id: uuid,
                    label: { type: "string" },
                    terminalType: nullableString,
                },
            },
        },
    },
};
exports.TYPED_SUCCESS_PAYLOADS = {
    "GET /api/companies": {
        schema: { $ref: "#/components/schemas/CompanyListItem" },
        paginated: true,
    },
    "POST /api/companies": {
        schema: { $ref: "#/components/schemas/CompanyResponse" },
    },
    "GET /api/companies/{id}": {
        schema: { $ref: "#/components/schemas/CompanyResponse" },
    },
    "PATCH /api/companies/{id}": {
        schema: { $ref: "#/components/schemas/CompanyResponse" },
    },
    "GET /api/tasks": {
        schema: { $ref: "#/components/schemas/TaskResponse" },
        paginated: true,
    },
    "POST /api/tasks": { schema: { $ref: "#/components/schemas/TaskResponse" } },
    "GET /api/tasks/{id}": {
        schema: { $ref: "#/components/schemas/TaskResponse" },
    },
    "PATCH /api/tasks/{id}": {
        schema: { $ref: "#/components/schemas/TaskResponse" },
    },
    "DELETE /api/tasks/{id}": {
        schema: { $ref: "#/components/schemas/DeletedTaskResponse" },
    },
    "GET /api/operations/workspace": {
        schema: { $ref: "#/components/schemas/OperationsWorkspace" },
    },
    "GET /api/operations/companies": {
        schema: { $ref: "#/components/schemas/OperationsCompanyRow" },
        paginated: true,
    },
};
//# sourceMappingURL=response-contract.schemas.js.map