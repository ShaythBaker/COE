// src/helpers/auth_helper.jsx
export const getLoggedInUserObject = () => {
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const currentUserRoles = () => {
  const auth = getLoggedInUserObject();
  const roles = auth?.USER?.ROLES || [];
  return roles;
};

export const hasRoleId = (id) => {
  return currentUserRoles().some((r) => Number(r.ROLE_ID) === Number(id));
};

export const isHrAdminOrSysAdmin = () => {
  return hasRoleId(1) || hasRoleId(5);
};
