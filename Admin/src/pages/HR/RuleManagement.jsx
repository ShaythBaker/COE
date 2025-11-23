import React, { useEffect, useState } from "react";

const RuleManagement = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/access/roles/2/permissions`
        );

        if (!response.ok) {
          throw new Error("Failed to load rules");
        }

        const data = await response.json();

        setRules(data.data || data.rules || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  if (loading) {
    return <div>Loading rules...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Rule Management</h2>
      {rules.length === 0 ? (
        <p>No rules found.</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Module ID</th>
              <th>Can View</th>
              <th>Can Create</th>
              <th>Can Edit</th>
              <th>Can Delete</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id || rule.ruleId}>
                <td>{rule.id || rule.ruleId}</td>
                <td>{rule.name || rule.ruleName}</td>
                <td>{rule.code || rule.ruleCode}</td>
                <td>{rule.description || rule.ruleDescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RuleManagement;
