// ====================
// AUTH
// ====================

// REGISTER
export const POST_FAKE_REGISTER = "/post-fake-register";

// LOGIN
export const POST_FAKE_LOGIN = "/api/auth/login";
export const POST_FAKE_JWT_LOGIN = "/api/auth/login";
export const POST_FAKE_PASSWORD_FORGET = "/fake-forget-pwd";
export const POST_FAKE_JWT_PASSWORD_FORGET = "/jwt-forget-pwd";
export const SOCIAL_LOGIN = "/social-login";

// ATTACHMENTS
export const CREATE_ATTACHMENT = "/api/attachments";
export const GET_ATTACHMENT_URL = "/api/attachments";
// Lists
export const GET_LIST_BY_KEY = "/api/lists/by-key";


// PROFILE
export const POST_EDIT_JWT_PROFILE = "/api/auth/profile";
export const POST_EDIT_PROFILE = "/post-fake-profile";

// ====================
// ACCESS / PERMISSIONS
// ====================
export const GET_MY_PERMISSIONS = "/api/access/my-permissions";

// ✅ ACCESS MODULES (Departments for Rule Management Dropdown)
export const GET_ACCESS_MODULES = "/api/access/modules";
export const GET_ACCESS_ROLES = "/api/access/roles";
// Role permissions base - we use /:ROLE_ID/permissions from this
export const ROLE_PERMISSIONS_BASE = "/api/access/roles";

// ====================
// HR
// ====================

// ✅ BRUNO: GET_ROLES (used by Rule Management)
export const GET_HR_ROLES = "/api/hr/roles";

// Employees
export const CREATE_HR_EMPLOYEE = "/api/hr/employees";
export const GET_HR_EMPLOYEES = "/api/hr/employees";
export const GET_HR_EMPLOYEE = "/api/hr/employees";

// ====================
// HR RULE MANAGEMENT
// ====================

// ✅ Rule Management uses HR Roles endpoint
export const GET_HR_RULES   = GET_HR_ROLES;
export const CREATE_HR_RULE = "/api/hr/roles";
export const UPDATE_HR_RULE = "/api/hr/roles";
export const DELETE_HR_RULE = "/api/hr/roles";

// ====================
// System dynamic lists
// ====================

export const GET_SYSTEM_LISTS = "/api/lists"; // will use ?ACTIVE_STATUS=1
export const GET_SYSTEM_LIST_ITEMS_BY_ID = "/api/lists"; // base for /:LIST_ID/items
export const GET_SYSTEM_LIST_ITEMS = "/api/lists/by-key"; // base for /:LIST_KEY


// ==================== // HOTELS (CONTRACTING) // ====================

export const GET_HOTELS = "/api/hotels";
export const HOTELS = "/api/hotels"; //CREATE

// Hotel Contracts
export const HOTEL_CONTRACTS_BASE = "/api/hotels"; // use with /:HOTEL_ID/contracts

// Hotel Seasons
export const HOTEL_SEASONS_BASE = "/api/hotels"; // use with /:HOTEL_ID/seasons
export const HOTEL_SEASONS_WITH_RATES_BASE = "/api/hotels"; // use with /:HOTEL_ID/seasons-with-rates



// ====================
// PRODUCTS
// ====================
export const GET_PRODUCTS = "/products";
export const GET_PRODUCTS_DETAIL = "/product";

// ====================
// MAILS
// ====================
export const GET_MAILS_LIST = "/mailslists";
export const SELECT_FOLDER = "/folders";
export const GET_SELECTED_MAILS = "/selectedmails";
export const SET_FOLDER_SELECTED_MAILS = "/setfolderonmail";
export const DELETE_MAIL = "/delete/mail";
export const TRASH_MAIL = "/trash/mail";
export const STARED_MAIL = "/stared/mail";
export const GET_MAILS_ID = "/mail:id";

// ====================
// CALENDAR
// ====================
export const GET_EVENTS = "/events";
export const ADD_NEW_EVENT = "/add/event";
export const UPDATE_EVENT = "/update/event";
export const DELETE_EVENT = "/delete/event";
export const GET_CATEGORIES = "/categories";

// ====================
// CHATS
// ====================
export const GET_CHATS = "/chats";
export const GET_GROUPS = "/groups";
export const GET_CONTACTS = "/contacts";
export const GET_MESSAGES = "/messages";
export const ADD_MESSAGE = "/add/messages";
export const DELETE_MESSAGE = "/delete/message";

// ====================
// ORDERS
// ====================
export const GET_ORDERS = "/orders";
export const ADD_NEW_ORDER = "/add/order";
export const UPDATE_ORDER = "/update/order";
export const DELETE_ORDER = "/delete/order";

// ====================
// CART
// ====================
export const GET_CART_DATA = "/cart";

// ====================
// CUSTOMERS
// ====================
export const GET_CUSTOMERS = "/customers";
export const ADD_NEW_CUSTOMER = "/add/customer";
export const UPDATE_CUSTOMER = "/update/customer";
export const DELETE_CUSTOMER = "/delete/customer";

// ====================
// SHOPS
// ====================
export const GET_SHOPS = "/shops";

// ====================
// CRYPTO
// ====================
export const GET_WALLET = "/wallet";
export const GET_CRYPTO_ORDERS = "/crypto/orders";
export const GET_CRYPTO_PRODUCTS = "/crypto-products";

// ====================
// INVOICES
// ====================
export const GET_INVOICES = "/invoices";
export const GET_INVOICE_DETAIL = "/invoice";

// ====================
// JOBS
// ====================
export const GET_JOB_LIST = "/jobs";
export const ADD_NEW_JOB_LIST = "/add/job";
export const UPDATE_JOB_LIST = "/update/job";
export const DELETE_JOB_LIST = "/delete/job";

export const GET_APPLY_JOB = "/jobApply";
export const DELETE_APPLY_JOB = "add/applyjob";

// ====================
// PROJECTS
// ====================
export const GET_PROJECTS = "/projects";
export const GET_PROJECT_DETAIL = "/project";
export const UPDATE_PROJECT = "/update/project";
export const DELETE_PROJECT = "/delete/project";

// ====================
// TASKS
// ====================
export const GET_TASKS = "/tasks";
export const DELETE_KANBAN = "/delete/tasks";
export const ADD_CARD_DATA = "/add/tasks";
export const UPDATE_CARD_DATA = "/update/tasks";

// ====================
// CONTACTS
// ====================
export const GET_USERS = "/users";
export const GET_USER_PROFILE = "/api/auth/me";
export const ADD_NEW_USER = "/add/user";
export const UPDATE_USER = "/update/user";
export const DELETE_USER = "/delete/user";

// ====================
// BLOG
// ====================
export const GET_VISITOR_DATA = "/visitor-data";

// ====================
// DASHBOARD
// ====================
export const TOP_SELLING_DATA = "/top-selling-data";
export const GET_DASHBOARD_EMAILCHART = "/dashboard/email-chart";
export const GET_WALLET_DATA = "/wallet-balance-data";
export const GET_STATISTICS_DATA = "/Statistics-data";
export const GET_EARNING_DATA = "/earning-charts-data";

// ====================
// COMMENTS
// ====================
export const GET_PRODUCT_COMMENTS = "/comments-product";
export const ON_LIKNE_COMMENT = "/comments-product-action";
export const ON_ADD_REPLY = "/comments-product-add-reply";
export const ON_ADD_COMMENT = "/comments-product-add-comment";