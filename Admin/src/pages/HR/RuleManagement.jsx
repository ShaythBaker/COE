// src/pages/HR/RuleManagement.jsx

import React, { useState, useEffect } from "react";
import { usePermissions } from "../../helpers/usePermissions";
import { Link } from "react-router-dom";

const RuleManagement = () => {
  const { loading, error, modules } = usePermissions();

  const [rules, setRules] = useState([]);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleteModalMounted, setIsDeleteModalMounted] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  useEffect(() => {
    setRules(modules || []);
  }, [modules]);

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
    setRules((prev) => prev.filter((_, i) => i !== deleteIndex));
    console.log("Deleted rule at index:", deleteIndex);
    // TODO: call backend API to delete rule

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
    setEditingIndex(null);
    setEditDraft(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editDraft) return;
    setRules((prev) =>
      prev.map((rule, idx) => (idx === editingIndex ? editDraft : rule))
    );
    console.log("Saving rule:", editDraft);
    // TODO: call backend API here to persist the changes
    setEditingIndex(null);
    setEditDraft(null);
  };

  if (loading) {
    return <div className="page-content"><p>Loading...</p></div>;
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

            <div className="table-responsive">
              <table className="table table-nowrap mb-5">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Module</th>
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
                      <tr key={m.MODULE_CODE}>
                        <td>{index + 1}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={current.MODULE_CODE}
                              onChange={(e) => handleModuleNameChange(e.target.value)}
                            />
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
                                handlePermissionChange("CAN_VIEW", e.target.value)
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            m.CAN_VIEW ? "Yes" : "No"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.CAN_CREATE ? "Yes" : "No"}
                              onChange={(e) =>
                                handlePermissionChange("CAN_CREATE", e.target.value)
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            m.CAN_CREATE ? "Yes" : "No"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.CAN_EDIT ? "Yes" : "No"}
                              onChange={(e) =>
                                handlePermissionChange("CAN_EDIT", e.target.value)
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            m.CAN_EDIT ? "Yes" : "No"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.CAN_DELETE ? "Yes" : "No"}
                              onChange={(e) =>
                                handlePermissionChange("CAN_DELETE", e.target.value)
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            m.CAN_DELETE ? "Yes" : "No"
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
              className={`modal fade ${showDeleteConfirm ? "show d-block" : "d-block"}`}
              tabIndex="-1"
              role="dialog"
            >
              <div className="modal-dialog modal-dialog-centered" role="document">
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
              className={`modal-backdrop fade ${showDeleteConfirm ? "show" : ""}`}
            />
          </>
        )}
    </div>
  );
};

export default RuleManagement;
