// src/pages/HR/HrUsersEdit.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  Label,
  Input,
  FormFeedback,
  Button,
  Alert,
  Spinner,
} from "reactstrap";

import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useParams, useNavigate } from "react-router-dom";

import * as Yup from "yup";
import { useFormik } from "formik";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import { fileToBase64 } from "/src/helpers/image_helper";

import {
  getHrEmployeeDetail,
  getHrRoles,
  updateHrEmployee,
  resetHrEmployeeFlags,
} from "/src/store/hrEmployees/actions";

const hrEmployeeEditSelector = createSelector(
  (state) => state.hrEmployees,
  (hr) => ({
    roles: hr.roles,
    loadingRoles: hr.loadingRoles,
    rolesError: hr.rolesError,

    currentEmployee: hr.currentEmployee,
    loadingCurrent: hr.loadingCurrent,
    currentError: hr.currentError,

    updating: hr.updating,
    updateSuccess: hr.updateSuccess,
    updateError: hr.updateError,
  })
);

const HrUsersEditInner = () => {
  document.title = "Edit HR Employee | Travco - COE";

  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    roles,
    loadingRoles,
    rolesError,
    currentEmployee,
    loadingCurrent,
    currentError,
    updating,
    updateSuccess,
    updateError,
  } = useSelector(hrEmployeeEditSelector);

  useEffect(() => {
    if (id) {
      dispatch(getHrEmployeeDetail(id));
    }
    dispatch(getHrRoles());
  }, [dispatch, id]);

  useEffect(() => {
    if (updateSuccess || updateError) {
      const t = setTimeout(() => {
        dispatch(resetHrEmployeeFlags());
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [updateSuccess, updateError, dispatch]);

  if (loadingCurrent && !currentEmployee) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="HR" breadcrumbItem="Edit Employee" />
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <Spinner size="sm" className="me-2" />
                  Loading employee...
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (currentError && !currentEmployee) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="HR" breadcrumbItem="Edit Employee" />
          <Row>
            <Col>
              <Alert color="danger">{currentError}</Alert>
              <Button color="secondary" onClick={() => navigate("/hr/users")}>
                Back to Employees
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (!currentEmployee) return null;

  const user = currentEmployee.USER;
  const userRoles = currentEmployee.ROLES || [];

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="HR" breadcrumbItem="Edit Employee" />

        <Row>
          <Col lg="12">
            {rolesError && <Alert color="danger">{rolesError}</Alert>}
            {updateError && <Alert color="danger">{updateError}</Alert>}
            {updateSuccess && (
              <Alert color="success">
                {typeof updateSuccess === "string"
                  ? updateSuccess
                  : "Employee updated successfully"}
              </Alert>
            )}
          </Col>
        </Row>

        <Row>
          <Col lg={4}>
            <EmployeeMetaCard user={user} />
          </Col>

          <Col lg={8}>
            <HrUsersEditForm
              id={id}
              user={user}
              userRoles={userRoles}
              roles={roles}
              loadingRoles={loadingRoles}
              updating={updating}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const EmployeeMetaCard = ({ user }) => {
  const getProfileImgSrc = (base64) => {
    if (!base64) return null;
    if (base64.startsWith("data:")) return base64;
    return `data:image/jpeg;base64,${base64}`;
  };

  const src = getProfileImgSrc(user.PROFILE_IMG);

  const renderAvatar = () => {
    if (src) {
      return (
        <img
          src={src}
          alt="avatar"
          className="avatar-md rounded-circle"
          style={{ objectFit: "cover" }}
        />
      );
    }
    const f = (user.FIRST_NAME || "").charAt(0).toUpperCase();
    const l = (user.LAST_NAME || "").charAt(0).toUpperCase();
    const initials = f || l ? `${f}${l}` : "?";

    return (
      <div className="avatar-md">
        <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-24">
          {initials}
        </span>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardBody className="text-center">
          {renderAvatar()}
          <h5 className="mt-3 mb-1">
            {user.FIRST_NAME} {user.LAST_NAME}
          </h5>
          <p className="text-muted mb-1">{user.EMAIL}</p>
          <p className="text-muted mb-0">ID: {user.USER_ID}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h5 className="card-title mb-3">Meta</h5>
          <p className="mb-1">
            <strong>Created:</strong>{" "}
            {user.CREATED_AT ? new Date(user.CREATED_AT).toLocaleString() : "-"}
          </p>
          <p className="mb-0">
            <strong>Last Updated:</strong>{" "}
            {user.UPDATED_AT ? new Date(user.UPDATED_AT).toLocaleString() : "-"}
          </p>
        </CardBody>
      </Card>
    </>
  );
};

const HrUsersEditForm = ({
  id,
  user,
  userRoles,
  roles,
  loadingRoles,
  updating,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [profileImgPreview, setProfileImgPreview] = useState(() => {
    if (!user.PROFILE_IMG) return null;
    if (user.PROFILE_IMG.startsWith("data:")) return user.PROFILE_IMG;
    return `data:image/jpeg;base64,${user.PROFILE_IMG}`;
  });

  const initialRoleIds = useMemo(
    () => (userRoles || []).map((r) => String(r.ROLE_ID)),
    [userRoles]
  );

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      FIRST_NAME: user.FIRST_NAME || "",
      LAST_NAME: user.LAST_NAME || "",
      EMAIL: user.EMAIL || "",
      DEPATRMENT_ID: user.DEPATRMENT_ID || 10,
      PHONE_NUMBER: user.PHONE_NUMBER || "",
      ACTIVE_STATUS:
        user.ACTIVE_STATUS === 1 || user.ACTIVE_STATUS === "1" ? true : false,
      PROFILE_IMG: user.PROFILE_IMG || null,
      ROLE_IDS: initialRoleIds,
    },
    validationSchema: Yup.object({
      FIRST_NAME: Yup.string().required("Please enter first name"),
      LAST_NAME: Yup.string().required("Please enter last name"),
      EMAIL: Yup.string().email("Invalid email").required("Please enter email"),
      DEPATRMENT_ID: Yup.number()
        .typeError("Department must be a number")
        .required("Please enter department id"),
      PHONE_NUMBER: Yup.string().required("Please enter phone number"),
    }),
    onSubmit: (values) => {
      const payload = {
        FIRST_NAME: values.FIRST_NAME,
        LAST_NAME: values.LAST_NAME,
        EMAIL: values.EMAIL,
        PROFILE_IMG: values.PROFILE_IMG,
        DEPATRMENT_ID: Number(values.DEPATRMENT_ID),
        PHONE_NUMBER: values.PHONE_NUMBER,
        ACTIVE_STATUS: values.ACTIVE_STATUS ? 1 : 0,
        ROLE_IDS: (values.ROLE_IDS || []).map((id) => Number(id)),
      };
      dispatch(updateHrEmployee(id, payload));
    },
  });

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      validation.setFieldValue("PROFILE_IMG", null);
      setProfileImgPreview(null);
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      validation.setFieldValue("PROFILE_IMG", base64);
      setProfileImgPreview(URL.createObjectURL(file));
    } catch (err) {
      console.error("Image upload error:", err);
    }
  };

  const toggleRole = (roleId) => {
    const idStr = String(roleId);
    const current = validation.values.ROLE_IDS || [];
    const next = current.includes(idStr)
      ? current.filter((id) => id !== idStr)
      : [...current, idStr];
    validation.setFieldValue("ROLE_IDS", next);
  };

  return (
    <Card>
      <CardBody>
        <h4 className="card-title mb-4">Edit Employee</h4>

        <Form
          className="form-horizontal"
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            return false;
          }}
        >
          {/* Names */}
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">First Name</Label>
                <Input
                  name="FIRST_NAME"
                  type="text"
                  placeholder="Enter first name"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.FIRST_NAME || ""}
                  invalid={
                    validation.touched.FIRST_NAME &&
                    validation.errors.FIRST_NAME
                      ? true
                      : false
                  }
                />
                {validation.touched.FIRST_NAME &&
                  validation.errors.FIRST_NAME && (
                    <FormFeedback type="invalid">
                      {validation.errors.FIRST_NAME}
                    </FormFeedback>
                  )}
              </div>
            </Col>

            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">Last Name</Label>
                <Input
                  name="LAST_NAME"
                  type="text"
                  placeholder="Enter last name"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.LAST_NAME || ""}
                  invalid={
                    validation.touched.LAST_NAME && validation.errors.LAST_NAME
                      ? true
                      : false
                  }
                />
                {validation.touched.LAST_NAME &&
                  validation.errors.LAST_NAME && (
                    <FormFeedback type="invalid">
                      {validation.errors.LAST_NAME}
                    </FormFeedback>
                  )}
              </div>
            </Col>
          </Row>

          {/* Email + Department */}
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">Email</Label>
                <Input
                  name="EMAIL"
                  type="email"
                  placeholder="Enter email"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.EMAIL || ""}
                  invalid={
                    validation.touched.EMAIL && validation.errors.EMAIL
                      ? true
                      : false
                  }
                />
                {validation.touched.EMAIL && validation.errors.EMAIL && (
                  <FormFeedback type="invalid">
                    {validation.errors.EMAIL}
                  </FormFeedback>
                )}
              </div>
            </Col>

            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">Department ID</Label>
                <Input
                  name="DEPATRMENT_ID"
                  type="number"
                  placeholder="Enter department ID"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.DEPATRMENT_ID || ""}
                  invalid={
                    validation.touched.DEPATRMENT_ID &&
                    validation.errors.DEPATRMENT_ID
                      ? true
                      : false
                  }
                />
                {validation.touched.DEPATRMENT_ID &&
                  validation.errors.DEPATRMENT_ID && (
                    <FormFeedback type="invalid">
                      {validation.errors.DEPATRMENT_ID}
                    </FormFeedback>
                  )}
              </div>
            </Col>
          </Row>

          {/* Phone + Active */}
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">Phone Number</Label>
                <Input
                  name="PHONE_NUMBER"
                  type="text"
                  placeholder="Enter phone number"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.PHONE_NUMBER || ""}
                  invalid={
                    validation.touched.PHONE_NUMBER &&
                    validation.errors.PHONE_NUMBER
                      ? true
                      : false
                  }
                />
                {validation.touched.PHONE_NUMBER &&
                  validation.errors.PHONE_NUMBER && (
                    <FormFeedback type="invalid">
                      {validation.errors.PHONE_NUMBER}
                    </FormFeedback>
                  )}
              </div>
            </Col>

            <Col md={6}>
              <div className="mb-3 form-check mt-4 pt-2">
                <Input
                  id="ACTIVE_STATUS"
                  name="ACTIVE_STATUS"
                  type="checkbox"
                  className="form-check-input"
                  checked={!!validation.values.ACTIVE_STATUS}
                  onChange={(e) =>
                    validation.setFieldValue("ACTIVE_STATUS", e.target.checked)
                  }
                />
                <Label className="form-check-label" htmlFor="ACTIVE_STATUS">
                  Active
                </Label>
              </div>
            </Col>
          </Row>

          {/* Roles + Profile image */}
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label d-block">Roles</Label>
                <div className="d-flex flex-column border rounded p-2">
                  {loadingRoles && (
                    <div className="d-flex align-items-center mb-1">
                      <Spinner size="sm" className="me-2" />
                      <span>Loading roles...</span>
                    </div>
                  )}
                  {(roles || []).map((role) => (
                    <div
                      className="form-check mb-1"
                      key={role.ROLE_ID}
                      onClick={() => toggleRole(role.ROLE_ID)}
                      style={{ cursor: "pointer" }}
                    >
                      <Input
                        type="checkbox"
                        className="form-check-input"
                        id={`role_${role.ROLE_ID}`}
                        name="ROLE_IDS"
                        value={String(role.ROLE_ID)}
                        checked={(validation.values.ROLE_IDS || []).includes(
                          String(role.ROLE_ID)
                        )}
                        readOnly
                      />
                      <Label
                        className="form-check-label"
                        htmlFor={`role_${role.ROLE_ID}`}
                        style={{ cursor: "pointer" }}
                      >
                        {role.ROLE_NAME}
                      </Label>
                    </div>
                  ))}
                  {(!roles || roles.length === 0) && !loadingRoles && (
                    <small className="text-muted">No roles available.</small>
                  )}
                </div>
                <small className="text-muted">
                  You can assign multiple roles or leave empty.
                </small>
              </div>
            </Col>

            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">Profile Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
                <small className="text-muted">
                  Optional. Will be stored as base64.
                </small>

                {profileImgPreview && (
                  <div className="mt-3">
                    <Label className="form-label d-block">Preview</Label>
                    <img
                      src={profileImgPreview}
                      alt="preview"
                      className="avatar-md rounded-circle"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>
            </Col>
          </Row>

          <div className="d-flex justify-content-between">
            <Button
              type="button"
              color="secondary"
              onClick={() => navigate("/hr/users")}
            >
              Back to Employees
            </Button>

            <Button type="submit" color="primary" disabled={updating}>
              {updating && <Spinner size="sm" className="me-2" />}
              Update Employee
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

const HrUsersEdit = () => (
  <RequireModule moduleCode="HR_USERS">
    <HrUsersEditInner />
  </RequireModule>
);

export default HrUsersEdit;




