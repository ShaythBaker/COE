import axios from "axios";
import { del, get, post, put } from "./api_helper";
import * as url from "./url_helper";

// Gets the logged in user data from local session
const getLoggedInUser = () => {
  // use the same key you use in login saga
  const user = localStorage.getItem("authUser");
  if (user) return JSON.parse(user);
  return null;
};

//is user is logged in
const isUserAuthenticated = () => {
  return getLoggedInUser() !== null;
};

// Get list items by LIST_KEY (e.g. USER_DOCUMENTS)
export const getListByKey = (key) =>
  get(`${url.GET_LIST_BY_KEY}/${key}`);

// Attachments upload (multipart/form-data)
export const uploadAttachmentApi = (formData) =>
  post(url.CREATE_ATTACHMENT, formData);

// Attachments GET: /api/attachments/{FILE_ID}/url mockup url
export const getAttachmentUrlApi = (fileId) =>
  get(`${url.GET_ATTACHMENT_URL}/${fileId}/url`);


/**
 * Get attachments for a user and category
 * GET /api/attachments?FILE_CATEGORY=USER_DOCUMENTS&USER_ID={userId}
 */
export const getUserAttachmentsApi = (fileCategory, userId) =>
  get(
    `${url.GET_ATTACHMENT_URL}?FILE_CATEGORY=${encodeURIComponent(
      fileCategory
    )}&USER_ID=${encodeURIComponent(userId)}`
  );

// Register Method
const postFakeRegister = (data) => {
  return axios
    .post(url.POST_FAKE_REGISTER, data)
    .then((response) => {
      if (response.status >= 200 || response.status <= 299)
        return response.data;
      throw response.data;
    })
    .catch((err) => {
      let message;
      if (err.response && err.response.status) {
        switch (err.response.status) {
          case 404:
            message = "Sorry! the page you are looking for could not be found";
            break;
          case 500:
            message =
              "Sorry! something went wrong, please contact our support team";
            break;
          case 401:
            message = "Invalid credentials";
            break;
          default:
            message = err[1];
            break;
        }
      }
      throw message;
    });
};

// Login Method
const postFakeLogin = (data) => post(url.POST_FAKE_LOGIN, data);

//PERMISSIONS
export const getMyPermissions = () => get(url.GET_MY_PERMISSIONS);

// Access Modules (departments) – used for RuleManagement module dropdown
export const getAccessModulesApi = () => {
  return get(url.GET_ACCESS_MODULES); // GET /api/access/modules
};

// Roles list
export const getAccessRolesApi = () => {
  return get(url.GET_ACCESS_ROLES); // GET /api/access/roles
};

// Get all permissions for a specific role
export const getRolePermissionsApi = (roleId) => {
  return get(`${url.ROLE_PERMISSIONS_BASE}/${roleId}/permissions`);
};

// Create a single permission for a role
// POST /api/access/roles/:ROLE_ID/permissions
export const createRolePermissionApi = (roleId, permission) => {
  return post(`${url.ROLE_PERMISSIONS_BASE}/${roleId}/permissions`, permission);
};

// Update permissions for a role (bulk API)
// PUT /api/access/roles/:ROLE_ID/permissions
// We will usually send a single entry in the PERMISSIONS array for the current module.
export const updateRolePermissionsApi = (roleId, permissionsArray) => {
  return put(`${url.ROLE_PERMISSIONS_BASE}/${roleId}/permissions`, {
    PERMISSIONS: permissionsArray,
  });
};



// postForgetPwd
const postFakeForgetPwd = (data) => post(url.POST_FAKE_PASSWORD_FORGET, data);

// Edit profile
const postJwtProfile = (data) => post(url.POST_EDIT_JWT_PROFILE, data);

const postFakeProfile = (data) => post(url.POST_EDIT_PROFILE, data);

// HR roles
export const getHrRoles = () => get(url.GET_HR_ROLES);

// ========================
// HR EMPLOYEES / ROLES API
// ========================

// GET ALL EMPLOYEES
export const getHrEmployeesApi = () => {
  return get(url.GET_HR_EMPLOYEES);
};

// GET SINGLE EMPLOYEE BY ID
export const getHrEmployeeByIdApi = (userId) => {
  return get(`${url.GET_HR_EMPLOYEE}/${userId}`);
};

// GET ROLES
export const getHrRolesApi = () => {
  return get(url.GET_HR_ROLES);
};

// ========================
// HR RULES (Rule Management)
// ========================
//
// These helpers are used by HrRules sagas.
// GET is real (talks to backend).
// CREATE / UPDATE / DELETE are "hybrid":
//   - Try real API.
//   - If 404 / backend not ready, fall back to mock so UI still works.
//

