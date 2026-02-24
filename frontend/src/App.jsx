// src/App.jsx
import PropTypes from "prop-types";
import React, { useEffect } from "react";

import { Routes, Route } from "react-router-dom";
import { connect, useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

//import toast message
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// Import Routes all
import { authProtectedRoutes, publicRoutes } from "./routes/index";

// Import all middleware
import Authmiddleware from "./routes/route";
import { loadMyPermissions } from "./store/permissions/actions";

// layouts Format
import VerticalLayout from "./components/VerticalLayout/";
import HorizontalLayout from "./components/HorizontalLayout/";
import NonAuthLayout from "./components/NonAuthLayout";

// Import scss
import "./assets/scss/theme.scss";

// Fake backend (kept as in template; with onNoMatch:'passthrough' it won't block /api/*)
import fakeBackend from "./helpers/AuthType/fakeBackend";
fakeBackend();

const App = (props) => {
  const dispatch = useDispatch();

  // Load permissions once when app mounts (if user is logged in)
  useEffect(() => {
    const raw = localStorage.getItem("authUser");
    if (raw) {
      dispatch(loadMyPermissions());
    }
  }, [dispatch]);

  const LayoutProperties = createSelector(
    (state) => state.Layout,
    (layout) => ({
      layoutType: layout.layoutType,
    })
  );

  const { layoutType } = useSelector(LayoutProperties);

  function getLayout(layoutType) {
    let layoutCls = VerticalLayout;
    switch (layoutType) {
      case "horizontal":
        layoutCls = HorizontalLayout;
        break;
      default:
        layoutCls = VerticalLayout;
        break;
    }
    return layoutCls;
  }

  const Layout = getLayout(layoutType);

  return (
    <React.Fragment>
      <Routes>
        {publicRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={<NonAuthLayout>{route.component}</NonAuthLayout>}
            key={idx}
          />
        ))}

        {authProtectedRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={
              <Authmiddleware>
                <Layout>{route.component}</Layout>
              </Authmiddleware>
            }
            key={idx}
            exact={true}
          />
        ))}
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </React.Fragment>
  );
};

App.propTypes = {
  layout: PropTypes.any,
};

const mapStateToProps = (state) => {
  return {
    layout: state.Layout,
  };
};

export default connect(mapStateToProps, null)(App);
