import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardBody, Button, Spinner, Alert } from "reactstrap";

import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useParams, useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import { getHrEmployeeDetail } from "/src/store/hrEmployees/actions";
import { getAttachmentUrlApi } from "/src/helpers/fakebackend_helper";

const hrEmployeeViewSelector = createSelector(
  (state) => state.hrEmployees,
  (hr) => ({
    //  EXACT SAME KEYS AS EDIT (no guessing)
    currentEmployee: hr.currentEmployee,
    loadingCurrent: hr.loadingCurrent,
    currentError: hr.currentError,
  })
);

const Field = ({ label, value }) => (
  <div className="mb-3">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value ?? "-"}</div>
  </div>
);

const EmployeeMetaCardView = ({ user }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  useEffect(() => {
    const value = user?.PROFILE_IMG;

    if (!value) {
      setAvatarUrl(null);
      return;
    }

    // numeric FILE_ID -> fetch url
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

    // legacy string
    if (typeof value === "string") {
      if (value.startsWith("data:")) setAvatarUrl(value);
      else if (value.startsWith("http://") || value.startsWith("https://")) setAvatarUrl(value);
      else setAvatarUrl(`data:image/jpeg;base64,${value}`);
    }
  }, [user?.PROFILE_IMG]);

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

    const f = (user?.FIRST_NAME || "").charAt(0).toUpperCase();
    const l = (user?.LAST_NAME || "").charAt(0).toUpperCase();
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
            {user?.FIRST_NAME} {user?.LAST_NAME}
          </h5>
          <p className="text-muted mb-1">{user?.EMAIL}</p>
          <p className="text-muted mb-0">ID: {user?.USER_ID}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h5 className="card-title mb-3">Meta</h5>
          <p className="mb-1">
            <strong>Created:</strong>{" "}
            {user?.CREATED_AT ? new Date(user.CREATED_AT).toLocaleString() : "-"}
          </p>
          <p className="mb-0">
            <strong>Last Updated:</strong>{" "}
            {user?.UPDATED_AT ? new Date(user.UPDATED_AT).toLocaleString() : "-"}
          </p>
        </CardBody>
      </Card>
    </>
  );
};

