// src/pages/HR/RuleManagement.jsx
//
// This page now follows the Skote React structure more strictly:
// - Data is loaded via Redux + Saga using helpers (see Frontend Documentation).
// - API calls must be defined in helpers/url_helper.js and helpers/fakebackend_helper.js.
// - This component is responsible only for UI + local edit/delete/add UI state.

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

// Redux actions for HR Rules (you must create these in src/store/HrRules/actions.js)
import {
  getHrRules,
  createHrRule,
  updateHrRule,
  deleteHrRule,
} from "../../store/HrRules/actions";
const RuleManagement = () => {
  const dispatch = useDispatch();

  // --- Redux state: source of truth for rules list, loading, error ---
  const hrRulesState = useSelector((state) => state.HrRules);
  const {
    rules: storeRules = [],
    loading = false,
    error = null,
  } = hrRulesState || {};

  // --- Local UI state: editing / delete modal / working copy of rules ---
  // We keep a local copy so the table can behave immediately while Redux/saga
  // persists to the backend in the background.
  const [rules, setRules] = useState([]);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleteModalMounted, setIsDeleteModalMounted] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  // Set page title once
  useEffect(() => {
    document.title = "Rule Management | Skote - React Admin & Dashboard Template";
  }, []);

  // On first mount, load HR rules from backend via Redux saga
  useEffect(() => {
    dispatch(getHrRules());
    // We intentionally run this only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializedFromStoreRef = useRef(false);

  // Initialize local rules from Redux only once when data first arrives
  useEffect(() => {
    if (!storeRules || initializedFromStoreRef.current) return;
    setRules(storeRules);
    initializedFromStoreRef.current = true;
  }, [storeRules]);

  // Dropdown options for module name, derived from current rules list
  const moduleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (rules || [])
            .map((r) => r.MODULE_CODE)
            .filter(Boolean)
        )
      ),
    [rules]
  );

  const handlePermissionChange = (field, value) => {
    if (!editDraft) return;
    setEditDraft((prev) => ({
      ...prev,
      [field]: value === "Yes",
    }));
  };

  const handleModuleNameChange = (value) => {
    if (!editDraft) return;
    setEditDraft((prev) => ({
      ...prev,
      MODULE_CODE: value,
    }));
  };

  const handleEditClick = (index) => {
    setEditingIndex(index);
    setEditDraft(rules[index] ? { ...rules[index] } : null);
  };

  const openDeleteConfirm = (index) => {
    setDeleteIndex(index);
    // Mount the modal first
    setIsDeleteModalMounted(true);
    // Then in the next tick, trigger the fade-in by adding "show"
    setTimeout(() => {
      setShowDeleteConfirm(true);
    }, 0);
  };

  const handleConfirmDelete = () => {
    if (deleteIndex === null) return;

    const ruleToDelete = rules[deleteIndex];

    // Optimistic UI update
    setRules((prev) => prev.filter((_, i) => i !== deleteIndex));
    console.log("Deleted rule at index:", deleteIndex);

    // Dispatch Redux action so saga can call the backend
    if (ruleToDelete) {
      dispatch(deleteHrRule(ruleToDelete));
    }

    // Start fade-out
    setShowDeleteConfirm(false);
    // After the fade duration, unmount the modal and clear index
    setTimeout(() => {
      setIsDeleteModalMounted(false);
      setDeleteIndex(null);
    }, 150); // 150ms matches Bootstrap's default modal fade duration
  };

  const handleCancelDelete = () => {
    // Start fade-out only
    setShowDeleteConfirm(false);
    setTimeout(() => {
      setIsDeleteModalMounted(false);
      setDeleteIndex(null);
    }, 150);
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && rules[editingIndex]?._isNew) {
      // If this row was just added and not saved, remove it completely
      setRules((prev) => prev.filter((_, idx) => idx !== editingIndex));
    }
    setEditingIndex(null);
    setEditDraft(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editDraft) return;

    // Optimistic UI update for the table
    setRules((prev) =>
      prev.map((rule, idx) => (idx === editingIndex ? editDraft : rule))
    );

    console.log("Saving rule:", editDraft);

    // Dispatch Redux action – saga will call the appropriate helper:
    // - createHrRule for new rows
    // - updateHrRule for existing rows
    if (editDraft._isNew) {
      dispatch(createHrRule(editDraft));
    } else {
      dispatch(updateHrRule(editDraft));
    }

    setEditingIndex(null);
    setEditDraft(null);
  };

  const handleAddModule = () => {
    const newModule = {
      MODULE_CODE: "",
      CAN_VIEW: false,
      CAN_CREATE: false,
      CAN_EDIT: false,
      CAN_DELETE: false,
      _isNew: true,
    };

    // Prepend the new row to the list and immediately go into edit mode
    setRules((prev) => [newModule, ...prev]);
    setEditingIndex(0);
    setEditDraft(newModule);
  };

  if (loading) {
    return (
      <div className="page-content">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <h4 className="mb-4">Rule Management</h4>

            <button className="btn btn-primary mb-3" onClick={handleAddModule}>
              + Add Role
            </button>

            <div className="table-responsive">
              <table className="table table-nowrap mb-5">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Role</th>
                    <th>Can View</th>
                    <th>Can Create</th>
                    <th>Can Edit</th>
                    <th>Can Delete</th>
                    <th style={{ width: "120px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((m, index) => {
                    const isEditing = editingIndex === index;
                    const current = isEditing && editDraft ? editDraft : m;

                    return (
                      <tr key={m.ROLE_ID || m.id || m.MODULE_CODE || index}>
                        <td>{index + 1}</td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.MODULE_CODE || ""}
                              onChange={(e) =>
                                handleModuleNameChange(e.target.value)
                              }
                            >
                              <option value="">Select module</option>
                              {moduleOptions.map((name, idx) => (
                                <option key={name || idx} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            m.MODULE_CODE
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.CAN_VIEW ? "Yes" : "No"}
                              onChange={(e) =>
                                handlePermissionChange(
                                  "CAN_VIEW",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : m.CAN_VIEW ? (
                            "Yes"
                          ) : (
                            "No"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.CAN_CREATE ? "Yes" : "No"}
                              onChange={(e) =>
                                handlePermissionChange(
                                  "CAN_CREATE",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : m.CAN_CREATE ? (
                            "Yes"
                          ) : (
                            "No"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.CAN_EDIT ? "Yes" : "No"}
                              onChange={(e) =>
                                handlePermissionChange(
                                  "CAN_EDIT",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : m.CAN_EDIT ? (
                            "Yes"
                          ) : (
                            "No"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.CAN_DELETE ? "Yes" : "No"}
                              onChange={(e) =>
                                handlePermissionChange(
                                  "CAN_DELETE",
                                  e.target.value
                                )
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : m.CAN_DELETE ? (
                            "Yes"
                          ) : (
                            "No"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm me-1"
                                onClick={handleSaveEdit}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                onClick={() => handleEditClick(index)}
                              >
                                <i className="bx bx-pencil" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-light btn-sm ms-2"
                                onClick={() => openDeleteConfirm(index)}
                              >
                                <i className="bx bx-trash" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isDeleteModalMounted && (
        <>
          <div
            className={`modal fade ${
              showDeleteConfirm ? "show d-block" : "d-block"
            }`}
            tabIndex="-1"
            role="dialog"
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCancelDelete}
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete this rule{" "}
                    {deleteIndex !== null && rules[deleteIndex]
                      ? `(${rules[deleteIndex].MODULE_CODE})`
                      : ""}
                    ?
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelDelete}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleConfirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`modal-backdrop fade ${
              showDeleteConfirm ? "show" : ""
            }`}
          />
        </>
      )}
    </div>
  );
};

export default RuleManagement;
