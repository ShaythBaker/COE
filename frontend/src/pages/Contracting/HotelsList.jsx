// src/pages/Contracting/HotelsList.jsx
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

import { getHotels } from "/src/store/hotels/actions";

// Selector for hotels slice
const hotelsListSelector = createSelector(
  (state) => state.hotels,
  (hotelsState) => ({
    hotels: hotelsState.hotels,
    loadingHotels: hotelsState.loadingHotels,
    hotelsError: hotelsState.hotelsError,
  })
);

const HotelsListInner = () => {
  document.title = "Hotels | Travco - COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels, loadingHotels, hotelsError } =
    useSelector(hotelsListSelector);

  const renderStars = (stars) => {
    const count = parseInt(stars, 10) || 0;
    return (
      <span>
        {Array.from({ length: count }).map((_, i) => (
          <i key={i} className="bx bxs-star text-warning" />
        ))}
      </span>
    );
  };

  const handleViewProfile = (hotelId) => {
    navigate(`/contracting/hotels/${hotelId}`);
  };

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  // Load all hotels once
  useEffect(() => {
    dispatch(
      getHotels({
        ACTIVE_STATUS: "",
      })
    );
  }, [dispatch]);

  const columns = useMemo(
    () => [
      {
        header: "Hotel Name",
        accessorKey: "HOTEL_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Area",
        accessorKey: "HOTEL_LOCATION",
        enableColumnFilter: false,
      },
      {
        header: "Chain",
        accessorKey: "HOTEL_CHAIN",
        enableColumnFilter: false,
      },
      {
        header: "Stars",
        accessorKey: "HOTEL_STARS",
        enableColumnFilter: false,
        cell: (info) => renderStars(info.getValue()),
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
          const hotel = info.row.original;
          return (
            <Button
              color="link"
              size="sm"
              className="p-0"
              onClick={() => handleViewProfile(hotel.HOTEL_ID)}
            >
              View Profile
            </Button>
          );
        },
      },
    ],
    []
  );

  // ✅ This is what the Add button will call
  const handleAddClick = () => {
    navigate("/contracting/hotels/create");
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Hotels" />

        <Card>
          <CardBody>
            {hotelsError && (
              <Alert color="danger" className="mb-3">
                {hotelsError}
              </Alert>
            )}

            {loadingHotels ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading hotels...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={hotels || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClass="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search hotels..."
                isAddButton={true}
                isCustomPageSize={true}
                disableFilters={true}
                // 🔴 this was the problem before: TableContainer uses handleUserClick, not onAddClick
                handleUserClick={handleAddClick}
                buttonName="Add Hotel"
              />
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

const HotelsList = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <HotelsListInner />
  </RequireModule>
);

export default HotelsList;