const EmployeeCompensationBalancesView = ({ user }) => {
  // Try to read real values if backend provides them; otherwise show placeholders.
  const safe = (v) => (v === 0 || v ? v : "-");

  const grossSalary = user?.GROSS_SALARY ?? user?.GROSSSALARY ?? user?.SALARY_GROSS;
  const netSalary = user?.NET_SALARY ?? user?.NETSALARY ?? user?.SALARY_NET;
  const healthType = user?.HEALTH_INSURANCE_TYPE ?? user?.INSURANCE_TYPE;
  const healthNumber = user?.HEALTH_INSURANCE_NUMBER ?? user?.INSURANCE_NUMBER;
  const socialSecurityAmount = user?.SOCIAL_SECURITY_AMOUNT ?? user?.SOCIAL_SECURITY;
  const taxNumber = user?.TAX_NUMBER ?? user?.TIN;
  const bankAccountNumber = user?.BANK_ACCOUNT_NUMBER ?? user?.IBAN ?? user?.BANK_IBAN;
  const recruitmentDate = user?.RECRUITMENT_DATE ?? user?.JOIN_DATE ?? user?.HIRED_AT;

  const dependencies = Array.isArray(user?.DEPENDENCIES)
    ? user.DEPENDENCIES
    : Array.isArray(user?.DEPENDANTS)
      ? user.DEPENDANTS
      : [];

  // Leave balances: placeholders with safe fallbacks
  const leave = {
    annual: {
      used: Number(user?.ANNUAL_LEAVE_USED ?? 12),
      total: Number(user?.ANNUAL_LEAVE_TOTAL ?? 24),
    },
    sick: {
      used: Number(user?.SICK_LEAVE_USED ?? 3),
      total: Number(user?.SICK_LEAVE_TOTAL ?? 14),
    },
    unpaid: {
      used: Number(user?.UNPAID_LEAVE_USED ?? 0),
      total: Number(user?.UNPAID_LEAVE_TOTAL ?? 10),
    },
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
            {hint ? <small className="text-muted d-block mt-2">{hint}</small> : null}
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
                <Row>
                  <Col md={6}>
                    <Field label="Gross Salary" value={safe(grossSalary)} />
                  </Col>
                  <Col md={6}>
                    <Field label="Net Salary" value={safe(netSalary)} />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Field label="Health Insurance Type" value={safe(healthType)} />
                  </Col>
                  <Col md={6}>
                    <Field label="Health Insurance Number" value={safe(healthNumber)} />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Field label="Social Security Amount" value={safe(socialSecurityAmount)} />
                  </Col>
                  <Col md={6}>
                    <Field label="Tax Number" value={safe(taxNumber)} />
                  </Col>
                </Row>

                <Field label="Bank Account Number" value={safe(bankAccountNumber)} />

                <div className="mt-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="font-size-15 mb-0">Dependencies</h5>
                    <small className="text-muted">Read-only</small>
                  </div>

                  <div className="table-responsive border rounded">
                    <table className="table mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "40%" }}>Name</th>
                          <th style={{ width: "35%" }}>Relationship</th>
                          <th style={{ width: "25%" }}>DOB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dependencies.length ? (
                          dependencies.map((dep, idx) => (
                            <tr key={idx}>
                              <td>{safe(dep?.name ?? dep?.NAME)}</td>
                              <td>{safe(dep?.relationship ?? dep?.RELATIONSHIP)}</td>
                              <td>{safe(dep?.dob ?? dep?.DOB)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center text-muted py-3">
                              No dependents found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <small className="text-muted d-block mt-2">
                    These fields are placeholders until payroll/leave data is provided by the backend.
                  </small>
                </div>
              </Col>

              {/* RIGHT COLUMN – leave balances & financial snapshot */}
              <Col lg={6}>
                <Field
                  label="Recruitment Date"
                  value={recruitmentDate ? new Date(recruitmentDate).toLocaleDateString() : "-"}
                />

                <div className="d-flex align-items-center justify-content-between mt-2 mb-3">
                  <h5 className="font-size-15 mb-0">Leave Balances</h5>
                  <small className="text-muted">Dashboard</small>
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
                      hint="Placeholder – UNPAID_LEAVE_USED / UNPAID_LEAVE_TOTAL."
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
                    All values above are placeholders until payroll integration is completed.
                  </small>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

const HrUsersViewInner = () => {
  document.title = "View HR Employee | Travco - COE";

  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentEmployee, loadingCurrent, currentError } = useSelector(hrEmployeeViewSelector);

  useEffect(() => {
    if (id) dispatch(getHrEmployeeDetail(id));
  }, [dispatch, id]);

  if (loadingCurrent && !currentEmployee) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="HR" breadcrumbItem="View Employee" />
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <Spinner size="sm" className="me-4 spinner-border text-success" />
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
          <Breadcrumb title="HR" breadcrumbItem="View Employee" />
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
        <Breadcrumb title="HR" breadcrumbItem="View Employee" />

        <Row className="mb-3">
          <Col className="d-flex gap-2">
            <Button color="secondary" onClick={() => navigate("/hr/users")}>
              Back to Employees
            </Button>

            <Button color="primary" onClick={() => navigate(`/hr/users/${id}/edit`)}>
              Edit Employee
            </Button>
          </Col>
        </Row>

        <Row>
          <Col lg={4}>
            <EmployeeMetaCardView user={user} />
          </Col>

          <Col lg={8}>
            <Card>
              <CardBody>
                <h4 className="card-title mb-4">Employee Details</h4>

                <Row>
                  <Col md={6}>
                    <Field label="First Name" value={user?.FIRST_NAME} />
                  </Col>
                  <Col md={6}>
                    <Field label="Last Name" value={user?.LAST_NAME} />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Field label="Email" value={user?.EMAIL} />
                  </Col>
                  <Col md={6}>
                    <Field label="Phone Number" value={user?.PHONE_NUMBER} />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Field label="Company ID" value={user?.COMPANY_ID} />
                  </Col>
                  <Col md={6}>
                    <Field
                      label="Active Status"
                      value={
                        user?.ACTIVE_STATUS === 1 || user?.ACTIVE_STATUS === "1"
                          ? "Active"
                          : "Inactive"
                      }
                    />
                  </Col>
                </Row>

                <div className="mt-3">
                  <div className="text-muted small mb-2">Roles</div>
                  <div className="d-flex flex-wrap gap-2">
                    {(userRoles || []).length ? (
                      userRoles.map((r) => (
                        <span key={r.ROLE_ID} className="badge bg-soft-primary text-primary">
                          {r.ROLE_NAME}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">No roles assigned.</span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <EmployeeCompensationBalancesView user={user} />
      </Container>
    </div>
  );
};

const HrUsersView = () => (
  <RequireModule moduleCode="HR_USERS">
    <HrUsersViewInner />
  </RequireModule>
);

export default HrUsersView;