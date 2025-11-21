// src/store/auth/profile/saga.js

import { takeEvery, fork, put, all, call } from "redux-saga/effects";
import { EDIT_PROFILE } from "./actionTypes";
import { profileSuccess, profileError } from "./actions";

import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeProfile,
  postJwtProfile,
} from "../../../helpers/fakebackend_helper";

const fireBaseBackend = getFirebaseBackend();

function* editProfile({ payload: { user } }) {
  try {
    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(
        fireBaseBackend.editProfileAPI,
        user.firstName, // or username depending on your firebase logic
        user.idx
      );
      yield put(profileSuccess(response));
    } else if (import.meta.env.VITE_APP_DEFAULTAUTH === "jwt") {
      // REAL BACKEND: POST /api/auth/profile
      const response = yield call(postJwtProfile, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        departmentId: user.departmentId,
        idx: user.idx,
      });
      // e.g. response = "Profile Updated Successfully"

      // Update authUser in localStorage
      const raw = localStorage.getItem("authUser");
      if (raw) {
        const authUser = JSON.parse(raw);
        const u = authUser.user || authUser.USER || {};

        u.FIRST_NAME = user.firstName;
        u.LAST_NAME = user.lastName;
        u.EMAIL = user.email;
        u.PHONE_NUMBER = user.phoneNumber;
        u.DEPATRMENT_ID = user.departmentId;

        authUser.user = u;
        authUser.USER = u;
        // optional convenience name
        authUser.username =
          (user.firstName || "") +
          (user.lastName ? ` ${user.lastName}` : "");

        localStorage.setItem("authUser", JSON.stringify(authUser));
      }

      yield put(profileSuccess(response)); // string
    } else if (import.meta.env.VITE_APP_DEFAULTAUTH === "fake") {
      const response = yield call(postFakeProfile, {
        username: user.firstName, // original fake flow only uses username + idx
        idx: user.idx,
      });
      yield put(profileSuccess(response));
    }
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to update profile";
    yield put(profileError(msg));
  }
}

export function* watchProfile() {
  yield takeEvery(EDIT_PROFILE, editProfile);
}

function* ProfileSaga() {
  yield all([fork(watchProfile)]);
}

export default ProfileSaga;
