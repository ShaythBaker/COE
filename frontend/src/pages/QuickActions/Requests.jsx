// src/pages/QuickActions/Requests.jsx

import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Label,
  Input,
} from "reactstrap";

import Breadcrumb from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";

const QuickActionsRequests = () => {
  document.title = "Requests | Travco - COE";

  // placeholders (until backend is ready)
  const [requests, setRequests] = useState([]);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newReq, setNewReq] = useState({
    title: "",
    type: "GENERAL",
    description: "",
  });

  const toggleNew = () => setIsNewOpen((v) => !v);

  const onNewChange = (key, value) => {
    setNewReq((prev) => ({ ...prev, [key]: value }));
  };

  const submitNew = () => {
    // placeholder: local-only create until backend is wired
    const payload = {
      id: Date.now(),
      title: newReq.title || "Untitled Request",
      type: newReq.type,
      description: newReq.description,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [payload, ...(prev || [])]);
    setNewReq({ title: "", type: "GENERAL", description: "" });
    setIsNewOpen(false);
  };

  useEffect(() => {
    // TODO: replace with API call later
    setRequests([
      {
        id: 1,
        title: "Leave Request",
        status: "Pending",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const renderStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "approved") return <Badge color="success">Approved</Badge>;
    if (s === "rejected") return <Badge color="danger">Rejected</Badge>;
    return <Badge color="warning">Pending</Badge>;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Quick Actions" breadcrumbItem="Requests" />

        <Row>
          <Col lg="12">
            <Card>
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Requests</h4>

                  <Button color="primary" onClick={toggleNew}>
                    <i className="bx bx-plus me-1" />
                    New Request
                  </Button>
                </div>

                <Modal isOpen={isNewOpen} toggle={toggleNew} centered>
                  <ModalHeader toggle={toggleNew}>New Request</ModalHeader>
                  <ModalBody>
                    <Form>
                      <div className="mb-3">
                        <Label className="form-label">Request Title</Label>
                        <Input
                          type="text"
                          value={newReq.title}
                          placeholder="e.g., Leave Request / IT Support"
                          onChange={(e) => onNewChange("title", e.target.value)}
                        />
                        <small className="text-muted">
                          Placeholder — will be validated and saved via backend later.
                        </small>
                      </div>

                      <div className="mb-3">
                        <Label className="form-label">Request Type</Label>
                        <Input
                          type="select"
                          value={newReq.type}
                          onChange={(e) => onNewChange("type", e.target.value)}
                        >
                          <option value="GENERAL">General</option>
                          <option value="HR">HR</option>
                          <option value="IT">IT</option>
                          <option value="FINANCE">Finance</option>
                        </Input>
                      </div>

                      <div className="mb-0">
                        <Label className="form-label">Description</Label>
                        <Input
                          type="textarea"
                          rows="4"
                          value={newReq.description}
                          placeholder="Write a short description..."
                          onChange={(e) => onNewChange("description", e.target.value)}
                        />
                      </div>
                    </Form>
                  </ModalBody>

                  <ModalFooter>
                    <Button color="light" onClick={toggleNew}>
                      Cancel
                    </Button>
                    <Button color="primary" onClick={submitNew}>
                      Create Request
                    </Button>
                  </ModalFooter>
                </Modal>

                <div className="table-responsive">
                  <Table className="align-middle table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 80 }}>#</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th style={{ width: 90 }}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            No requests yet.
                          </td>
                        </tr>
                      ) : (
                        requests.map((r, idx) => (
                          <tr key={r.id}>
                            <td>{idx + 1}</td>
                            <td>{r.title}</td>
                            <td>{renderStatus(r.status)}</td>
                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                            <td>
                              <Link
                                to={`/quick-actions/requests/${r.id}/view`}
                                className="btn btn-light btn-sm"
                                title="View"
                              >
                                <i className="bx bx-show" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>

                <small className="text-muted d-block mt-2">
                  Placeholder page — backend integration comes next.
                </small>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default QuickActionsRequests;