// src/store/auth/login/saga.js
import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import { LOGIN_USER, LOGOUT_USER, SOCIAL_LOGIN } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";

import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
  postSocialLogin,
} from "../../../helpers/fakebackend_helper";

import { loadMyPermissions } from "../../permissions/actions";

const fireBaseBackend = getFirebaseBackend();

function* loginUser({ payload: { user, history } }) {
  try {
    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(
        fireBaseBackend.loginUser,
        user.email,
        user.password
      );
      yield put(loginSuccess(response));
    } else if (import.meta.env.VITE_APP_DEFAULTAUTH === "jwt") {
      // REAL BACKEND
      const response = yield call(postJwtLogin, {
        email: user.email,
        password: user.password,
      });
      // response is backend JSON body
      localStorage.setItem("authUser", JSON.stringify(response));

      yield put(loginSuccess(response));
      yield put(loadMyPermissions());
    } else if (import.meta.env.VITE_APP_DEFAULTAUTH === "fake") {
      const response = yield call(postFakeLogin, {
        email: user.email,
        password: user.password,
      });
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    }

    history("/dashboard");
  } catch (error) {
    let message;

    if (import.meta.env.VITE_APP_DEFAULTAUTH === "jwt") {
      message =
        error?.response?.data?.message || error?.message || "Login failed";
    } else if (Array.isArray(error)) {
      // fake backend rejects as [statusCode, "msg"]
      message = error[1] || error[0] || "Login failed";
    } else {
      message = error?.message || "Login failed";
    }

    yield put(apiError(message));
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    localStorage.removeItem("authUser");

    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(fireBaseBackend.logout);
      yield put(logoutUserSuccess(response));
    }
    history("/login");
  } catch (error) {
    yield put(apiError(error?.message || "Logout failed"));
  }
}

function* socialLogin({ payload: { type, history } }) {
  try {
    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      const response = yield call(fireBaseBackend.socialLoginUser, type);
      if (response) {
        history("/dashboard");
      } else {
        history("/login");
      }
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    }
  } catch (error) {
    yield put(apiError(error?.message || "Social login failed"));
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeLatest(SOCIAL_LOGIN, socialLogin);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;