// LIST stays as-is
export const getHrRulesApi = () => {
  return get(url.GET_HR_RULES);
};

// CREATE single permission for a role
// POST /api/access/roles/:ROLE_ID/permissions
export const createHrRuleApi = async (rule) => {
  const roleId = rule.ROLE_ID || rule.roleId;
  if (!roleId) {
    throw new Error("[HrRules] createHrRuleApi: ROLE_ID is required");
  }

  const payload = {
    MODULE_ID: Number(rule.MODULE_ID),
    CAN_VIEW: rule.CAN_VIEW ? 1 : 0,
    CAN_CREATE: rule.CAN_CREATE ? 1 : 0,
    CAN_EDIT: rule.CAN_EDIT ? 1 : 0,
    CAN_DELETE: rule.CAN_DELETE ? 1 : 0,
    ACTIVE_STATUS: 1,
  };

  return post(`${url.ROLE_PERMISSIONS_BASE}/${roleId}/permissions`, payload);
};

// UPDATE single permission for a role (bulk API, but we send one entry)
// PUT /api/access/roles/:ROLE_ID/permissions
export const updateHrRuleApi = async (rule) => {
  const roleId = rule.ROLE_ID || rule.roleId;
  if (!roleId) {
    throw new Error("[HrRules] updateHrRuleApi: ROLE_ID is required");
  }

  const payload = {
    MODULE_ID: Number(rule.MODULE_ID),
    CAN_VIEW: rule.CAN_VIEW ? 1 : 0,
    CAN_CREATE: rule.CAN_CREATE ? 1 : 0,
    CAN_EDIT: rule.CAN_EDIT ? 1 : 0,
    CAN_DELETE: rule.CAN_DELETE ? 1 : 0,
    ACTIVE_STATUS: rule.ACTIVE_STATUS ?? 1,
  };

  return put(`${url.ROLE_PERMISSIONS_BASE}/${roleId}/permissions`, {
    PERMISSIONS: [payload],
  });
};

// "DELETE" = disable permission by setting ACTIVE_STATUS=0 and all CAN_* = 0
// via the same PUT /api/access/roles/:ROLE_ID/permissions
export const deleteHrRuleApi = async (rule) => {
  const roleId = rule.ROLE_ID || rule.roleId;
  if (!roleId) {
    throw new Error("[HrRules] deleteHrRuleApi: ROLE_ID is required");
  }

  const payload = {
    MODULE_ID: Number(rule.MODULE_ID),
    CAN_VIEW: 0,
    CAN_CREATE: 0,
    CAN_EDIT: 0,
    CAN_DELETE: 0,
    ACTIVE_STATUS: 0,
  };

  return put(`${url.ROLE_PERMISSIONS_BASE}/${roleId}/permissions`, {
    PERMISSIONS: [payload],
  });
};

// CREATE EMPLOYEE
export const createHrEmployeeApi = (data) => {
  return post(url.CREATE_HR_EMPLOYEE, data);
};

// UPDATE EMPLOYEE
export const updateHrEmployeeApi = (id, data) => {
  return put(`${url.GET_HR_EMPLOYEE}/${id}`, data,{
   
});
};


// ========================
// HOTELS (CONTRACTING)
// ========================

export const getHotelsApi = (params = {}) => {
  // Clean params so we never send empty query values
  const query = {};

  // Only include if not empty/null/undefined
  if (
    params.ACTIVE_STATUS !== undefined &&
    params.ACTIVE_STATUS !== null &&
    params.ACTIVE_STATUS !== ""
  ) {
    query.ACTIVE_STATUS = params.ACTIVE_STATUS;
  }

  if (params.HOTEL_AREA !== undefined && params.HOTEL_AREA !== null && params.HOTEL_AREA !== "") {
    query.HOTEL_AREA = params.HOTEL_AREA;
  }

  if (params.HOTEL_STARS !== undefined && params.HOTEL_STARS !== null && params.HOTEL_STARS !== "") {
    query.HOTEL_STARS = params.HOTEL_STARS;
  }

  return get(url.GET_HOTELS, { params: query });
};

// ✅ Hotels create API: POST /api/hotels
export const createHotel = (data) => post(url.HOTELS, data);

export const getHotelById = (hotelId) =>
  get(`${url.HOTELS}/${hotelId}`);



