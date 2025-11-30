// src/components/Auth/RequireModule.jsx
import React from "react";
import Pages404 from "../../pages/Utility/pages-404";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";

const permissionsSelector = createSelector(
  (state) => state.Permissions,
  (perm) => ({
    loading: perm.loading,
    error: perm.error,
    modules: perm.modules || [],
  })
);

const RequireModule = ({ moduleCode, children }) => {
  const { loading, modules } = useSelector(permissionsSelector);

  // Global "admin" – has ACCESS_ROLES
  const isAccessAdmin = modules.some(
    (m) => m.MODULE_CODE === "ACCESS_ROLES" && m.CAN_VIEW
  );

  const hasModule = (code) =>
    isAccessAdmin || modules.some((m) => m.MODULE_CODE === code && m.CAN_VIEW);

  // While first load, avoid flicker
  if (loading && modules.length === 0) {
    return null; // or a spinner
  }

  // Debug: uncomment if you want to see what is happening
  console.log("RequireModule:", {
    moduleCode,
    modules,
    isAccessAdmin,
    has: hasModule(moduleCode),
  });

  // No permission → 404 page
  if (!hasModule(moduleCode)) {
    return <Pages404 />;
  }

  // Allowed
  return <>{children}</>;
};

export default RequireModule;
