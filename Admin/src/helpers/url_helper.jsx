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
export const GET_HR_RULES = GET_HR_ROLES;
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
// HOTEL SEASON RATES
// ====================

// Rates are nested inside seasons
// /api/hotels/:HOTEL_ID/seasons/:SEASON_ID/rates
export const HOTEL_SEASON_RATES_BASE = "/api/hotels";
// ====================
// HOTEL ADDITIONAL SEVICES
// ====================

// /api/hotels/:HOTEL_ID/additional-services
export const HOTEL_ADDITIONAL_SERVICES_BASE = "/api/hotels";

// ====================
// CLIENTS
// ====================

// Clients
export const GET_CLIENTS = "/api/clients";
export const GET_CLIENT_BY_ID = "/api/clients"; // use /:CLIENT_ID

// Guides
export const GET_GUIDES = "/api/guides";
export const GET_GUIDE_BY_ID = "/api/guides"; // use with /:GUIDE_ID
export const CREATE_GUIDE = "/api/guides";
export const UPDATE_GUIDE = "/api/guides"; // use with /:GUIDE_ID
export const DELETE_GUIDE = "/api/guides"; // use with /:GUIDE_ID

// ========================
// TRANSPORTATION (CONTRACTING)
// ========================
export const TRANSPORTATION_BASE = "/api/transportation";

// Companies
export const TRANSPORTATION_COMPANIES = `${TRANSPORTATION_BASE}/companies`; // GET, POST

// Contracts (nested + direct)
export const TRANSPORTATION_COMPANY_CONTRACTS = `${TRANSPORTATION_BASE}/companies`; // /:companyId/contracts
export const TRANSPORTATION_CONTRACTS = `${TRANSPORTATION_BASE}/contracts`; // /:contractId

// Vehicles (nested + direct)
export const TRANSPORTATION_COMPANY_VEHICLES = `${TRANSPORTATION_BASE}/companies`; // /:companyId/vehicles
export const TRANSPORTATION_VEHICLES = `${TRANSPORTATION_BASE}/vehicles`; // /:vehicleId

// Transportation Fees
export const GET_TRANSPORTATION_COMPANY_FEES = "/api/transportation/companies"; // /:TRANSPORTATION_COMPANY_ID/fees?ACTIVE_STATSUS=
export const GET_TRANSPORTATION_FEE_BY_ID = "/api/transportation/fees"; // /:TRANSPORTATION_FEE_ID
export const UPDATE_TRANSPORTATION_FEE = "/api/transportation/fees"; // /:TRANSPORTATION_FEE_ID
export const DELETE_TRANSPORTATION_FEE = "/api/transportation/fees"; // /:TRANSPORTATION_FEE_ID

// ====================

// ====================
// PLACES
// ====================
export const PLACES = "/api/places";
export const GET_PLACES = "/api/places"; // list (supports ?PLACE_AREA_ID=)
export const GET_PLACE_BY_ID = "/api/places"; // use `${GET_PLACE_BY_ID}/${PLACE_ID}`

// Dynamic list (company-wide filters via query params)
export const PLACES_ENTRANCE_FEES_DYNAMIC = "/api/places/entrance-fees";

// Place-scoped entrance fees
// Use with: `${PLACES_BASE}/${placeId}/entrance-fees`
export const PLACES_BASE = "/api/places";

// ====================

// ====================
// ROUTES
// ====================

// Routes (Trips)
export const GET_ROUTES = "/api/routes"; // list + create
export const GET_ROUTE_DETAIL = "/api/routes"; // + /:id

// ====================

//===================
//RESTAURANTS
//===================

// Restaurants (Contracting)
export const RESTAURANTS = "/api/restaurants";
export const GET_RESTAURANTS = "/api/restaurants";

// Restaurants Meals
export const RESTAURANTS_MEALS = "/api/restaurants/meals";



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