// Register Method
const postJwtRegister = (urlParam, data) => {
  return axios
    .post(urlParam, data)
    .then((response) => {
      if (response.status >= 200 || response.status <= 299)
        return response.data;
      throw response.data;
    })
    .catch((err) => {
      var message;
      if (err.response && err.response.status) {
        switch (err.response.status) {
          case 404:
            message = "Sorry! the page you are looking for could not be found";
            break;
          case 500:
            message =
              "Sorry! something went wrong, please contact our support team";
            break;
          case 401:
            message = "Invalid credentials";
            break;
          default:
            message = err[1];
            break;
        }
      }
      throw message;
    });
};

// Login Method
const postJwtLogin = (data) => post(url.POST_FAKE_JWT_LOGIN, data);

// postForgetPwd
const postJwtForgetPwd = (data) =>
  post(url.POST_FAKE_JWT_PASSWORD_FORGET, data);

// postSocialLogin
export const postSocialLogin = (data) => post(url.SOCIAL_LOGIN, data);

// get Products
export const getProducts = () => get(url.GET_PRODUCTS);

// get Product detail
export const getProductDetail = (id) =>
  get(`${url.GET_PRODUCTS_DETAIL}/${id}`, { params: { id } });

// get Events
export const getEvents = () => get(url.GET_EVENTS);

// add Events
export const addNewEvent = (event) => post(url.ADD_NEW_EVENT, event);

// update Event
export const updateEvent = (event) => put(url.UPDATE_EVENT, event);

// delete Event
export const deleteEvent = (event) =>
  del(url.DELETE_EVENT, { headers: { event } });

// get Categories
export const getCategories = () => get(url.GET_CATEGORIES);

//Email Chart
export const getDashboardEmailChart = (chartType) =>
  get(`${url.GET_DASHBOARD_EMAILCHART}/${chartType}`, { param: chartType });

// get chats
export const getChats = () => get(url.GET_CHATS);

// get groups
export const getGroups = () => get(url.GET_GROUPS);

// get Contacts
export const getContacts = () => get(url.GET_CONTACTS);

// get messages
export const getMessages = (roomId) =>
  get(`${url.GET_MESSAGES}/${roomId}`, { params: { roomId } });

// post messages
export const getselectedmails = (selectedmails) =>
  post(url.GET_SELECTED_MAILS, selectedmails);

//post setfolderonmails
export const setfolderonmails = (selectedmails, folderId, activeTab) =>
  post(url.SET_FOLDER_SELECTED_MAILS, { selectedmails, folderId, activeTab });

// get orders
export const getOrders = () => get(url.GET_ORDERS);

// add order
export const addNewOrder = (order) => post(url.ADD_NEW_ORDER, order);

// update order
export const updateOrder = (order) => put(url.UPDATE_ORDER, order);

// delete order
export const deleteOrder = (order) =>
  del(url.DELETE_ORDER, { headers: { order } });

// get cart data
export const getCartData = () => get(url.GET_CART_DATA);

// get customers
export const getCustomers = () => get(url.GET_CUSTOMERS);

// add CUSTOMER
export const addNewCustomer = (customer) =>
  post(url.ADD_NEW_CUSTOMER, customer);

// update CUSTOMER
export const updateCustomer = (customer) => put(url.UPDATE_CUSTOMER, customer);

// delete CUSTOMER
export const deleteCustomer = (customer) =>
  del(url.DELETE_CUSTOMER, { headers: { customer } });

// get shops
export const getShops = () => get(url.GET_SHOPS);

// get wallet
export const getWallet = () => get(url.GET_WALLET);

// get crypto order
export const getCryptoOrder = () => get(url.GET_CRYPTO_ORDERS);

// get crypto product
export const getCryptoProduct = () => get(url.GET_CRYPTO_PRODUCTS);

// get invoices
export const getInvoices = () => get(url.GET_INVOICES);

// get invoice details
export const getInvoiceDetail = (id) =>
  get(`${url.GET_INVOICE_DETAIL}/${id}`, { params: { id } });

// get jobs
export const getJobList = () => get(url.GET_JOB_LIST);

// get Apply Jobs
export const getApplyJob = () => get(url.GET_APPLY_JOB);

// get project
export const getProjects = () => get(url.GET_PROJECTS);

// get project details
export const getProjectsDetails = (id) =>
  get(`${url.GET_PROJECT_DETAIL}/${id}`, { params: { id } });

// get tasks
export const getTasks = () => get(url.GET_TASKS);

// add CardData Kanban
export const addCardData = (cardData) => post(url.ADD_CARD_DATA, cardData);

// update jobs
export const updateCardData = (card) => put(url.UPDATE_CARD_DATA, card);

// delete Kanban
export const deleteKanban = (kanban) =>
  del(url.DELETE_KANBAN, { headers: { kanban } });

// get contacts
export const getUsers = () => get(url.GET_USERS);

