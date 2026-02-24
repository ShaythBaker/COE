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

export const usePermissions = () => {
  const { loading, error, modules } = useSelector(permissionsSelector);

  const isAccessAdmin = modules.some(
    (m) => m.MODULE_CODE === "ACCESS_ROLES" && m.CAN_VIEW
  );

  const hasModule = (code) =>
    isAccessAdmin || modules.some((m) => m.MODULE_CODE === code && m.CAN_VIEW);

  const moduleByCode = (code) =>
    modules.find((m) => m.MODULE_CODE === code) || null;

  const canCreate = (code) => {
    if (isAccessAdmin) return true;
    const m = moduleByCode(code);
    return !!(m && m.CAN_CREATE);
  };

  const canEdit = (code) => {
    if (isAccessAdmin) return true;
    const m = moduleByCode(code);
    return !!(m && m.CAN_EDIT);
  };

  const canDelete = (code) => {
    if (isAccessAdmin) return true;
    const m = moduleByCode(code);
    return !!(m && m.CAN_DELETE);
  };

  return {
    loading,
    error,
    modules,
    isAccessAdmin,
    hasModule,
    canCreate,
    canEdit,
    canDelete,
  };
};
