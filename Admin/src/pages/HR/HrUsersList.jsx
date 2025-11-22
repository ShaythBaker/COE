// src/pages/HR/HrUsersList.jsx

import React, { useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Table,
  Alert,
  Spinner,
  Badge,
  Button,
} from "reactstrap";

import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import { getHrEmployees } from "/src/store/hrEmployees/actions";

const hrEmployeesListSelector = createSelector(
  (state) => state.hrEmployees,
  (hr) => ({
    employees: hr.employees,
    loadingEmployees: hr.loadingEmployees,
    employeesError: hr.employeesError,
  })
);

const HrUsersListInner = () => {
  document.title = "HR Employees | Travco - COE";

  const dispatch = useDispatch();
  const { employees, loadingEmployees, employeesError } = useSelector(
    hrEmployeesListSelector
  );

  useEffect(() => {
    dispatch(getHrEmployees());
  }, [dispatch]);

  const renderStatus = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const renderInitialsAvatar = (first, last) => {
    const f = (first || "").charAt(0).toUpperCase();
    const l = (last || "").charAt(0).toUpperCase();
    const initials = `${f}${l}` || "?";

    return (
      <div className="avatar-xs d-inline-block me-2">
        <span className="avatar-title rounded-circle bg-soft-primary text-primary">
          {initials}
        </span>
      </div>
    );
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="HR" breadcrumbItem="Employees" />

        <Row>
          <Col lg="12">
            {employeesError && <Alert color="danger">{employeesError}</Alert>}
          </Col>
        </Row>

        <Row>
          <Col lg="12">
            <Card>
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Employees</h4>

                  <a href="/hr/users/create" className="btn btn-primary">
                    <i className="bx bx-plus me-1" />
                    Add Employee
                  </a>
                </div>

                {loadingEmployees ? (
                  <div className="d-flex align-items-center">
                    <Spinner size="sm" className="me-2" />
                    <span>Loading employees...</span>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "60px" }}>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Created At</th>
                          <th style={{ width: "120px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(employees || []).length === 0 && (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No employees found.
                            </td>
                          </tr>
                        )}

                        {(employees || []).map((user, index) => (
                          <tr key={user.USER_ID}>
                            <td>{index + 1}</td>
                            <td>
                              {renderInitialsAvatar(
                                user.FIRST_NAME,
                                user.LAST_NAME
                              )}
                              <span>
                                {user.FIRST_NAME} {user.LAST_NAME}
                              </span>
                            </td>
                            <td>{user.EMAIL}</td>
                            <td>{user.PHONE_NUMBER}</td>
                            <td>{user.DEPATRMENT_ID}</td>
                            <td>{renderStatus(user.ACTIVE_STATUS)}</td>
                            <td>{formatDate(user.CREATED_AT)}</td>
                            <td>
                              <Button
                                size="sm"
                                color="light"
                                className="me-1"
                                disabled
                              >
                                <i className="bx bx-show" />
                              </Button>
                              <Button
                                size="sm"
                                color="light"
                                className="me-1"
                                disabled
                              >
                                <i className="bx bx-pencil" />
                              </Button>
                              <Button
                                size="sm"
                                color="light"
                                disabled
                              >
                                <i className="bx bx-trash" />
                              </Button>
                              {/* Later you can wire these to /hr/users/:id etc. */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const HrUsersList = () => (
  <RequireModule moduleCode="HR_USERS">
    <HrUsersListInner />
  </RequireModule>
);

export default HrUsersList;
