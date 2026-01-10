import React, { useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Badge,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import { getHotelContracts, clearHotelSeasonMessages } from "../../store/hotels/actions";

const toYMD = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
};

const isActiveToday = (start, end) => {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
  return now >= s && now <= e;
};

const HotelContractDetails = () => {
  document.title = "Hotel Contract Details | COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotelId, contractId } = useParams();

  const { hotelContracts, loadingHotelContracts, hotelContractsError } =
    useSelector((state) => state.hotels);

  useEffect(() => {
    dispatch(getHotelContracts(hotelId));
    return () => dispatch(clearHotelSeasonMessages());
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (hotelContractsError) toast.error(hotelContractsError);
  }, [hotelContractsError]);

  const contract = useMemo(() => {
    const list = hotelContracts || [];
    return (
      list.find((c) => String(c.HOTEL_CONTRACT_ID) === String(contractId)) ||
      null
    );
  }, [hotelContracts, contractId]);

  const active = contract
    ? contract.IS_ACTIVE === 1 ||
      isActiveToday(
        contract.HOTEL_CONTRACT_START_DATE,
        contract.HOTEL_CONTRACT_END_DATE
      )
    : false;

  return (
    <RequireModule moduleName="HOTELS">
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Hotels" breadcrumbItem="Contract Details" />

          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-2">
                <Button color="light" onClick={() => navigate(-1)}>
                  <i className="bx bx-arrow-back me-1" />
                  Back
                </Button>

                <Button
                  color="primary"
                  onClick={() => navigate(`/contracting/hotels/${hotelId}/seasons`)}
                >
                  <i className="bx bx-calendar me-1" />
                  Manage Seasons
                </Button>

                <Button
                  color="success"
                  onClick={() =>
                    navigate(`/contracting/hotels/${hotelId}/seasons-with-rates`)
                  }
                >
                  <i className="bx bx-money me-1" />
                  Seasons Pricing
                </Button>
              </div>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  {loadingHotelContracts ? (
                    <div className="text-center my-4">
                      <Spinner size="sm" className="me-2" />
                      Loading contract...
                    </div>
                  ) : !contract ? (
                    <div className="text-center text-muted py-4">
                      Contract not found.
                    </div>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1">
                            Contract #{contract.HOTEL_CONTRACT_ID}
                          </h5>
                          <div className="text-muted">
                            {toYMD(contract.HOTEL_CONTRACT_START_DATE)} —{" "}
                            {toYMD(contract.HOTEL_CONTRACT_END_DATE)}
                          </div>
                        </div>

                        <div>
                          {active ? (
                            <Badge color="success">Active</Badge>
                          ) : (
                            <Badge color="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>

                      <hr />

                      <Row>
                        <Col md={4}>
                          <div className="text-muted">Start Date</div>
                          <div>{toYMD(contract.HOTEL_CONTRACT_START_DATE)}</div>
                        </Col>
                        <Col md={4}>
                          <div className="text-muted">End Date</div>
                          <div>{toYMD(contract.HOTEL_CONTRACT_END_DATE)}</div>
                        </Col>
                        <Col md={4}>
                          <div className="text-muted">Attachment ID</div>
                          <div>{contract.HOTEL_CONTRACT_ATTACHMENT_ID || "-"}</div>
                        </Col>
                      </Row>

                      <div className="alert alert-info mt-4 mb-0">
                        <strong>Important:</strong> Rates are no longer managed
                        at the contract level. Rates are now stored{" "}
                        <strong>inside Seasons</strong> (Season → multiple Rates),
                        and they automatically become unavailable when the season expires.
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </RequireModule>
  );
};

export default HotelContractDetails;
