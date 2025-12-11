// src/store/SystemLists/reducer.js

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
} from "./actionTypes";

const INIT_STATE = {
  lists: [],
  items: [],
  loadingLists: false,
  loadingItems: false,
  savingItem: false,
  error: null,
};

const SystemLists = (state = INIT_STATE, action) => {
  switch (action.type) {
    case GET_SYSTEM_LISTS:
      return {
        ...state,
        loadingLists: true,
        error: null,
      };
    case GET_SYSTEM_LISTS_SUCCESS:
      return {
        ...state,
        loadingLists: false,
        lists: action.payload || [],
        error: null,
      };
    case GET_SYSTEM_LISTS_FAIL:
      return {
        ...state,
        loadingLists: false,
        error: action.payload,
      };

    case GET_SYSTEM_LIST_ITEMS:
      return {
        ...state,
        loadingItems: true,
        error: null,
      };
    case GET_SYSTEM_LIST_ITEMS_SUCCESS:
      return {
        ...state,
        loadingItems: false,
        items: action.payload || [],
        error: null,
      };
    case GET_SYSTEM_LIST_ITEMS_FAIL:
      return {
        ...state,
        loadingItems: false,
        error: action.payload,
      };

    case CREATE_SYSTEM_LIST_ITEM:
    case UPDATE_SYSTEM_LIST_ITEM:
      return {
        ...state,
        savingItem: true,
        error: null,
      };

    case CREATE_SYSTEM_LIST_ITEM_SUCCESS:
      return {
        ...state,
        savingItem: false,
        items: [...state.items, action.payload],
      };

    case UPDATE_SYSTEM_LIST_ITEM_SUCCESS:
      return {
        ...state,
        savingItem: false,
        items: state.items.map((it) =>
          it.LIST_ITEM_ID === action.payload.LIST_ITEM_ID ? action.payload : it
        ),
      };

    case CREATE_SYSTEM_LIST_ITEM_FAIL:
    case UPDATE_SYSTEM_LIST_ITEM_FAIL:
      return {
        ...state,
        savingItem: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default SystemLists;
