// src/pages/HR/RuleManagement.jsx

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
} from "reactstrap";

import Breadcrumbs from "../../components/Common/Breadcrumb";

import {
  getHrRules,
  createHrRule,
  updateHrRule,
  deleteHrRule,
} from "../../store/HrRules/actions";

import { getAccessModulesApi } from "../../helpers/fakebackend_helper";

const RuleManagement = () => {
  const dispatch = useDispatch();

  const [breadcrumbItems] = useState([
    { title: "HR", link: "#" },
    { title: "Rule Management", link: "#" },
  ]);

  const { rules = [], loading, error } = useSelector(
    (state) => state.HrRules || {}
  );

  // Modules (departments) coming from /api/access/modules
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Modal logic
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formValues, setFormValues] = useState({
    MODULE_ID: "",
    MODULE_CODE: "",
    ROLE_NAME: "",
    CAN_VIEW: true,
    CAN_CREATE: false,
    CAN_EDIT: false,
    CAN_DELETE: false,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    document.title = "Rule Management | Skote";
    dispatch(getHrRules());
    loadModules();
  }, [dispatch]);

  const loadModules = async () => {
    try {
      setModulesLoading(true);
      const res = await getAccessModulesApi();
      const list = res?.data || res || [];
      setModules(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Failed to load access modules:", e);
    } finally {
      setModulesLoading(false);
    }
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const toggleDeleteModal = () => {
    setDeleteModalOpen(!deleteModalOpen);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormValues({
      MODULE_ID: "",
      MODULE_CODE: "",
      ROLE_NAME: "",
      CAN_VIEW: true,
      CAN_CREATE: false,
      CAN_EDIT: false,
      CAN_DELETE: false,
    });
  };

  const handleAddClick = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormValues({
      MODULE_ID: item.MODULE_ID || "",
      MODULE_CODE: item.MODULE_CODE || "",
      ROLE_NAME: item.ROLE_NAME || "",
      CAN_VIEW: item.CAN_VIEW ?? false,
      CAN_CREATE: item.CAN_CREATE ?? false,
      CAN_EDIT: item.CAN_EDIT ?? false,
      CAN_DELETE: item.CAN_DELETE ?? false,
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      dispatch(deleteHrRule(itemToDelete));
    }
    setItemToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for MODULE_ID so we can also populate MODULE_CODE
    if (name === "MODULE_ID") {
      const selected = modules.find(
        (m) => String(m.MODULE_ID) === String(value)
      );
      setFormValues((prev) => ({
        ...prev,
        MODULE_ID: value,
        MODULE_CODE: selected?.MODULE_CODE || prev.MODULE_CODE || "",
      }));
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formValues.MODULE_ID || !formValues.ROLE_NAME) return;

    const payload = {
      ...editingItem,
      ...formValues,
    };

    if (editingItem) {
      dispatch(updateHrRule(payload));
    } else {
      dispatch(createHrRule(payload));
    }

    setModalOpen(false);
    resetForm();
  };

  const resolveModuleLabel = (rule) => {
    if (!modules || modules.length === 0) {
      // Fallback: show code if we have it
      return rule.MODULE_CODE || "";
    }

    // First try by MODULE_ID
    if (rule.MODULE_ID) {
      const foundById = modules.find(
        (m) => String(m.MODULE_ID) === String(rule.MODULE_ID)
      );
      if (foundById) {
        return foundById.MODULE_NAME || foundById.MODULE_CODE;
      }
    }

    // Then fallback by MODULE_CODE
    if (rule.MODULE_CODE) {
      const foundByCode = modules.find(
        (m) => m.MODULE_CODE === rule.MODULE_CODE
      );
      if (foundByCode) {
        return foundByCode.MODULE_NAME || foundByCode.MODULE_CODE;
      }
    }

    return rule.MODULE_CODE || "";
  };

  if (loading || modulesLoading) {
    return <div className="page-content">Loading...</div>;
  }

  if (error) {
    return (
      <div className="page-content">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Breadcrumbs title="HR" breadcrumbItems={breadcrumbItems} />

        <Row>
          <Col lg="12">
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h4 className="card-title mb-0">Rule Management</h4>
                <Button color="primary" onClick={handleAddClick}>
                  <i className="bx bx-plus me-1" />
                  Add Role
                </Button>
              </CardHeader>

              <CardBody>
                <div className="table-responsive">
                  <Table className="table table-bordered table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Module</th>
                        <th>Role</th>
                        <th>View</th>
                        <th>Create</th>
                        <th>Edit</th>
                        <th>Delete</th>
                        <th style={{ width: "140px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.length > 0 ? (
                        rules.map((item, index) => (
                          <tr key={item.id || item.ROLE_ID || index}>
                            <td>{index + 1}</td>
                            <td>{resolveModuleLabel(item)}</td>
                            <td>{item.ROLE_NAME}</td>
                            <td>{item.CAN_VIEW ? "Yes" : "No"}</td>
                            <td>{item.CAN_CREATE ? "Yes" : "No"}</td>
                            <td>{item.CAN_EDIT ? "Yes" : "No"}</td>
                            <td>{item.CAN_DELETE ? "Yes" : "No"}</td>
                            <td className="text-center">
                              <i
                                className="bx bx-edit text-primary"
                                style={{ cursor: "pointer", fontSize: "18px" }}
                                onClick={() => handleEditClick(item)}
                              />
                              <i
                                className="bx bx-trash text-danger ms-3"
                                style={{ cursor: "pointer", fontSize: "18px" }}
                                onClick={() => handleDeleteClick(item)}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">
                            No rules defined yet.
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

        {/* Add / Edit Modal */}
        <Modal isOpen={modalOpen} toggle={toggleModal} centered>
          <Form onSubmit={handleSubmit}>
            <ModalHeader toggle={toggleModal}>
              {editingItem ? "Edit Role" : "Add Role"}
            </ModalHeader>

            <ModalBody>
              <FormGroup>
                <Label>Module</Label>
                <Input
                  type="select"
                  name="MODULE_ID"
                  value={formValues.MODULE_ID || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select module</option>
                  {modules.map((m) => (
                    <option key={m.MODULE_ID} value={m.MODULE_ID}>
                      {m.MODULE_NAME || m.MODULE_CODE}
                    </option>
                  ))}
                </Input>
              </FormGroup>

              <FormGroup>
                <Label>Role Name</Label>
                <Input
                  name="ROLE_NAME"
                  value={formValues.ROLE_NAME}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup check>
                <Input
                  type="checkbox"
                  name="CAN_VIEW"
                  checked={formValues.CAN_VIEW}
                  onChange={handleChange}
                />{" "}
                View
              </FormGroup>
              <FormGroup check>
                <Input
                  type="checkbox"
                  name="CAN_CREATE"
                  checked={formValues.CAN_CREATE}
                  onChange={handleChange}
                />{" "}
                Create
              </FormGroup>
              <FormGroup check>
                <Input
                  type="checkbox"
                  name="CAN_EDIT"
                  checked={formValues.CAN_EDIT}
                  onChange={handleChange}
                />{" "}
                Edit
              </FormGroup>
              <FormGroup check>
                <Input
                  type="checkbox"
                  name="CAN_DELETE"
                  checked={formValues.CAN_DELETE}
                  onChange={handleChange}
                />{" "}
                Delete
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              <Button color="secondary" onClick={toggleModal}>
                Cancel
              </Button>
              <Button type="submit" color="primary">
                {editingItem ? "Save Changes" : "Add Role"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={deleteModalOpen} toggle={toggleDeleteModal} centered>
          <ModalHeader toggle={toggleDeleteModal}>Confirm Delete</ModalHeader>
          <ModalBody>
            Are you sure you want to delete{" "}
            <strong>{itemToDelete?.ROLE_NAME}</strong>?
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggleDeleteModal}>
              Cancel
            </Button>
            <Button color="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
};

export default RuleManagement;