import React, { useState, useEffect } from "react";
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
  Spinner,
  Alert,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";

import Breadcrumbs from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import {
  getSystemLists,
  getSystemListItems,
  createSystemListItem,
  updateSystemListItem,
} from "../../store/SystemLists/actions";

const SystemListsInner = () => {
  document.title = "System Configuration | Lists";
  // Breadcrumb
  const [breadcrumbItems] = useState([
    { title: "System Configuration", link: "#" },
    { title: "System Lists", link: "#" },
  ]);

  const dispatch = useDispatch();
  const { lists, items, loadingLists, loadingItems, savingItem, error } =
    useSelector((state) => state.SystemLists || {});

  const [selectedListId, setSelectedListId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = create, object = edit

  const [formValues, setFormValues] = useState({
    itemName: "",
    isActive: true,
  });

  // Load lists on mount
  useEffect(() => {
    dispatch(getSystemLists());
  }, [dispatch]);

  // When lists load, auto-select first list and load its items
  useEffect(() => {
    if (!selectedListId && lists && lists.length > 0) {
      const firstId = lists[0].LIST_ID;
      setSelectedListId(firstId);
      // This page wants ALL items (active + inactive)
      dispatch(getSystemListItems(firstId, { includeInactive: true }));
    }
  }, [lists, selectedListId, dispatch]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormValues({
      itemName: "",
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
      itemName: item.ITEM_NAME || "",
      isActive: item.ACTIVE_STATUS === 1,
    });
    setModalOpen(true);
  };

  const handleListChange = (e) => {
    const listId = Number(e.target.value);
    setSelectedListId(listId);
    if (listId) {
      // This page wants ALL items (active + inactive)
      dispatch(getSystemListItems(listId, { includeInactive: true }));
    }
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

    if (!selectedListId) return;
    if (!formValues.itemName) return;

    const payload = {
      ITEM_NAME: formValues.itemName,
      ACTIVE_STATUS: formValues.isActive ? 1 : 0,
    };

    if (editingItem) {
      // Update existing item
      dispatch(
        updateSystemListItem(selectedListId, editingItem.LIST_ITEM_ID, payload)
      );
    } else {
      // Create new item
      dispatch(createSystemListItem(selectedListId, payload));
    }

    // Close immediately; if you prefer "close on success only" we can do it via a success flag
    setModalOpen(false);
    resetForm();
  };

  const selectedList = lists?.find((l) => l.LIST_ID === selectedListId);

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
                  <div className="d-flex align-items-center gap-3">
                    <h4 className="card-title mb-0">System Lists</h4>

                    {/* List selector */}
                    <div className="d-flex align-items-center">
                      <Label className="me-2 mb-0">List:</Label>
                      <Input
                        type="select"
                        bsSize="sm"
                        value={selectedListId || ""}
                        onChange={handleListChange}
                        disabled={loadingLists}
                      >
                        <option value="">Select list</option>
                        {lists &&
                          lists.map((list) => (
                            <option key={list.LIST_ID} value={list.LIST_ID}>
                              {list.LIST_NAME} ({list.LIST_KEY})
                            </option>
                          ))}
                      </Input>
                      {loadingLists && <Spinner size="sm" className="ms-2" />}
                    </div>
                  </div>

                  <Button
                    color="primary"
                    onClick={handleAddClick}
                    disabled={!selectedListId || savingItem}
                  >
                    {savingItem && <Spinner size="sm" className="me-2" />}
                    <i className="bx bx-plus me-1" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardBody>
                  {error && typeof error === "string" && (
                    <Alert color="danger" className="mb-3">
                      {error}
                    </Alert>
                  )}

                  <div className="mb-2">
                    {selectedList && (
                      <small className="text-muted">
                        <strong>Selected List:</strong> {selectedList.LIST_NAME}{" "}
                        ({selectedList.LIST_KEY}) – {selectedList.DESCRIPTION}
                      </small>
                    )}
                  </div>

                  <div className="table-responsive">
                    <Table className="table table-bordered table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "60px" }}>#</th>
                          <th>Item Name</th>
                          <th>Status</th>
                          <th style={{ width: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingItems ? (
                          <tr>
                            <td colSpan="4" className="text-center">
                              <Spinner size="sm" className="me-2" />
                              Loading items...
                            </td>
                          </tr>
                        ) : items && items.length > 0 ? (
                          items.map((item, index) => (
                            <tr key={item.LIST_ITEM_ID ?? index}>
                              <td>{index + 1}</td>
                              <td>{item.ITEM_NAME}</td>
                              <td>
                                {item.ACTIVE_STATUS === 1 ? (
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
                                <i
                                  className="bx bx-edit text-primary"
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "18px",
                                  }}
                                  onClick={() => handleEditClick(item)}
                                />
                                {/* Delete is not wired because no DELETE API was provided */}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              {selectedListId
                                ? "No items defined yet."
                                : "Select a list to view its items."}
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
                  <Label for="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    name="itemName"
                    type="text"
                    value={formValues.itemName}
                    onChange={handleChange}
                    placeholder="e.g. Jordan, United Arab Emirates"
                    required
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
                <Button type="submit" color="primary" disabled={savingItem}>
                  {savingItem && <Spinner size="sm" className="me-2" />}
                  {editingItem ? "Save Changes" : "Add Item"}
                </Button>
              </ModalFooter>
            </Form>
          </Modal>
        </div>
      </div>
    </React.Fragment>
  );
};

const SystemLists = () => (
  <RequireModule moduleCode="ACCESS_ROLES">
    <SystemListsInner />
  </RequireModule>
);

export default SystemLists;
