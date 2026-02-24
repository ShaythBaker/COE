// src/pages/HR/RuleManagement.jsx
import React, { useEffect, useState } from "react";
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
} from "reactstrap";
import { useNavigate } from "react-router-dom";

import Breadcrumbs from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import { getAccessModulesApi } from "../../helpers/fakebackend_helper";

const RuleManagementModulesInner = () => {
  const navigate = useNavigate();

  const [breadcrumbItems] = useState([
    { title: "System Configuration", link: "#" },
    { title: "Rule Management", link: "#" },
  ]);

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAccessModulesApi();
      const list = res?.data || res || [];
      // Optionally filter only active modules
      const normalized = Array.isArray(list)
        ? list.filter((m) => m.ACTIVE_STATUS === 1 || m.MODULE_ACTIVE_STATUS === 1 || m.ACTIVE_STATUS === undefined)
        : [];
      setModules(normalized);
    } catch (e) {
      console.error("Failed to load access modules:", e);
      setError(e?.response?.data || e.message || "Failed to load modules");
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Rule Management | Skote";
    loadModules();
  }, []);

  const handleManageRoles = (moduleObj) => {
    navigate(`/system-configuration/rule-management/${moduleObj.MODULE_ID}`, {
      state: { module: moduleObj },
    });
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
                <h4 className="card-title mb-0">Rule Management</h4>
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
                        <th>Module</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th style={{ width: "140px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <Spinner size="sm" className="me-2" />
                            Loading modules...
                          </td>
                        </tr>
                      ) : modules && modules.length > 0 ? (
                        modules.map((m, index) => (
                          <tr key={m.MODULE_ID ?? index}>
                            <td>{index + 1}</td>
                            <td>
                              {m.MODULE_NAME || m.MODULE_CODE}{" "}
                              {m.MODULE_CODE && m.MODULE_NAME && (
                                <small className="text-muted">
                                  ({m.MODULE_CODE})
                                </small>
                              )}
                            </td>
                            <td>{m.DESCRIPTION || m.MODULE_DESCRIPTION}</td>
                            <td>
                              {m.ACTIVE_STATUS === 1 ||
                              m.MODULE_ACTIVE_STATUS === 1 ? (
                                <span className="badge bg-success">
                                  Active
                                </span>
                              ) : (
                                <span className="badge bg-secondary">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td>
                              <Button
                                color="primary"
                                size="sm"
                                onClick={() => handleManageRoles(m)}
                              >
                                Manage Roles
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No modules found.
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
      </div>
    </div>
  );
};

const RuleManagementModules = () => (
  <RequireModule moduleCode="ACCESS_ROLES">
    <RuleManagementModulesInner />
  </RequireModule>
);

export default RuleManagementModules;
