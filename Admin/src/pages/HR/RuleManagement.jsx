// src/pages/HR/RuleManagement.jsx

import React from "react";
import { usePermissions } from "../../helpers/usePermissions";

const RuleManagement = () => {
  const { loading, error, modules } = usePermissions();

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

  const rules = modules || [];

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
                  </tr>
                </thead>

                <tbody>
                  {rules.map((m, index) => (
                    <tr key={m.MODULE_CODE}>
                      <td>{index + 1}</td>
                      <td>{m.MODULE_CODE}</td>
                      <td>{m.CAN_VIEW ? "Yes" : "No"}</td>
                      <td>{m.CAN_CREATE ? "Yes" : "No"}</td>
                      <td>{m.CAN_EDIT ? "Yes" : "No"}</td>
                      <td>{m.CAN_DELETE ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleManagement;
