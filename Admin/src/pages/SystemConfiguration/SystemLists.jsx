import React, { useState, useEffect, useRef } from "react";
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
  createSystemListItem,
  updateSystemListItem,
  getSystemListItemsById,
} from "../../store/SystemLists/actions";

// Toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  // Track submit cycles + saving transitions to show toast + refresh items
  const prevSavingRef = useRef(false);
  const [submitAttempt, setSubmitAttempt] = useState(false);

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
      dispatch(getSystemListItemsById(firstId, { includeInactive: true }));
    }
  }, [lists, selectedListId, dispatch]);

  // After create/update finishes: toast + refresh items + close modal on success
  useEffect(() => {
    const wasSaving = prevSavingRef.current;
    const isSaving = savingItem;

    // Detect transition: saving true -> false after a submit
    if (submitAttempt && wasSaving && !isSaving) {
      const hasError = !!error;

      if (!hasError) {
        toast.success(
          editingItem ? "Item updated successfully" : "Item added successfully"
        );

        // Refresh items so changes are reflected immediately
        if (selectedListId) {
          dispatch(
            getSystemListItemsById(selectedListId, { includeInactive: true })
          );
        }

        // Close + reset only on success
        setModalOpen(false);
        resetForm();
      } else {
        const msg =
          typeof error === "string"
            ? error
            : "Failed to save item. Please try again.";
        toast.error(msg);
      }

      setSubmitAttempt(false);
    }

    prevSavingRef.current = isSaving;
  }, [
    savingItem,
    submitAttempt,
    error,
    editingItem,
    selectedListId,
    dispatch,
  ]);

  const toggleModal = () => {
    setModalOpen((v) => !v);
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
      dispatch(getSystemListItemsById(listId, { includeInactive: true }));
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

    // Mark that a submit happened, so the "savingItem true->false" effect can react
    setSubmitAttempt(true);

    if (editingItem) {
      dispatch(
        updateSystemListItem(selectedListId, editingItem.LIST_ITEM_ID, payload)
      );
    } else {
      dispatch(createSystemListItem(selectedListId, payload));
    }

    // Do NOT close modal here. Close on success in the effect.
  };

  const selectedList = lists?.find((l) => l.LIST_ID === selectedListId);

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          {/* Toasts */}
          <ToastContainer position="top-right" autoClose={2500} />

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
                                  style={{ cursor: "pointer", fontSize: "18px" }}
                                  onClick={() => handleEditClick(item)}
                                  title="Edit"
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
                    disabled={savingItem}
                  />
                </FormGroup>

                <FormGroup check className="mt-2">
                  <Input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formValues.isActive}
                    onChange={handleChange}
                    disabled={savingItem}
                  />
                  <Label for="isActive" check>
                    Active
                  </Label>
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <Button
                  type="button"
                  color="secondary"
                  onClick={toggleModal}
                  disabled={savingItem}
                >
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
