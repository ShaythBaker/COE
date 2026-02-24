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
  Progress,
} from "reactstrap";

import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useParams, useNavigate } from "react-router-dom";

import * as Yup from "yup";
import { useFormik } from "formik";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import {
  uploadAttachmentApi,
  getAttachmentUrlApi,
} from "/src/helpers/fakebackend_helper";

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
                  <Spinner
                    size="md"
                    className="me-4 spinner-border text-success"
                  />
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

        <EmployeeCompensationSection updating={updating} />
      </Container>
    </div>
  );
};

const EmployeeMetaCard = ({ user }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  // Fetch current profile image URL when PROFILE_IMG is a FILE_ID
  useEffect(() => {
    const value = user.PROFILE_IMG;

    if (!value) {
      setAvatarUrl(null);
      return;
    }

    // If it's a numeric FILE_ID -> call attachments/{FILE_ID}/url
    if (typeof value === "number" || /^[0-9]+$/.test(String(value))) {
      const fileId = Number(value);
      setLoadingAvatar(true);

      (async () => {
        try {
          const res = await getAttachmentUrlApi(fileId);
          const data = res?.data || res || {};
          setAvatarUrl(data.url || null);
        } catch (err) {
          console.error("Failed to load profile image URL:", err);
          setAvatarUrl(null);
        } finally {
          setLoadingAvatar(false);
        }
      })();

      return;
    }

    // Legacy behaviour: if it's a string but not numeric
    if (typeof value === "string") {
      if (value.startsWith("data:")) {
        setAvatarUrl(value);
      } else if (value.startsWith("http://") || value.startsWith("https://")) {
        setAvatarUrl(value);
      } else {
        // assume legacy plain base64
        setAvatarUrl(`data:image/jpeg;base64,${value}`);
      }
    }
  }, [user.PROFILE_IMG]);

  const renderAvatar = () => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
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
          {loadingAvatar ? (
            <Spinner size="sm" className="spinner-border text-success" />
          ) : (
            renderAvatar()
          )}
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

const EmployeeCompensationSection = ({ updating }) => {
  const navigate = useNavigate();
  const [dependencies, setDependencies] = useState([
    { name: "", relationship: "", dob: "" },
  ]);

  const updateDependency = (index, key, value) => {
    setDependencies((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [key]: value } : d))
    );
  };

  const addDependency = () => {
    setDependencies((prev) => [...prev, { name: "", relationship: "", dob: "" }]);
  };

  const removeDependency = (index) => {
    setDependencies((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Leave Balances Dashboard placeholders ---
  const leave = {
    annual: { used: 12, total: 24 },
    sick: { used: 3, total: 14 },
    unpaid: { used: 0, total: 10 },
  };

  const pct = (used, total) => {
    const t = Number(total) || 0;
    if (!t) return 0;
    return Math.max(0, Math.min(100, Math.round((Number(used) / t) * 100)));
  };

  const Gauge = ({ label, used, total, hint }) => {
    const percent = pct(used, total);
    return (
      <div className="border rounded p-3 h-100">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="font-size-14 mb-0">{label}</h5>
          <span className="text-muted">{percent}%</span>
        </div>

        <div className="d-flex align-items-center mt-3">
          <div
            aria-label={`${label} gauge`}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `conic-gradient(#556ee6 ${percent}%, #e9ecef 0)`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span className="fw-semibold" style={{ fontSize: 12 }}>
                {used}/{total}
              </span>
            </div>
          </div>

          <div className="ms-3 flex-grow-1">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Used</span>
              <span className="fw-semibold">{used}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Remaining</span>
              <span className="fw-semibold">{Math.max(0, total - used)}</span>
            </div>
            <div className="mt-2">
              <div className="progress" style={{ height: 6 }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${percent}%` }}
                  aria-valuenow={percent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
            {hint ? (
              <small className="text-muted d-block mt-2">{hint}</small>
            ) : null}
          </div>
        </div>
      </div>
    );
  };
  return (
    <Row className="mt-4">
      <Col lg="12">
        <Card>
          <CardBody>
            <h4 className="card-title mb-4">Compensation &amp; Balances</h4>

            <Row>
              {/* LEFT COLUMN – payroll & static HR fields */}
              <Col lg={6}>
                <div className="mb-3">
                  <Label className="form-label">Gross Salary</Label>
                  <Input type="text" defaultValue="" placeholder="Enter gross salary (e.g., JD 1200)" />
                  <small className="text-muted">
                    Placeholder – bind to employee gross salary.
                  </small>
                </div>

                <div className="mb-3">
                  <Label className="form-label">Net Salary</Label>
                  <Input type="text" defaultValue="" placeholder="Enter net salary (e.g., JD 950)" />
                  <small className="text-muted">
                    Placeholder – bind to employee net salary.
                  </small>
                </div>

                <div className="mb-3">
                  <Label className="form-label">Health Insurance Type</Label>
                  <Input type="select" defaultValue="">
                    <option value="" disabled>
                      Select insurance type...
                    </option>
                    <option value="STANDARD">Standard (Placeholder)</option>
                    <option value="PREMIUM">Premium (Placeholder)</option>
                  </Input>
                  <small className="text-muted">
                    Placeholder – backend will bind the selected insurance type.
                  </small>
                </div>

                <div className="mb-3">
                  <Label className="form-label">Health Insurance Number</Label>
                  <Input type="text" defaultValue="" placeholder="Enter insurance number" />
                  <small className="text-muted">
                    Placeholder – insurance policy / card number.
                  </small>
                </div>

                <div className="mb-3">
                  <Label className="form-label">Social Security Amount</Label>
                  <Input type="text" defaultValue="" placeholder="Enter social security amount" />
                  <small className="text-muted">
                    Placeholder – monthly social security contribution.
                  </small>
                </div>

                <div className="mb-3">
                  <Label className="form-label">Tax Number</Label>
                  <Input type="text" defaultValue="" placeholder="Enter tax number" />
                  <small className="text-muted">
                    Placeholder – employee tax / TIN number.
                  </small>
                </div>

                <div className="mb-0">
                  <Label className="form-label">Bank Account Number</Label>
                  <Input type="text" defaultValue="" placeholder="Enter IBAN / bank account" />
                  <small className="text-muted">
                    Placeholder – IBAN or bank account.
                  </small>
                </div>

                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="font-size-15 mb-0">Dependencies</h5>
                    <Button type="button" color="light" size="sm" onClick={addDependency}>
                      + Add Dependent
                    </Button>
                  </div>

                  <div className="table-responsive border rounded">
                    <table className="table mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "40%" }}>Name</th>
                          <th style={{ width: "35%" }}>Relationship</th>
                          <th style={{ width: "20%" }}>DOB</th>
                          <th style={{ width: "5%" }} />
                        </tr>
                      </thead>
                      <tbody>
                        {dependencies.map((dep, idx) => (
                          <tr key={idx}>
                            <td>
                              <Input
                                bsSize="sm"
                                type="text"
                                value={dep.name}
                                placeholder="Full name"
                                onChange={(e) => updateDependency(idx, "name", e.target.value)}
                              />
                            </td>
                            <td>
                              <Input
                                bsSize="sm"
                                type="select"
                                value={dep.relationship}
                                onChange={(e) =>
                                  updateDependency(idx, "relationship", e.target.value)
                                }
                              >
                                <option value="">Select...</option>
                                <option value="SPOUSE">Spouse (Placeholder)</option>
                                <option value="CHILD">Child (Placeholder)</option>
                              </Input>
                            </td>
                            <td>
                              <Input
                                bsSize="sm"
                                type="date"
                                value={dep.dob}
                                onChange={(e) => updateDependency(idx, "dob", e.target.value)}
                              />
                            </td>
                            <td className="text-end">
                              <Button
                                type="button"
                                color="danger"
                                outline
                                size="sm"
                                onClick={() => removeDependency(idx)}
                                disabled={dependencies.length === 1}
                              >
                                ×
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <small className="text-muted d-block mt-1">
                    Placeholder – backend will map and persist employee dependents here.
                  </small>
                </div>
              </Col>

              {/* RIGHT COLUMN – leave balances & financial snapshot */}
              <Col lg={6}>
                <div className="mb-3">
                  <Label className="form-label">Recruitment Date</Label>
                  <Input type="date" defaultValue="" />
                  <small className="text-muted">
                    Placeholder – date of joining / recruitment date.
                  </small>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-2 mb-3">
                  <h5 className="font-size-15 mb-0">Leave Balances</h5>
                  <small className="text-muted">Dashboard (placeholders)</small>
                </div>

                <Row className="g-3">
                  <Col md={12}>
                    <Gauge
                      label="Annual Leave"
                      used={leave.annual.used}
                      total={leave.annual.total}
                      hint="Placeholder – ANNUAL_LEAVE_USED / ANNUAL_LEAVE_TOTAL."
                    />
                  </Col>

                  <Col md={12}>
                    <Gauge
                      label="Sick Leave"
                      used={leave.sick.used}
                      total={leave.sick.total}
                      hint="Placeholder – SICK_LEAVE_USED / SICK_LEAVE_TOTAL."
                    />
                  </Col>

                  <Col md={12}>
                    <Gauge
                      label="Unpaid Leave"
                      used={leave.unpaid.used}
                      total={leave.unpaid.total}
                      hint="Placeholder – unpaid leave taken this year (define total via policy)."
                    />
                  </Col>
                </Row>


                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="font-size-15 mb-0">Financial Snapshot</h5>
                  </div>

                <Row>
                  <Col md={6} className="mb-3">
                    <div className="border rounded p-2 text-center">
                      <p className="text-muted mb-1">Monthly Cost</p>
                      <h5 className="mb-0">JD 0.00</h5>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className="border rounded p-2 text-center">
                      <p className="text-muted mb-1">Year-to-Date Paid</p>
                      <h5 className="mb-0">JD 0.00</h5>
                    </div>
                  </Col>
                </Row>

                <small className="text-muted d-block">
                  All values above are placeholders to be replaced with real payroll &amp; leave data from the backend.
                </small>
                </div>
              </Col>
            </Row>
            <Row className="mt-4 align-items-center">
              <Col sm="6">
                <Button
                  type="button"
                  color="secondary"
                  onClick={() => navigate("/hr/users")}
                >
                  Back to Employees
                </Button>
              </Col>

              <Col sm="6" className="text-end">
                <Button
                  color="primary"
                  disabled={updating}
                  onClick={() => {
                    const form = document.querySelector("form");
                    if (form) form.requestSubmit();
                  }}
                >
                  {updating && <Spinner size="sm" className="me-2" />}
                  Update Employee
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
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

  const [profileImgPreview, setProfileImgPreview] = useState(null);
  const [loadingExistingProfile, setLoadingExistingProfile] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const rawProfileImg = user.PROFILE_IMG ?? null;

  // Initial PROFILE_IMG value in formik: only numeric FILE_ID is allowed
  const initialProfileImgValue = useMemo(() => {
    if (
      typeof rawProfileImg === "number" ||
      /^[0-9]+$/.test(String(rawProfileImg || ""))
    ) {
      return Number(rawProfileImg);
    }
    // any non numeric (old base64, url, etc) is ignored for payload
    return null;
  }, [rawProfileImg]);

  const initialRoleIds = useMemo(
    () => (userRoles || []).map((r) => String(r.ROLE_ID)),
    [userRoles]
  );

  // Fetch URL for existing FILE_ID to show preview
  useEffect(() => {
    const value = rawProfileImg;
    if (
      !value ||
      !(typeof value === "number" || /^[0-9]+$/.test(String(value)))
    ) {
      setProfileImgPreview(null);
      return;
    }

    const fileId = Number(value);
    setLoadingExistingProfile(true);

    (async () => {
      try {
        const res = await getAttachmentUrlApi(fileId);
        const data = res?.data || res || {};
        setProfileImgPreview(data.url || null);
      } catch (err) {
        console.error("Failed to load existing profile image URL:", err);
        setProfileImgPreview(null);
      } finally {
        setLoadingExistingProfile(false);
      }
    })();
  }, [rawProfileImg]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      FIRST_NAME: user.FIRST_NAME || "",
      LAST_NAME: user.LAST_NAME || "",
      EMAIL: user.EMAIL || "",
      COMPANY_ID: user.COMPANY_ID || 10,
      PHONE_NUMBER: user.PHONE_NUMBER || "",
      ACTIVE_STATUS:
        user.ACTIVE_STATUS === 1 || user.ACTIVE_STATUS === "1" ? true : false,
      // IMPORTANT: this is FILE_ID or null. No base64.
      PROFILE_IMG: initialProfileImgValue,
      ROLE_IDS: initialRoleIds,
    },
    validationSchema: Yup.object({
      FIRST_NAME: Yup.string().required("Please enter first name"),
      LAST_NAME: Yup.string().required("Please enter last name"),
      EMAIL: Yup.string().email("Invalid email").required("Please enter email"),
      COMPANY_ID: Yup.number()
        .typeError("Department must be a number")
        .required("Please enter Company id"),
      PHONE_NUMBER: Yup.string().required("Please enter phone number"),
    }),
    onSubmit: (values) => {
      const payload = {
        FIRST_NAME: values.FIRST_NAME,
        LAST_NAME: values.LAST_NAME,
        EMAIL: values.EMAIL,
        // backend expects FILE_ID here, or null
        PROFILE_IMG: values.PROFILE_IMG ? Number(values.PROFILE_IMG) : null,
        COMPANY_ID: Number(values.COMPANY_ID),
        PHONE_NUMBER: values.PHONE_NUMBER,
        ACTIVE_STATUS: values.ACTIVE_STATUS ? 1 : 0,
        ROLE_IDS: (values.ROLE_IDS || []).map((rid) => Number(rid)),
      };

      dispatch(updateHrEmployee(id, payload));
    },
  });

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      validation.setFieldValue("PROFILE_IMG", null);
      setProfileImgPreview(null);
      return;
    }

    try {
      setUploadingProfile(true);

      const formData = new FormData();
      formData.append("USER_ID", user.USER_ID);
      formData.append("FILE_CATEGORY", "PROFILE_IMG");
      formData.append("FILE_NAME", file.name);
      formData.append("file", file);

      const res = await uploadAttachmentApi(formData);
      const data = res?.data || res || {};

      const { FILE_ID, url } = data;

      // Save FILE_ID only – this is what backend now stores in PROFILE_IMG
      if (FILE_ID) {
        validation.setFieldValue("PROFILE_IMG", Number(FILE_ID));
      } else {
        validation.setFieldValue("PROFILE_IMG", null);
      }

      // Use URL from response as current preview
      if (url) {
        setProfileImgPreview(url);
      } else {
        setProfileImgPreview(null);
      }
    } catch (err) {
      console.error("Image upload error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload profile image";
      setUploadError(msg);
      validation.setFieldValue("PROFILE_IMG", null);
      setProfileImgPreview(null);
    } finally {
      setUploadingProfile(false);
    }
  };

  const toggleRole = (roleId) => {
    const idStr = String(roleId);
    const current = validation.values.ROLE_IDS || [];
    const next = current.includes(idStr)
      ? current.filter((rid) => rid !== idStr)
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
                    !!validation.errors.FIRST_NAME
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
                    validation.touched.LAST_NAME &&
                    !!validation.errors.LAST_NAME
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
                    validation.touched.EMAIL && !!validation.errors.EMAIL
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
                <Label className="form-label">Company ID</Label>
                <Input
                  name="COMPANY_ID"
                  type="number"
                  placeholder="Enter Company ID"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.COMPANY_ID || ""}
                  invalid={
                    validation.touched.COMPANY_ID &&
                    !!validation.errors.COMPANY_ID
                  }
                />
                {validation.touched.COMPANY_ID &&
                  validation.errors.COMPANY_ID && (
                    <FormFeedback type="invalid">
                      {validation.errors.COMPANY_ID}
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
                    !!validation.errors.PHONE_NUMBER
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
                <div className="d-flex align-items-center mt-1">
                  {(uploadingProfile || loadingExistingProfile) && (
                    <>
                      <Spinner size="sm" className="me-2" />
                      <small className="text-muted">Loading image...</small>
                    </>
                  )}
                  {!uploadingProfile && !loadingExistingProfile && (
                    <small className="text-muted">
                      Optional. File is uploaded to S3; only its FILE_ID is
                      saved.
                    </small>
                  )}
                </div>

                {uploadError && (
                  <div className="mt-1">
                    <small className="text-danger">{uploadError}</small>
                  </div>
                )}

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
