// src/pages/HR/RuleManagement.jsx

import React from "react";
import { usePermissions } from "../../helpers/usePermissions"; // <- path is correct based on your error

const RuleManagement = () => {
  // Read permissions for the current user/role from Redux
  const { loading, error, modules } = usePermissions();

  if (loading) {
    return <div style={{ padding: "24px", color: "white" }}>Loading rules...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "24px", color: "red" }}>
        Error: {error}
      </div>
    );
  }

  // modules is an array of objects like:
  // { MODULE_CODE, CAN_VIEW, CAN_CREATE, CAN_EDIT, CAN_DELETE, ... }
  const rules = modules || [];

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ marginBottom: "16px", color: "white" }}>Rule Management</h2>

      {rules.length === 0 ? (
        <p style={{ color: "white" }}>No rules found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#111",
            color: "white",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #444", padding: "8px" }}>Module Code</th>
              <th style={{ border: "1px solid #444", padding: "8px" }}>Can View</th>
              <th style={{ border: "1px solid #444", padding: "8px" }}>Can Create</th>
              <th style={{ border: "1px solid #444", padding: "8px" }}>Can Edit</th>
              <th style={{ border: "1px solid #444", padding: "8px" }}>Can Delete</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((m, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #444", padding: "8px" }}>
                  {m.MODULE_CODE}
                </td>
                <td style={{ border: "1px solid #444", padding: "8px" }}>
                  {m.CAN_VIEW ? "Yes" : "No"}
                </td>
                <td style={{ border: "1px solid #444", padding: "8px" }}>
                  {m.CAN_CREATE ? "Yes" : "No"}
                </td>
                <td style={{ border: "1px solid #444", padding: "8px" }}>
                  {m.CAN_EDIT ? "Yes" : "No"}
                </td>
                <td style={{ border: "1px solid #444", padding: "8px" }}>
                  {m.CAN_DELETE ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RuleManagement;
