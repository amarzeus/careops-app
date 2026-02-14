
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.2.1
 * Query Engine version: 4123509d24aa4dede1e864b46351bf2790323b69
 */
Prisma.prismaVersion = {
  client: "6.2.1",
  engine: "4123509d24aa4dede1e864b46351bf2790323b69"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  passwordHash: 'passwordHash',
  role: 'role',
  workspaceId: 'workspaceId',
  otpCode: 'otpCode',
  otpExpires: 'otpExpires',
  emailVerified: 'emailVerified',
  googleId: 'googleId',
  canAccessInbox: 'canAccessInbox',
  canAccessBookings: 'canAccessBookings',
  canAccessForms: 'canAccessForms',
  canAccessInventory: 'canAccessInventory',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkspaceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  timezone: 'timezone',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  status: 'status',
  onboardingStep: 'onboardingStep',
  emailProvider: 'emailProvider',
  emailApiKey: 'emailApiKey',
  emailFromName: 'emailFromName',
  emailFromAddress: 'emailFromAddress',
  emailConfigured: 'emailConfigured',
  smsProvider: 'smsProvider',
  smsApiKey: 'smsApiKey',
  smsFromNumber: 'smsFromNumber',
  smsConfigured: 'smsConfigured',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  source: 'source',
  notes: 'notes',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  duration: 'duration',
  location: 'location',
  isActive: 'isActive',
  workspaceId: 'workspaceId',
  availableDays: 'availableDays',
  startTime: 'startTime',
  endTime: 'endTime',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BookingScalarFieldEnum = {
  id: 'id',
  date: 'date',
  endTime: 'endTime',
  status: 'status',
  notes: 'notes',
  serviceId: 'serviceId',
  contactId: 'contactId',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactFormScalarFieldEnum = {
  id: 'id',
  name: 'name',
  fields: 'fields',
  isActive: 'isActive',
  slug: 'slug',
  welcomeMessage: 'welcomeMessage',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IntakeFormScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  fields: 'fields',
  isActive: 'isActive',
  slug: 'slug',
  serviceId: 'serviceId',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FormSubmissionScalarFieldEnum = {
  id: 'id',
  data: 'data',
  status: 'status',
  intakeFormId: 'intakeFormId',
  contactId: 'contactId',
  bookingId: 'bookingId',
  workspaceId: 'workspaceId',
  sentAt: 'sentAt',
  completedAt: 'completedAt',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryItemScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  quantity: 'quantity',
  threshold: 'threshold',
  unit: 'unit',
  vendorName: 'vendorName',
  vendorEmail: 'vendorEmail',
  vendorPhone: 'vendorPhone',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceInventoryLinkScalarFieldEnum = {
  id: 'id',
  serviceId: 'serviceId',
  inventoryId: 'inventoryId',
  quantity: 'quantity',
  createdAt: 'createdAt'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  subject: 'subject',
  isActive: 'isActive',
  lastMessageAt: 'lastMessageAt',
  unreadCount: 'unreadCount',
  contactId: 'contactId',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  channel: 'channel',
  direction: 'direction',
  isAutomated: 'isAutomated',
  conversationId: 'conversationId',
  senderId: 'senderId',
  createdAt: 'createdAt'
};

exports.Prisma.AutomationRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  trigger: 'trigger',
  isActive: 'isActive',
  messageTemplate: 'messageTemplate',
  delayMinutes: 'delayMinutes',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  message: 'message',
  isRead: 'isRead',
  actionUrl: 'actionUrl',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt'
};

exports.Prisma.WebhookScalarFieldEnum = {
  id: 'id',
  url: 'url',
  event: 'event',
  isActive: 'isActive',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IntegrationLogScalarFieldEnum = {
  id: 'id',
  type: 'type',
  status: 'status',
  to: 'to',
  message: 'message',
  error: 'error',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt'
};

exports.Prisma.AutomationLogScalarFieldEnum = {
  id: 'id',
  ruleId: 'ruleId',
  trigger: 'trigger',
  status: 'status',
  details: 'details',
  recipient: 'recipient',
  workspaceId: 'workspaceId',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserRole = exports.$Enums.UserRole = {
  OWNER: 'OWNER',
  STAFF: 'STAFF'
};

exports.WorkspaceStatus = exports.$Enums.WorkspaceStatus = {
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

exports.BookingStatus = exports.$Enums.BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

exports.FormStatus = exports.$Enums.FormStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE'
};

exports.MessageChannel = exports.$Enums.MessageChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  SYSTEM: 'SYSTEM'
};

exports.MessageDirection = exports.$Enums.MessageDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND'
};

exports.AutomationTrigger = exports.$Enums.AutomationTrigger = {
  NEW_CONTACT: 'NEW_CONTACT',
  BOOKING_CREATED: 'BOOKING_CREATED',
  BEFORE_BOOKING: 'BEFORE_BOOKING',
  FORM_PENDING: 'FORM_PENDING',
  INVENTORY_LOW: 'INVENTORY_LOW',
  STAFF_REPLY: 'STAFF_REPLY'
};

exports.Prisma.ModelName = {
  User: 'User',
  Workspace: 'Workspace',
  Contact: 'Contact',
  Service: 'Service',
  Booking: 'Booking',
  ContactForm: 'ContactForm',
  IntakeForm: 'IntakeForm',
  FormSubmission: 'FormSubmission',
  InventoryItem: 'InventoryItem',
  ServiceInventoryLink: 'ServiceInventoryLink',
  Conversation: 'Conversation',
  Message: 'Message',
  AutomationRule: 'AutomationRule',
  Alert: 'Alert',
  Webhook: 'Webhook',
  IntegrationLog: 'IntegrationLog',
  AutomationLog: 'AutomationLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
