import React, { useEffect, useState } from "react";
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

import * as Yup from "yup";
import { useFormik } from "formik";

import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import {
  getHrRoles,
  createHrEmployee,
  resetHrEmployeeFlags,
} from "/src/store/hrEmployees/actions";

import { fileToBase64 } from "/src/helpers/image_helper";

const hrEmployeesSelector = createSelector(
  (state) => state.hrEmployees,
  (hr) => ({
    roles: hr.roles,
    loadingRoles: hr.loadingRoles,
    rolesError: hr.rolesError,
    creating: hr.creating,
    createSuccess: hr.createSuccess,
    createError: hr.createError,
  })
);

const HrUsersCreateInner = () => {
  document.title = "Create HR User | Travco - COE";

  const dispatch = useDispatch();
  const {
    roles,
    loadingRoles,
    rolesError,
    creating,
    createSuccess,
    createError,
  } = useSelector(hrEmployeesSelector);

  const [profileImgPreview, setProfileImgPreview] = useState(null);

  useEffect(() => {
    dispatch(getHrRoles());
  }, [dispatch]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      FIRST_NAME: "",
      LAST_NAME: "",
      EMAIL: "",
      PASSWORD: "",
      DEPATRMENT_ID: 10,
      PHONE_NUMBER: "",
      ACTIVE_STATUS: true,
      ROLE_IDS: [],
      PROFILE_IMG: null,
    },
    validationSchema: Yup.object({
      FIRST_NAME: Yup.string().required("Please enter first name"),
      LAST_NAME: Yup.string().required("Please enter last name"),
      EMAIL: Yup.string().email("Invalid email").required("Please enter email"),
      PASSWORD: Yup.string().required("Please enter password"),
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
        PASSWORD: values.PASSWORD,
        PROFILE_IMG: values.PROFILE_IMG,
        DEPATRMENT_ID: Number(values.DEPATRMENT_ID),
        PHONE_NUMBER: values.PHONE_NUMBER,
        ACTIVE_STATUS: values.ACTIVE_STATUS ? 1 : 0,
        ROLE_IDS: (values.ROLE_IDS || []).map((id) => Number(id)),
      };

      dispatch(createHrEmployee(payload));
    },
  });

  // Clear form and flags after success / error
  useEffect(() => {
    if (createSuccess) {
      validation.resetForm();
      setProfileImgPreview(null);
    }

    if (createSuccess || createError) {
      const t = setTimeout(() => {
        dispatch(resetHrEmployeeFlags());
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [createSuccess, createError, dispatch, validation]);

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
    const current = validation.values.ROLE_IDS || [];
    const idStr = String(roleId);
    let next;
    if (current.includes(idStr)) {
      next = current.filter((id) => id !== idStr);
    } else {
      next = [...current, idStr];
    }
    validation.setFieldValue("ROLE_IDS", next);
  };

  const renderBackendResponse = () => {
    if (!createSuccess) return null;

    // createSuccess may be a string or an object (depending on saga)
    if (typeof createSuccess === "string") {
      return <div>{createSuccess}</div>;
    }

    return (
      <div>
        <div className="mb-2">Backend response:</div>
        <pre className="mb-0" style={{ maxHeight: 200, overflow: "auto" }}>
          {JSON.stringify(createSuccess, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="HR" breadcrumbItem="Create User" />

        <Row>
          <Col lg="12">
            {rolesError && <Alert color="danger">{rolesError}</Alert>}
            {createError && <Alert color="danger">{createError}</Alert>}
            {createSuccess && (
              <Alert color="success">{renderBackendResponse()}</Alert>
            )}
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card>
              <CardBody>
                <h4 className="card-title mb-4">New Employee</h4>

                <Form
                  className="form-horizontal"
                  onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                  }}
                >
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
                        validation.errors.FIRST_NAME ? (
                          <FormFeedback type="invalid">
                            {validation.errors.FIRST_NAME}
                          </FormFeedback>
                        ) : null}
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
                            validation.touched.LAST_NAME &&
                            validation.errors.LAST_NAME
                              ? true
                              : false
                          }
                        />
                        {validation.touched.LAST_NAME &&
                        validation.errors.LAST_NAME ? (
                          <FormFeedback type="invalid">
                            {validation.errors.LAST_NAME}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                  </Row>

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
                        {validation.touched.EMAIL && validation.errors.EMAIL ? (
                          <FormFeedback type="invalid">
                            {validation.errors.EMAIL}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="form-label">Password</Label>
                        <Input
                          name="PASSWORD"
                          type="password"
                          placeholder="Enter password"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.PASSWORD || ""}
                          invalid={
                            validation.touched.PASSWORD &&
                            validation.errors.PASSWORD
                              ? true
                              : false
                          }
                        />
                        {validation.touched.PASSWORD &&
                        validation.errors.PASSWORD ? (
                          <FormFeedback type="invalid">
                            {validation.errors.PASSWORD}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                  </Row>

                  <Row>
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
                        validation.errors.DEPATRMENT_ID ? (
                          <FormFeedback type="invalid">
                            {validation.errors.DEPATRMENT_ID}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>

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
                        validation.errors.PHONE_NUMBER ? (
                          <FormFeedback type="invalid">
                            {validation.errors.PHONE_NUMBER}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label className="form-label d-block">Roles</Label>
                        {(roles || []).map((role) => (
                          <div className="form-check mb-1" key={role.ROLE_ID}>
                            <Input
                              type="checkbox"
                              className="form-check-input"
                              id={`role_${role.ROLE_ID}`}
                              checked={(
                                validation.values.ROLE_IDS || []
                              ).includes(String(role.ROLE_ID))}
                              onChange={() => toggleRole(role.ROLE_ID)}
                            />
                            <Label
                              className="form-check-label"
                              htmlFor={`role_${role.ROLE_ID}`}
                            >
                              {role.ROLE_NAME}
                            </Label>
                          </div>
                        ))}
                        <small className="text-muted">
                          You can leave this empty (no roles), or select one or
                          more roles.
                        </small>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="mb-3 form-check mt-4 pt-2">
                        <Input
                          id="ACTIVE_STATUS"
                          name="ACTIVE_STATUS"
                          type="checkbox"
                          className="form-check-input"
                          checked={validation.values.ACTIVE_STATUS}
                          onChange={(e) =>
                            validation.setFieldValue(
                              "ACTIVE_STATUS",
                              e.target.checked
                            )
                          }
                        />
                        <Label
                          className="form-check-label"
                          htmlFor="ACTIVE_STATUS"
                        >
                          Active
                        </Label>
                      </div>
                    </Col>
                  </Row>

                  <Row>
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
                      </div>
                    </Col>
                    <Col md={6}>
                      {profileImgPreview && (
                        <div className="mb-3">
                          <Label className="form-label d-block">Preview</Label>
                          <img
                            src={profileImgPreview}
                            alt="preview"
                            className="avatar-md rounded-circle"
                          />
                        </div>
                      )}
                    </Col>
                  </Row>

                  <div className="text-end">
                    <Button type="submit" color="primary" disabled={creating}>
                      {creating && <Spinner size="sm" className="me-2" />}
                      Create Employee
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            {loadingRoles && (
              <Card>
                <CardBody>
                  <div className="d-flex align-items-center">
                    <Spinner size="sm" className="me-2" />
                    <span>Loading roles...</span>
                  </div>
                </CardBody>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const HrUsersCreate = () => (
  <RequireModule moduleCode="HR_USERS">
    <HrUsersCreateInner />
  </RequireModule>
);

export default HrUsersCreate;
