import React, { useEffect, useMemo } from "react";
import {
  Container,
  Card,
  CardBody,
  Alert,
  Spinner,
  Badge,
  Button,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import TableContainer from "../../components/Common/TableContainer";

import { getClients as getClientsApi } from "/src/helpers/fakebackend_helper";

// selector (local)
const clientsListSelector = createSelector(
  (state) => state.clients, // <-- IMPORTANT: your reducer key must be "clients"
  (clientsState) => ({
    clients: clientsState.clients,
    loadingClients: clientsState.loadingClients,
    clientsError: clientsState.clientsError,
  })
);

const ClientsListInner = () => {
  document.title = "Clients | Travco - COE";

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { clients, loadingClients, clientsError } =
    useSelector(clientsListSelector);

  // NOTE: Hotels list uses redux action getHotels(). If you don't yet have clients redux,
  // you can keep it simple like this list page calling helper directly via a small thunk,
  // OR (recommended) implement clients redux similar to hotels.
  // For fastest parity with hotels list UI, here's a small approach using a local fetch:

  useEffect(() => {
    let mounted = true;

    const fetchClients = async () => {
      try {
        dispatch({ type: "CLIENTS_LOADING" });
        const res = await getClientsApi(); // GET /api/clients
        if (!mounted) return;
        dispatch({ type: "CLIENTS_SUCCESS", payload: res || [] });
      } catch (err) {
        if (!mounted) return;
        dispatch({
          type: "CLIENTS_ERROR",
          payload:
            err?.response?.data?.message ||
            err.message ||
            "Failed to load clients",
        });
      }
    };

    fetchClients();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const handleViewProfile = (clientId) => {
    navigate(`/contracting/clients/${clientId}`);
  };

  const columns = useMemo(
    () => [
      {
        header: "Client Name",
        accessorKey: "CLIENT_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Email",
        accessorKey: "EMAIL",
        enableColumnFilter: false,
      },
      {
        header: "Phone",
        accessorKey: "PHONE",
        enableColumnFilter: false,
      },
      {
        header: "Contact Person",
        accessorKey: "CONTACT_PERSON_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Status",
        accessorKey: "ACTIVE_STATUS",
        enableColumnFilter: false,
        cell: (info) => renderStatusBadge(info.getValue()),
      },
      {
        header: "Actions",
        id: "actions",
        enableColumnFilter: false,
        cell: (info) => {
          const client = info.row.original;
          return (
            <Button
              color="link"
              size="sm"
              className="p-0"
              onClick={() => handleViewProfile(client.CLIENT_ID)}
            >
              View Profile
            </Button>
          );
        },
      },
    ],
    []
  );

  const handleAddClick = () => {
    navigate("/contracting/clients/create");
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Clients" />

        <Card>
          <CardBody>
            {clientsError && (
              <Alert color="danger" className="mb-3">
                {clientsError}
              </Alert>
            )}

            {loadingClients ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading clients...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={clients || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClass="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search clients..."
                isAddButton={true}
                isCustomPageSize={true}
                disableFilters={true}
                handleUserClick={handleAddClick}
                buttonName="Add Client"
              />
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

const ClientsList = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <ClientsListInner />
  </RequireModule>
);

export default ClientsList;
