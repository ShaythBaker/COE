// src/pages/QuickActions/RequestsView.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, CardBody, Button, Badge, Spinner } from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";

const RequestsViewInner = () => {
  document.title = "View Request | Travco - COE";

  const { id } = useParams();
  const navigate = useNavigate();

  // Placeholder until backend is wired:
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    // TODO: replace with API call: getRequestDetail(id)
    setLoading(true);

    // temporary mock
    setTimeout(() => {
      setRequest({
        id,
        title: "Leave Request",
        type: "HR",
        description: "Requesting annual leave (placeholder).",
        status: "Pending",
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 150);
  }, [id]);

  const renderStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "approved") return <Badge color="success">Approved</Badge>;
    if (s === "rejected") return <Badge color="danger">Rejected</Badge>;
    return <Badge color="warning">Pending</Badge>;
  };

  const date = useMemo(() => {
    if (!request?.createdAt) return "-";
    try {
      return new Date(request.createdAt).toLocaleDateString();
    } catch {
      return "-";
    }
  }, [request?.createdAt]);

  const time = useMemo(() => {
    if (!request?.createdAt) return "-";
    try {
      return new Date(request.createdAt).toLocaleTimeString();
    } catch {
      return "-";
    }
  }, [request?.createdAt]);

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Quick Actions" breadcrumbItem="View Request" />
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <Spinner size="sm" className="me-2 spinner-border text-success" />
                  Loading request...
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Quick Actions" breadcrumbItem="View Request" />
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <div className="text-muted">Request not found.</div>
                  <Button color="secondary" className="mt-3" onClick={() => navigate("/quick-actions/requests")}>
                    Back to Requests
                  </Button>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Quick Actions" breadcrumbItem="View Request" />

        <Row>
          <Col lg="12">
            <Card>
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Request Details</h4>

                  <Button color="secondary" onClick={() => navigate("/quick-actions/requests")}>
                    Back
                  </Button>
                </div>

                <Row className="g-3">
                  <Col md={12}>
                    <div className="p-3 border rounded">
                      <h5 className="mb-1">{request.title || "-"}</h5>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted">Type:</span>
                        <span className="fw-semibold">{request.type || "-"}</span>

                        <span className="ms-3 text-muted">Status:</span>
                        <span>{renderStatus(request.status)}</span>
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="p-3 border rounded h-100">
                      <p className="text-muted mb-1">Date</p>
                      <h6 className="mb-0">{date}</h6>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="p-3 border rounded h-100">
                      <p className="text-muted mb-1">Time</p>
                      <h6 className="mb-0">{time}</h6>
                    </div>
                  </Col>

                  <Col md={12}>
                    <div className="p-3 border rounded">
                      <p className="text-muted mb-1">Description</p>
                      <div>{request.description || "-"}</div>
                    </div>
                  </Col>
                </Row>

                <small className="text-muted d-block mt-3">
                  Placeholder view — backend will load the real request by ID.
                </small>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const RequestsView = () => <RequestsViewInner />;

export default RequestsView;