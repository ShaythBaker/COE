// src/pages/HR/RuleManagement.jsx

import React, { useState, useEffect } from "react";


const RuleManagement = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleteModalMounted, setIsDeleteModalMounted] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBase = import.meta.env.VITE_API_URL || "";

        let token = "";
        try {
          const raw = localStorage.getItem("authUser");
          if (raw) {
            const parsed = JSON.parse(raw);
            token =
              parsed?.accessToken ||
              parsed?.access_token ||
              parsed?.token ||
              "";
          }
        } catch (e) {
          console.error("Failed to parse authUser from localStorage", e);
        }

        const response = await fetch(`${apiBase}/api/hr/roles`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load roles");
        }

        const data = await response.json();
        const list = data.data || data.roles || data || [];

        const mapped = Array.isArray(list)
          ? list.map((role) => ({
              ...role,
              MODULE_CODE:
                role.ROLE_NAME || role.role_name || role.name || "",
              CAN_VIEW: true,
              CAN_CREATE: true,
              CAN_EDIT: true,
              CAN_DELETE: true,
            }))
          : [];

        setRules(mapped);
      } catch (err) {
        console.error(err);
        setError(
          err.message || "Something went wrong while loading HR roles."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

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
    if (editingIndex !== null && rules[editingIndex]?._isNew) {
      // If this row was just added and not saved, remove it completely
      setRules((prev) => prev.filter((_, idx) => idx !== editingIndex));
    }
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

  const handleAddModule = () => {
    const newModule = {
      MODULE_CODE: "",
      CAN_VIEW: false,
      CAN_CREATE: false,
      CAN_EDIT: false,
      CAN_DELETE: false,
      _isNew: true,
    };

    setRules((prev) => [newModule, ...prev]);
    setEditingIndex(0);
    setEditDraft(newModule);
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

  const moduleOptions = Array.from(
    new Set(
      (rules || [])
        .map((r) => r.MODULE_CODE)
        .filter(Boolean)
    )
  );

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-10">

            <h4 className="mb-4">Rule Management</h4>

            
            <i className="bx bx-plus me-1" />
            <button className="btn btn-primary mb-3" onClick={handleAddModule}>
              Add Module
            </button>

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
                      <tr key={m.ROLE_ID || m.id || m.MODULE_CODE || index}>
                        <td>{index + 1}</td>
                        <td>
                          {isEditing ? (
                            <select
                              className="form-select form-select-sm"
                              value={current.MODULE_CODE || ""}
                              onChange={(e) => handleModuleNameChange(e.target.value)}
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
