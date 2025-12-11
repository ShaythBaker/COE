// src/pages/HR/RuleManagementModuleRoles.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Table,
  Button,
  Spinner,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Input,
  Label,
} from "reactstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Breadcrumbs from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import {
  getAccessModulesApi,
  getAccessRolesApi,
  getRolePermissionsApi,
  createRolePermissionApi,
  updateRolePermissionsApi,
} from "../../helpers/fakebackend_helper";

const RuleManagementModuleRolesInner = () => {
  const { moduleId } = useParams();
  const numericModuleId = Number(moduleId);
  const location = useLocation();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);

  const [rows, setRows] = useState([]); // [{ role, permission }]
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formValues, setFormValues] = useState({
    CAN_VIEW: false,
    CAN_CREATE: false,
    CAN_EDIT: false,
    CAN_DELETE: false,
    ACTIVE_STATUS: true,
  });

  // From navigation state if available (for breadcrumb display)
  const moduleFromState = location.state?.module;

  const currentModule = useMemo(() => {
    if (moduleFromState && moduleFromState.MODULE_ID === numericModuleId) {
      return moduleFromState;
    }
    return (
      modules.find(
        (m) => String(m.MODULE_ID) === String(numericModuleId)
      ) || null
    );
  }, [moduleFromState, modules, numericModuleId]);

  const [breadcrumbItems] = useState([
    { title: "System Configuration", link: "#" },
    { title: "Rule Management", link: "/system-configuration/rule-management" },
    {
      title:
        currentModule?.MODULE_NAME ||
        currentModule?.MODULE_CODE ||
        "Module Permissions",
      link: "#",
    },
  ]);

  const asBool = (v) => v === 1 || v === true;

  const loadData = async () => {
    if (!numericModuleId) return;

    try {
      setLoading(true);
      setError(null);

      // 1) Load modules + roles in parallel
      const [modulesRes, rolesRes] = await Promise.all([
        getAccessModulesApi(),
        getAccessRolesApi(),
      ]);

      const modulesList = modulesRes?.data || modulesRes || [];
      const rolesList = rolesRes?.data || rolesRes || [];

      setModules(Array.isArray(modulesList) ? modulesList : []);
      setRoles(Array.isArray(rolesList) ? rolesList : []);

      // 2) For each role, load permissions and pick the one for this module
      const permissionRows = await Promise.all(
        (Array.isArray(rolesList) ? rolesList : []).map(async (role) => {
          try {
            const permRes = await getRolePermissionsApi(role.ROLE_ID);
            const permData = permRes?.data || permRes || {};
            const perms = Array.isArray(permData.PERMISSIONS)
              ? permData.PERMISSIONS
              : [];

            const modulePermission = perms.find(
              (p) => String(p.MODULE_ID) === String(numericModuleId)
            );

            return {
              role,
              permission: modulePermission || null,
            };
          } catch (e) {
            console.error(
              `Failed to load permissions for role ${role.ROLE_ID}`,
              e
            );
            return { role, permission: null };
          }
        })
      );

      setRows(permissionRows);
    } catch (e) {
      console.error("Failed to load module roles/permissions:", e);
      setError(e?.response?.data || e.message || "Failed to load data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Rule Management | Skote";
    loadData();
  }, [numericModuleId]);

  const toggleEditModal = () => {
    setEditModalOpen(!editModalOpen);
  };

  const handleEditClick = (role, permission) => {
    setEditingRole(role);

    setFormValues({
      CAN_VIEW: asBool(permission?.CAN_VIEW),
      CAN_CREATE: asBool(permission?.CAN_CREATE),
      CAN_EDIT: asBool(permission?.CAN_EDIT),
      CAN_DELETE: asBool(permission?.CAN_DELETE),
      ACTIVE_STATUS:
        permission?.PERMISSION_ACTIVE_STATUS === 0 ? false : true,
    });

    setEditModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRole || !numericModuleId) return;

    const payload = {
      MODULE_ID: numericModuleId,
      CAN_VIEW: formValues.CAN_VIEW ? 1 : 0,
      CAN_CREATE: formValues.CAN_CREATE ? 1 : 0,
      CAN_EDIT: formValues.CAN_EDIT ? 1 : 0,
      CAN_DELETE: formValues.CAN_DELETE ? 1 : 0,
      ACTIVE_STATUS: formValues.ACTIVE_STATUS ? 1 : 0,
    };

    // Check if existing permission row is present
    const existing = rows.find(
      (r) => r.role.ROLE_ID === editingRole.ROLE_ID
    )?.permission;

    try {
      setSaving(true);
      setError(null);

      if (existing) {
        // Update via bulk PUT (sending one entry)
        await updateRolePermissionsApi(editingRole.ROLE_ID, [payload]);
      } else {
        // Create via POST
        await createRolePermissionApi(editingRole.ROLE_ID, payload);
      }

      setEditModalOpen(false);
      setEditingRole(null);
      // Refresh table
      await loadData();
    } catch (e2) {
      console.error("Failed to save permission:", e2);
      setError(e2?.response?.data || e2.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/system-configuration/rule-management");
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Breadcrumbs
          title="System Configuration"
          breadcrumbItems={breadcrumbItems}
        />

        <Row>
          <Col lg="12">
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="card-title mb-0">
                    Rule Management –{" "}
                    {currentModule
                      ? currentModule.MODULE_NAME || currentModule.MODULE_CODE
                      : "Module"}
                  </h4>
                  {currentModule && (
                    <small className="text-muted">
                      {currentModule.DESCRIPTION ||
                        currentModule.MODULE_DESCRIPTION}
                    </small>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Button color="secondary" size="sm" onClick={handleBack}>
                    Back to Modules
                  </Button>
                </div>
              </CardHeader>

              <CardBody>
                {error && (
                  <Alert color="danger" className="mb-3">
                    {String(error)}
                  </Alert>
                )}

                <div className="table-responsive">
                  <Table className="table table-bordered table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "60px" }}>#</th>
                        <th>Role</th>
                        <th>View</th>
                        <th>Create</th>
                        <th>Edit</th>
                        <th>Delete</th>
                        <th>Status</th>
                        <th style={{ width: "120px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center">
                            <Spinner size="sm" className="me-2" />
                            Loading roles & permissions...
                          </td>
                        </tr>
                      ) : rows && rows.length > 0 ? (
                        rows.map(({ role, permission }, index) => (
                          <tr key={role.ROLE_ID ?? index}>
                            <td>{index + 1}</td>
                            <td>
                              {role.ROLE_NAME}{" "}
                              <small className="text-muted">
                                ({role.ROLE_CODE})
                              </small>
                            </td>
                            <td>{asBool(permission?.CAN_VIEW) ? "Yes" : "No"}</td>
                            <td>
                              {asBool(permission?.CAN_CREATE) ? "Yes" : "No"}
                            </td>
                            <td>{asBool(permission?.CAN_EDIT) ? "Yes" : "No"}</td>
                            <td>
                              {asBool(permission?.CAN_DELETE) ? "Yes" : "No"}
                            </td>
                            <td>
                              {permission &&
                              permission.PERMISSION_ACTIVE_STATUS === 0 ? (
                                <span className="badge bg-secondary">
                                  Inactive
                                </span>
                              ) : permission ? (
                                <span className="badge bg-success">
                                  Active
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted">
                                  No permission
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <i
                                className="bx bx-edit text-primary"
                                style={{
                                  cursor: "pointer",
                                  fontSize: "18px",
                                }}
                                onClick={() =>
                                  handleEditClick(role, permission)
                                }
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">
                            No roles found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Edit Permission Modal */}
        <Modal isOpen={editModalOpen} toggle={toggleEditModal} centered>
          <Form onSubmit={handleSubmit}>
            <ModalHeader toggle={toggleEditModal}>
              Edit Permission –{" "}
              {editingRole
                ? `${editingRole.ROLE_NAME} (${editingRole.ROLE_CODE})`
                : ""}
            </ModalHeader>
            <ModalBody>
              <p className="mb-2">
                Module:{" "}
                <strong>
                  {currentModule
                    ? currentModule.MODULE_NAME || currentModule.MODULE_CODE
                    : numericModuleId}
                </strong>
              </p>

              <FormGroup check className="mb-2">
                <Input
                  type="checkbox"
                  id="perm_view"
                  name="CAN_VIEW"
                  checked={formValues.CAN_VIEW}
                  onChange={handleChange}
                />{" "}
                <Label for="perm_view" check>
                  Can View
                </Label>
              </FormGroup>

              <FormGroup check className="mb-2">
                <Input
                  type="checkbox"
                  id="perm_create"
                  name="CAN_CREATE"
                  checked={formValues.CAN_CREATE}
                  onChange={handleChange}
                />{" "}
                <Label for="perm_create" check>
                  Can Create
                </Label>
              </FormGroup>

              <FormGroup check className="mb-2">
                <Input
                  type="checkbox"
                  id="perm_edit"
                  name="CAN_EDIT"
                  checked={formValues.CAN_EDIT}
                  onChange={handleChange}
                />{" "}
                <Label for="perm_edit" check>
                  Can Edit
                </Label>
              </FormGroup>

              <FormGroup check className="mb-2">
                <Input
                  type="checkbox"
                  id="perm_delete"
                  name="CAN_DELETE"
                  checked={formValues.CAN_DELETE}
                  onChange={handleChange}
                />{" "}
                <Label for="perm_delete" check>
                  Can Delete
                </Label>
              </FormGroup>

              <FormGroup check className="mt-3">
                <Input
                  type="checkbox"
                  id="perm_active"
                  name="ACTIVE_STATUS"
                  checked={formValues.ACTIVE_STATUS}
                  onChange={handleChange}
                />{" "}
                <Label for="perm_active" check>
                  Active
                </Label>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                color="secondary"
                onClick={toggleEditModal}
              >
                Cancel
              </Button>
              <Button type="submit" color="primary" disabled={saving}>
                {saving && <Spinner size="sm" className="me-2" />}
                Save
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

const RuleManagementModuleRoles = () => (
  <RequireModule moduleCode="ACCESS_ROLES">
    <RuleManagementModuleRolesInner />
  </RequireModule>
);

export default RuleManagementModuleRoles;