// add user
export const addNewUser = (user) => post(url.ADD_NEW_USER, user);

// update user
export const updateUser = (user) => put(url.UPDATE_USER, user);

// delete user
export const deleteUser = (user) => del(url.DELETE_USER, { headers: { user } });

// add jobs
export const addNewJobList = (job) => post(url.ADD_NEW_JOB_LIST, job);

// update jobs
export const updateJobList = (job) => put(url.UPDATE_JOB_LIST, job);

// delete jobs
export const deleteJobList = (job) =>
  del(url.DELETE_JOB_LIST, { headers: { job } });

// Delete Apply Jobs
export const deleteApplyJob = (data) =>
  del(url.DELETE_APPLY_JOB, { headers: { data } });

/** PROJECT */

// update user
export const updateProject = (project) => put(url.UPDATE_PROJECT, project);

// delete user
export const deleteProject = (project) =>
  del(url.DELETE_PROJECT, { headers: { project } });

export const getUserProfile = () => get(url.GET_USER_PROFILE);

// get maillist
export const getMailsLists = (filter) =>
  post(url.GET_MAILS_LIST, { params: filter });

//update mail
export const deleteMail = (mail) => del(url.DELETE_MAIL, { headers: { mail } });
export const trashMail = (mail) => del(url.TRASH_MAIL, { headers: { mail } });
export const staredMail = (mail) => del(url.STARED_MAIL, { headers: { mail } });
export const getMailsListsId = (id) =>
  get(`${url.GET_MAILS_ID}/${id}`, { params: { id } });

// ===== System Lists (dynamic lists) =====

// GET /api/lists?ACTIVE_STATUS=1
const getSystemLists = (params) => get(url.GET_SYSTEM_LISTS, { params });

// GET /api/lists/by-key/:LIST_KEY

export const getSystemListItems = (listKey, params) =>
  get(`${url.GET_SYSTEM_LIST_ITEMS}/${listKey}`, { params });

// POST /api/lists/:LIST_ID/items
const createSystemListItem = (listId, data) =>
  post(`${url.GET_SYSTEM_LIST_ITEMS}/${listId}/items`, data);

// PUT /api/lists/:LIST_ID/items/:ITEM_ID
const updateSystemListItem = (listId, itemId, data) =>
  put(`${url.GET_SYSTEM_LIST_ITEMS}/${listId}/items/${itemId}`, data);

// get folderlist
export const selectFolders = () => get(url.SELECT_FOLDER);

// post messages
export const addMessage = (message) => post(url.ADD_MESSAGE, message);
// delete message
export const deleteMessage = (data) =>
  del(url.DELETE_MESSAGE, { headers: { data } });

export const walletBalanceData = (roomId) =>
  get(`${url.GET_WALLET_DATA}/${roomId}`, { params: { roomId } });

export const getStatisticData = (roomId) =>
  get(`${url.GET_STATISTICS_DATA}/${roomId}`, { params: { roomId } });

export const visitorData = (roomId) =>
  get(`${url.GET_VISITOR_DATA}/${roomId}`, { params: { roomId } });

export const topSellingData = (month) =>
  get(`${url.TOP_SELLING_DATA}/${month}`, { params: { month } });

export const getEarningChartsData = (month) =>
  get(`${url.GET_EARNING_DATA}/${month}`, { params: { month } });

const getProductComents = () => get(url.GET_PRODUCT_COMMENTS);

const onLikeComment = (commentId, productId) => {
  return post(`${url.ON_LIKNE_COMMENT}/${productId}/${commentId}`, {
    params: { commentId, productId },
  });
};
const onLikeReply = (commentId, productId, replyId) => {
  return post(`${url.ON_LIKNE_COMMENT}/${productId}/${commentId}/${replyId}`, {
    params: { commentId, productId, replyId },
  });
};

const onAddReply = (commentId, productId, replyText) => {
  return post(`${url.ON_ADD_REPLY}/${productId}/${commentId}`, {
    params: { commentId, productId, replyText },
  });
};

const onAddComment = (productId, commentText) => {
  return post(`${url.ON_ADD_COMMENT}/${productId}`, {
    params: { productId, commentText },
  });
};

export {
  getLoggedInUser,
  isUserAuthenticated,
  postFakeRegister,
  postFakeLogin,
  postFakeProfile,
  postFakeForgetPwd,
  postJwtRegister,
  postJwtLogin,
  postJwtForgetPwd,
  postJwtProfile,
  getProductComents,
  onLikeComment,
  onLikeReply,
  onAddReply,
  onAddComment,
  getSystemLists,
  //getSystemListItems,
  createSystemListItem,
  updateSystemListItem,
};
