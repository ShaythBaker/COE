// src/pages/Contracting/RestaurantsList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Alert,
  Spinner,
  Badge,
  Button,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import TableContainer from "../../components/Common/TableContainer";

import {
  getRestaurants,
  clearRestaurantsMessages,
} from "/src/store/restaurants/actions";

import { getSystemListItems } from "/src/helpers/fakebackend_helper";

const EMPTY_STATE = {};
const restaurantsSelector = createSelector(
  (state) => state?.Restaurants || state?.restaurants || EMPTY_STATE,
  (s) => ({
    list: s?.list || [],
    loading: s?.loadingList || false,
    error: s?.error || null,
    successMessage: s?.successMessage || null,
  })
);

const RestaurantsListInner = () => {
  document.title = "Restaurants | Travco - COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, loading, error, successMessage } =
    useSelector(restaurantsSelector);

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);

  const [filters, setFilters] = useState({
    RESTUARANT_NAME: "",
    RESTUARANT_AREA_ID: "",
    ACTIVE_STATUS: "1",
  });

  useEffect(() => {
    dispatch(getRestaurants({ ACTIVE_STATUS: 1 }));
  }, [dispatch]);

  useEffect(() => {
    const loadAreas = async () => {
      setAreasLoading(true);
      setAreasError(null);
      try {
        const res = await getSystemListItems("AREAS");
        setAreas(res?.ITEMS || []);
      } catch (e) {
        setAreasError(
          e?.response?.data?.message || e?.message || "Failed to load areas"
        );
      } finally {
        setAreasLoading(false);
      }
    };
    loadAreas();
  }, []);

  useEffect(() => {
    if (successMessage) dispatch(clearRestaurantsMessages());
  }, [successMessage, dispatch]);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const areaLabel = (row) => {
    if (row?.RESTUARANT_AREA_NAME) return row.RESTUARANT_AREA_NAME;
    const id = row?.RESTUARANT_AREA_ID;
    if (!id) return "-";
    const found = areas.find((a) => String(a.LIST_ITEM_ID) === String(id));
    return found?.ITEM_NAME || `#${id}`;
  };

  const columns = useMemo(
    () => [
      {
        header: "Restaurant Name",
        accessorKey: "RESTUARANT_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Area",
        accessorKey: "RESTUARANT_AREA_ID",
        enableColumnFilter: false,
        cell: ({ row }) => areaLabel(row.original),
      },
      {
        header: "Stars",
        accessorKey: "RESTUARANT_STARS_RATE",
        enableColumnFilter: false,
        cell: (info) => info.getValue() ?? "-",
      },
      {
        header: "Status",
        accessorKey: "ACTIVE_STATUS",
        enableColumnFilter: false,
        cell: (info) => renderStatusBadge(info.getValue()),
      },
      {
        id: "actions",
        header: "Actions",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <Button
            color="link"
            size="sm"
            className="p-0"
            onClick={() =>
              navigate(`/contracting/restaurants/${row.original.RESTUARANT_ID}`)
            }
          >
            View Profile
          </Button>
        ),
      },
    ],
    [areas, navigate]
  );

  const onSearch = () => {
    dispatch(
      getRestaurants({
        RESTUARANT_NAME: filters.RESTUARANT_NAME?.trim() || "",
        RESTUARANT_AREA_ID: filters.RESTUARANT_AREA_ID || "",
        ACTIVE_STATUS:
          filters.ACTIVE_STATUS === "" ? "" : Number(filters.ACTIVE_STATUS),
      })
    );
  };

  const onReset = () => {
    const next = {
      RESTUARANT_NAME: "",
      RESTUARANT_AREA_ID: "",
      ACTIVE_STATUS: "1",
    };
    setFilters(next);
    dispatch(getRestaurants({ ACTIVE_STATUS: 1 }));
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Restaurants" />

        {error && <Alert color="danger">{error}</Alert>}

        <Card className="mb-3">
          <CardBody>
            <Row className="align-items-end">
              <Col md={4}>
                <FormGroup>
                  <Label>Restaurant Name</Label>
                  <Input
                    value={filters.RESTUARANT_NAME}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        RESTUARANT_NAME: e.target.value,
                      }))
                    }
                    placeholder="e.g. KFC"
                  />
                </FormGroup>
              </Col>

              <Col md={4}>
                <FormGroup>
                  <Label>Area</Label>
                  <Input
                    type="select"
                    value={filters.RESTUARANT_AREA_ID}
                    disabled={areasLoading}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        RESTUARANT_AREA_ID: e.target.value,
                      }))
                    }
                  >
                    <option value="">All areas</option>
                    {areas.map((a) => (
                      <option key={a.LIST_ITEM_ID} value={a.LIST_ITEM_ID}>
                        {a.ITEM_NAME}
                      </option>
                    ))}
                  </Input>
                  {areasError ? (
                    <small className="text-danger">{areasError}</small>
                  ) : null}
                </FormGroup>
              </Col>

              <Col md={2}>
                <FormGroup>
                  <Label>Status</Label>
                  <Input
                    type="select"
                    value={filters.ACTIVE_STATUS}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        ACTIVE_STATUS: e.target.value,
                      }))
                    }
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                    <option value="">All</option>
                  </Input>
                </FormGroup>
              </Col>

              <Col md={2} className="d-flex gap-2">
                <Button color="primary" onClick={onSearch}>
                  Search
                </Button>
                <Button color="light" onClick={onReset}>
                  Reset
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            {loading ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading restaurants...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={list || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClass="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search restaurants..."
                isAddButton={true}
                isCustomPageSize={true}
                disableFilters={true}
                handleUserClick={() =>
                  navigate("/contracting/restaurants/create")
                }
                buttonName="Add Restaurant"
              />
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

const RestaurantsList = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <RestaurantsListInner />
  </RequireModule>
);

export default RestaurantsList;
