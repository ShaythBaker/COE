// src/store/SystemLists/actions.js
import {
  GET_SYSTEM_LISTS,
  GET_SYSTEM_LISTS_SUCCESS,
  GET_SYSTEM_LISTS_FAIL,
  GET_SYSTEM_LIST_ITEMS,
  GET_SYSTEM_LIST_ITEMS_SUCCESS,
  GET_SYSTEM_LIST_ITEMS_FAIL,
  CREATE_SYSTEM_LIST_ITEM,
  CREATE_SYSTEM_LIST_ITEM_SUCCESS,
  CREATE_SYSTEM_LIST_ITEM_FAIL,
  UPDATE_SYSTEM_LIST_ITEM,
  UPDATE_SYSTEM_LIST_ITEM_SUCCESS,
  UPDATE_SYSTEM_LIST_ITEM_FAIL,
  GET_SYSTEM_LIST_ITEMS_BY_ID,
} from "./actionTypes";

export const getSystemListItemsById = (listId, options = {}) => ({
  type: GET_SYSTEM_LIST_ITEMS_BY_ID,
  payload: { listId, options },
});

// Lists
export const getSystemLists = () => ({
  type: GET_SYSTEM_LISTS,
});

export const getSystemListsSuccess = (lists) => ({
  type: GET_SYSTEM_LISTS_SUCCESS,
  payload: lists,
});

export const getSystemListsFail = (error) => ({
  type: GET_SYSTEM_LISTS_FAIL,
  payload: error,
});

// Items
export const getSystemListItems = (listId, options = {}) => ({
  type: GET_SYSTEM_LIST_ITEMS,
  payload: { listId, options },
});

export const getSystemListItemsSuccess = (items) => ({
  type: GET_SYSTEM_LIST_ITEMS_SUCCESS,
  payload: items,
});

export const getSystemListItemsFail = (error) => ({
  type: GET_SYSTEM_LIST_ITEMS_FAIL,
  payload: error,
});

// Create item
export const createSystemListItem = (listId, data) => ({
  type: CREATE_SYSTEM_LIST_ITEM,
  payload: { listId, data },
});

export const createSystemListItemSuccess = (item) => ({
  type: CREATE_SYSTEM_LIST_ITEM_SUCCESS,
  payload: item,
});

export const createSystemListItemFail = (error) => ({
  type: CREATE_SYSTEM_LIST_ITEM_FAIL,
  payload: error,
});

// Update item
export const updateSystemListItem = (listId, itemId, data) => ({
  type: UPDATE_SYSTEM_LIST_ITEM,
  payload: { listId, itemId, data },
});

export const updateSystemListItemSuccess = (item) => ({
  type: UPDATE_SYSTEM_LIST_ITEM_SUCCESS,
  payload: item,
});

export const updateSystemListItemFail = (error) => ({
  type: UPDATE_SYSTEM_LIST_ITEM_FAIL,
  payload: error,
});
