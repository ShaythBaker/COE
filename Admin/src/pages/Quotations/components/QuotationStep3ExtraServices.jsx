import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
  Spinner,
  Table,
  Alert,
} from "reactstrap";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useDispatch, useSelector } from "react-redux";
import {
  clearStep3Messages,
  deleteQuotationExtraService,
  getExtraServices,
  getQuotationExtraServices,
  saveQuotationExtraService,
} from "../../../store/quotationStep3/actions";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
};

const QuotationStep3ExtraServices = ({ qoutationId, onChange }) => {
  const dispatch = useDispatch();

  const step3State = useSelector((state) => state.quotationStep3 || {});

  const {
    extraServices: extraServicesRaw,
    quotationExtraServices: quotationExtraServicesRaw,
    loadingExtraServices,
    loadingQuotationExtraServices,
    saving,
    deleting,
    error,
    successMessage,
  } = step3State;

  // ✅ normalize (supports: array OR {data: array} OR axios response)
  const extraServices = Array.isArray(extraServicesRaw)
    ? extraServicesRaw
    : Array.isArray(extraServicesRaw?.data)
      ? extraServicesRaw.data
      : Array.isArray(extraServicesRaw?.data?.data)
        ? extraServicesRaw.data.data
        : [];

  const quotationExtraServices = Array.isArray(quotationExtraServicesRaw)
    ? quotationExtraServicesRaw
    : Array.isArray(quotationExtraServicesRaw?.data)
      ? quotationExtraServicesRaw.data
      : Array.isArray(quotationExtraServicesRaw?.data?.data)
        ? quotationExtraServicesRaw.data.data
        : [];

  const [costEdits, setCostEdits] = useState({});
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descService, setDescService] = useState(null);

  const hoverCloseTimer = useRef(null);

  // ✅ Toast notifications (deduped) + clear redux messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, { toastId: "quotation-step3-success" });
      dispatch(clearStep3Messages());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error, { toastId: "quotation-step3-error" });
      dispatch(clearStep3Messages());
    }
  }, [error, dispatch]);

  // Fetch all services once
  useEffect(() => {
    dispatch(getExtraServices());
  }, [dispatch]);

  // Fetch already-added services for this quotation
  useEffect(() => {
    if (qoutationId) {
      dispatch(getQuotationExtraServices(qoutationId));
    }
  }, [dispatch, qoutationId]);

  useEffect(() => {
    if (successMessage && onChange) onChange();
  }, [successMessage, onChange]);

  const busy = loadingExtraServices || loadingQuotationExtraServices;

  const extraServicesMap = useMemo(() => {
    const m = new Map();
    (extraServices || []).forEach((x) => {
      m.set(Number(x.EXTRA_SERVICE_ID), x);
    });
    return m;
  }, [extraServices]);

  const selectedMap = useMemo(() => {
    const m = new Map();
    (quotationExtraServices || []).forEach((x) => {
      m.set(Number(x.EXTRA_SERVICE_ID), x);
    });
    return m;
  }, [quotationExtraServices]);

  // All services table rows (with Added badge and editable cost)
  const tableRows = useMemo(() => {
    return (extraServices || []).map((s) => {
      const id = Number(s.EXTRA_SERVICE_ID);
      const selected = selectedMap.get(id);

      const defaultCost =
        selected?.EXTRA_SERVICE_COST_PP ?? s.EXTRA_SERVICE_COST_PP ?? "";

      const edited =
        costEdits[id] !== undefined ? costEdits[id] : String(defaultCost);

      return {
        ...s,
        _id: id,
        _isSelected: !!selected,
        _selectedRow: selected || null,
        _costValue: edited,
      };
    });
  }, [extraServices, selectedMap, costEdits]);

  // Added services list rows (merge backend quotation list with master list to fill null name/desc)
  const addedRows = useMemo(() => {
    return (quotationExtraServices || []).map((q) => {
      const id = Number(q.EXTRA_SERVICE_ID);
      const master = extraServicesMap.get(id);

      const name =
        q.EXTRA_SERVICE_NAME ?? master?.EXTRA_SERVICE_NAME ?? `Service #${id}`;
      const desc =
        q.EXTRA_SERVICE_DESCRIPTION ??
        master?.EXTRA_SERVICE_DESCRIPTION ??
        null;

      const baseCost =
        q.EXTRA_SERVICE_COST_PP ?? master?.EXTRA_SERVICE_COST_PP ?? "";

      const edited =
        costEdits[id] !== undefined ? costEdits[id] : String(baseCost);

      return {
        ...q,
        EXTRA_SERVICE_NAME: name,
        EXTRA_SERVICE_DESCRIPTION: desc,
        EXTRA_SERVICE_COST_PP: baseCost,
        _id: id,
        _costValue: edited,
      };
    });
  }, [quotationExtraServices, extraServicesMap, costEdits]);

  const openDescription = (service) => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    setDescService(service);
    setDescModalOpen(true);
  };

  // kept as-is even if not used by hover anymore
  const closeDescriptionWithDelay = () => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => {
      setDescModalOpen(false);
      setDescService(null);
    }, 250);
  };

  const onEditCost = (id, value) => {
    setCostEdits((prev) => ({ ...prev, [id]: value }));
  };

  const refreshStep3 = () => {
    dispatch(clearStep3Messages());
    dispatch(getExtraServices());
    if (qoutationId) dispatch(getQuotationExtraServices(qoutationId));
  };

  const handleSave = (row) => {
    if (!qoutationId) return;

    dispatch(clearStep3Messages());

    const cost = toNumber(row._costValue);
    const payload = {
      EXTRA_SERVICE_ID: row._id,
      EXTRA_SERVICE_COST_PP: cost,
    };

    const existing = selectedMap.get(row._id);

    // Update strategy: delete existing row by QOUTATION_EXTRA_SERVICE_ID then add again
    if (existing?.QOUTATION_EXTRA_SERVICE_ID) {
      dispatch(
        deleteQuotationExtraService(
          existing.QOUTATION_EXTRA_SERVICE_ID,
          row._id // EXTRA_SERVICE_ID (for UI fallback)
        )
      );
    }

    dispatch(saveQuotationExtraService(qoutationId, payload));
  };

  const handleRemove = (extraServiceId) => {
    dispatch(clearStep3Messages());

    const existing = selectedMap.get(Number(extraServiceId));
    if (!existing?.QOUTATION_EXTRA_SERVICE_ID) return;

    dispatch(
      deleteQuotationExtraService(
        existing.QOUTATION_EXTRA_SERVICE_ID,
        extraServiceId
      )
    );
  };

  return (
    <Card>
      <CardBody>
        <Row className="align-items-center mb-3">
          <Col>
            <h5 className="mb-0">Extra Services</h5>
          </Col>
          <Col className="text-end">
            <Button
              color="light"
              size="sm"
              onClick={refreshStep3}
              disabled={busy || saving || deleting}
            >
              <i className="bx bx-refresh me-1" />
              Refresh
            </Button>
          </Col>
        </Row>

        {busy ? (
          <div className="text-center my-4">
            <Spinner size="sm" className="me-2" />
            Loading extra services...
          </div>
        ) : (
          <>
            {/* ALL SERVICES TABLE */}
            <div className="table-responsive">
              <Table className="table align-middle table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "45%" }}>Available Service Name</th>
                    <th style={{ width: "25%" }}>Cost PP</th>
                    <th style={{ width: "30%" }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        No extra services found.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <span
                              className="fw-semibold text-primary"
                              style={{ cursor: "default" }}
                            >
                              {row.EXTRA_SERVICE_NAME}
                            </span>

                            {/* ✅ INFO ICON (click to open modal) */}
                            <Button
                              color="link"
                              className="p-0 ms-2"
                              style={{ lineHeight: 1 }}
                              onClick={() => openDescription(row)}
                              title="View description"
                              type="button"
                            >
                              <i className="bx bx-info-circle" />
                            </Button>

                            {row._isSelected ? (
                              <Badge color="success" pill className="ms-2">
                                Added
                              </Badge>
                            ) : (
                              <Badge color="light" pill className="ms-2">
                                Not added into this quotation
                              </Badge>
                            )}
                          </div>

                          <small className="text-muted">
                            ID: {row.EXTRA_SERVICE_ID}
                          </small>
                        </td>

                        <td>
                          <small className="text-muted">
                            Default:{" "}
                            {formatMoney(row.EXTRA_SERVICE_COST_PP || 0)}
                          </small>
                        </td>

                        <td className="text-end">
                          <Button
                            color="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleSave(row)}
                            disabled={saving || deleting || !qoutationId}
                            title={!qoutationId ? "Missing quotation id" : ""}
                          >
                            {saving ? (
                              <>
                                <Spinner size="sm" className="me-1" />
                                Adding
                              </>
                            ) : (
                              <>
                                <i className="bx bx-save me-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* ADDED SERVICES SECTION */}
            <div className="mt-4">
              <h6 className="mb-2">Added Services for this Quotation</h6>

              {addedRows.length === 0 ? (
                <Alert color="secondary" className="mb-0">
                  No extra services added yet. Add services from the table
                  above.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table className="table align-middle table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "50%" }}>Added Service Name</th>
                        <th style={{ width: "25%" }}>Cost PP</th>
                        <th style={{ width: "25%" }} className="text-end">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {addedRows.map((row) => (
                        <tr key={`added-${row._id}`}>
                          <td>
                            <span
                              className="fw-semibold text-primary"
                              style={{ cursor: "default" }}
                            >
                              {row.EXTRA_SERVICE_NAME}
                            </span>
                            <div className="text-muted">
                              {/* <small>ID: {row.EXTRA_SERVICE_ID}</small> */}
                            </div>
                          </td>

                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row._costValue}
                              onChange={(e) =>
                                onEditCost(row._id, e.target.value)
                              }
                              disabled={saving || deleting}
                              placeholder="0.00"
                            />
                          </td>

                          <td className="text-end">
                            <Button
                              color="primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleSave(row)}
                              disabled={saving || deleting || !qoutationId}
                            >
                              <i className="bx bx-save me-1" />
                              Update
                            </Button>

                            <Button
                              color="danger"
                              size="sm"
                              onClick={() => handleRemove(row.EXTRA_SERVICE_ID)}
                              disabled={saving || deleting}
                            >
                              <i className="bx bx-trash me-1" />
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Description modal */}
        <Modal
          isOpen={descModalOpen}
          toggle={() => setDescModalOpen((v) => !v)}
          centered
        >
          <ModalHeader toggle={() => setDescModalOpen(false)}>
            {descService?.EXTRA_SERVICE_NAME || "Service Description"}
          </ModalHeader>
          <ModalBody>
            <small>The below description will be showen on the propsal file:</small>
            <br />
            <br />
            <p className="mb-2">
              {descService?.EXTRA_SERVICE_DESCRIPTION ? (
                descService.EXTRA_SERVICE_DESCRIPTION
              ) : (
                <span className="text-muted">No description provided.</span>
              )}
            </p>
            <div className="text-muted"></div>
          </ModalBody>
        </Modal>
      </CardBody>
    </Card>
  );
};

export default QuotationStep3ExtraServices;
