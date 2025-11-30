import React, { useState } from "react";
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

const SystemLists = () => {
  // Breadcrumb
  const [breadcrumbItems] = useState([
    { title: "System Configuration", link: "#" },
    { title: "System Lists", link: "#" },
  ]);

  // Local state for now – later this can be replaced by Redux + API
  const [lists, setLists] = useState([
    // Example row – you can remove this if you want empty table at start
    {
      id: 1,
      name: "COUNTRY",
      code: "JO",
      description: "Jordan",
      isActive: true,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = create, object = edit

  const [formValues, setFormValues] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  // Delete confirmation modal (same logic pattern as RuleManagement)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const toggleDeleteModal = () => {
    setDeleteModalOpen(!deleteModalOpen);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormValues({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
  };

  const handleAddClick = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormValues({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      isActive: item.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    // Open confirmation modal instead of deleting immediately
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      const updated = lists.filter((row) => row.id !== itemToDelete.id);
      setLists(updated);
    }
    setItemToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formValues.name || !formValues.code) {
      // basic validation
      return;
    }

    if (editingItem) {
      // Update
      const updated = lists.map((row) =>
        row.id === editingItem.id
          ? {
              ...row,
              ...formValues,
            }
          : row
      );
      setLists(updated);
    } else {
      // Create
      const newItem = {
        id: lists.length ? Math.max(...lists.map((r) => r.id)) + 1 : 1,
        ...formValues,
      };
      setLists([...lists, newItem]);
    }

    setModalOpen(false);
    resetForm();
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          {/* Breadcrumb */}
          <Breadcrumbs
            title="System Configuration"
            breadcrumbItems={breadcrumbItems}
          />

          <Row>
            <Col lg="12">
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">System Lists</h4>
                  <Button color="primary" onClick={handleAddClick}>
                    <i className="bx bx-plus me-1" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardBody>
                  <div className="table-responsive">
                    <Table className="table table-bordered table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "60px" }}>#</th>
                          <th>List Name</th>
                          <th>Code / Value</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th style={{ width: "140px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lists && lists.length > 0 ? (
                          lists.map((item, index) => (
                            <tr key={item.id ?? index}>
                              <td>{index + 1}</td>
                              <td>{item.name}</td>
                              <td>{item.code}</td>
                              <td>{item.description}</td>
                              <td>
                                {item.isActive ? (
                                  <span className="badge bg-success">
                                    Active
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                {/* Same icon logic as RuleManagement */}
                                <i
                                  className="bx bx-edit text-primary"
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "18px",
                                  }}
                                  onClick={() => handleEditClick(item)}
                                />

                                <i
                                  className="bx bx-trash text-danger ms-3"
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "18px",
                                  }}
                                  onClick={() => handleDeleteClick(item)}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No items defined yet.
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
                {editingItem ? "Edit List Item" : "Add List Item"}
              </ModalHeader>
              <ModalBody>
                <FormGroup>
                  <Label for="name">List Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formValues.name}
                    onChange={handleChange}
                    placeholder="e.g. COUNTRY, CITY, CURRENCY"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="code">Code / Value</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    value={formValues.code}
                    onChange={handleChange}
                    placeholder="e.g. JO, IT, USD"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    type="text"
                    value={formValues.description}
                    onChange={handleChange}
                    placeholder="Optional description"
                  />
                </FormGroup>
                <FormGroup check className="mt-2">
                  <Input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formValues.isActive}
                    onChange={handleChange}
                  />
                  <Label for="isActive" check>
                    Active
                  </Label>
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button type="button" color="secondary" onClick={toggleModal}>
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  {editingItem ? "Save Changes" : "Add Item"}
                </Button>
              </ModalFooter>
            </Form>
          </Modal>

          {/* Delete confirmation modal – same UX idea as RuleManagement */}
          <Modal isOpen={deleteModalOpen} toggle={toggleDeleteModal} centered>
            <ModalHeader toggle={toggleDeleteModal}>Confirm Delete</ModalHeader>
            <ModalBody>
              Are you sure you want to delete{" "}
              <strong>{itemToDelete?.name}</strong>?
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
    </React.Fragment>
  );
};

export default SystemLists;