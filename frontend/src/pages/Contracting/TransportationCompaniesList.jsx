// src/pages/Contracting/TransportationCompaniesList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Alert,
  Spinner,
  Badge,
  Button,
  Row,
  Col,
  Input,
  Label,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import TableContainer from "../../components/Common/TableContainer";

import { getTransportationCompanies } from "../../store/transportation/actions";

const selector = createSelector(
  (state) => state.Transportation || {},
  (s) => ({
    companies: s.companies || [],
    loadingCompanies: s.loadingCompanies || false,
    companiesError: s.companiesError || null,
  })
);

const TransportationCompaniesListInner = () => {
  document.title = "Transportation Companies | COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companies, loadingCompanies, companiesError } = useSelector(selector);

  const [activeStatus, setActiveStatus] = useState("");

  useEffect(() => {
    dispatch(getTransportationCompanies({ ACTIVE_STATUS: activeStatus }));
  }, [dispatch, activeStatus]);

  const statusBadge = (v) => {
    const isActive = v === 1 || v === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "TRANSPORTATION_COMPANY_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Phone",
        accessorKey: "TRANSPORTATION_PHONE",
        enableColumnFilter: false,
      },
      {
        header: "Email",
        accessorKey: "TRANSPORTATION_COMPANY_EMAIL",
        enableColumnFilter: false,
      },
      {
        header: "Contact Person",
        accessorKey: "TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Status",
        accessorKey: "TRANSPORTATION_COMPANY_ACTIVE_STATUS",
        enableColumnFilter: false,
        cell: (info) => statusBadge(info.getValue()),
      },
      {
        header: "Actions",
        id: "actions",
        enableColumnFilter: false,
        cell: (info) => {
          const row = info.row.original;
          return (
            <Button
              color="link"
              size="sm"
              className="p-0"
              onClick={() =>
                navigate(
                  `/contracting/transportation/companies/${row.TRANSPORTATION_COMPANY_ID}`
                )
              }
            >
              View Profile
            </Button>
          );
        },
      },
    ],
    [navigate]
  );

  return (
    <RequireModule moduleName="TRANSPORTATION">
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Transportation" />

          <Card>
            <CardBody>
              <Row className="align-items-end mb-3">
                <Col md={6}>
                  <Label className="form-label">Filter by Status</Label>
                  <Input
                    type="select"
                    value={activeStatus}
                    onChange={(e) => setActiveStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </Input>
                </Col>

                <Col md={6} className="text-md-end mt-3 mt-md-0">
                  <Button
                    color="primary"
                    onClick={() =>
                      navigate("/contracting/transportation/companies/create")
                    }
                  >
                    <i className="bx bx-plus me-1" />
                    Add Company
                  </Button>
                </Col>
              </Row>

              {companiesError && (
                <Alert color="danger" className="mb-3">
                  {companiesError}
                </Alert>
              )}

              {loadingCompanies ? (
                <div className="text-center my-3">
                  <Spinner size="sm" className="me-2" />
                  Loading companies...
                </div>
              ) : (
                <TableContainer
                  columns={columns}
                  data={companies || []}
                  isGlobalFilter
                  isAddOptions={false}
                  customPageSize={10}
                  className="custom-header-css"
                />
              )}
            </CardBody>
          </Card>
        </Container>
      </div>
    </RequireModule>
  );
};

export default function TransportationCompaniesList() {
  return <TransportationCompaniesListInner />;
}
