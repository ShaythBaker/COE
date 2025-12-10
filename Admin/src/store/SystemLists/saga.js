// src/store/SystemLists/saga.js

import { call, put, takeEvery } from "redux-saga/effects";
import {
  GET_SYSTEM_LISTS,
  GET_SYSTEM_LIST_ITEMS,
  CREATE_SYSTEM_LIST_ITEM,
  UPDATE_SYSTEM_LIST_ITEM,
} from "./actionTypes";

import {
  getSystemListsSuccess,
  getSystemListsFail,
  getSystemListItemsSuccess,
  getSystemListItemsFail,
  createSystemListItemSuccess,
  createSystemListItemFail,
  updateSystemListItemSuccess,
  updateSystemListItemFail,
} from "./actions";

import {
  getSystemLists as getSystemListsApi,
  getSystemListItems as getSystemListItemsApi,
  createSystemListItem as createSystemListItemApi,
  updateSystemListItem as updateSystemListItemApi,
} from "../../helpers/fakebackend_helper";

function* fetchSystemLists() {
  try {
    const response = yield call(getSystemListsApi, { ACTIVE_STATUS: 1 });
    yield put(getSystemListsSuccess(response));
  } catch (error) {
    yield put(getSystemListsFail(error?.response?.data || error.message));
  }
}

function* fetchSystemListItems({ payload: { listId, options = {} } }) {
  try {
    // Default behavior: only active items
    const params = options.includeInactive ? {} : { ACTIVE_STATUS: 1 };

    const response = yield call(getSystemListItemsApi, listId, params);
    yield put(getSystemListItemsSuccess(response));
  } catch (error) {
    yield put(getSystemListItemsFail(error?.response?.data || error.message));
  }
}

function* onCreateSystemListItem({ payload: { listId, data } }) {
  try {
    const response = yield call(createSystemListItemApi, listId, data);
    yield put(createSystemListItemSuccess(response));
  } catch (error) {
    yield put(createSystemListItemFail(error?.response?.data || error.message));
  }
}

function* onUpdateSystemListItem({ payload: { listId, itemId, data } }) {
  try {
    const response = yield call(updateSystemListItemApi, listId, itemId, data);
    yield put(updateSystemListItemSuccess(response));
  } catch (error) {
    yield put(updateSystemListItemFail(error?.response?.data || error.message));
  }
}

export default function* SystemListsSaga() {
  yield takeEvery(GET_SYSTEM_LISTS, fetchSystemLists);
  yield takeEvery(GET_SYSTEM_LIST_ITEMS, fetchSystemListItems);
  yield takeEvery(CREATE_SYSTEM_LIST_ITEM, onCreateSystemListItem);
  yield takeEvery(UPDATE_SYSTEM_LIST_ITEM, onUpdateSystemListItem);
}
