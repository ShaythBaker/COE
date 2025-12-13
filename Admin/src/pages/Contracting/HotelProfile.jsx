// src/pages/Contracting/HotelProfile.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  Badge,
  Button,
} from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import MapLocationPicker from "../../components/Common/MapLocationPicker";
import { getHotelById } from "/src/helpers/fakebackend_helper";
import { getAttachmentUrl } from "/src/helpers/attachments_helper";

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

const renderStatusBadge = (status) => {
  const isActive = status === 1 || status === "1";
  return (
    <Badge color={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

const HotelProfileInner = () => {
  document.title = "Hotel Profile | Travco - COE";

  const { hotelId } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // URLs resolved from attachments API
  const [logoUrl, setLogoUrl] = useState("");
  const [contractUrl, setContractUrl] = useState("");

  // 1) Load hotel basic data
  useEffect(() => {
    const fetchHotel = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await getHotelById(hotelId);
        setHotel(res);
      } catch (err) {
        console.error("Failed to load hotel", err);
        setLoadError("Failed to load hotel details.");
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchHotel();
    }
  }, [hotelId]);

  // After hotel is loaded:
  useEffect(() => {
    const loadFiles = async () => {
      try {
        if (hotel?.HOTEL_LOGO) {
          const url = await getAttachmentUrl(hotel.HOTEL_LOGO);
          setLogoUrl(url || "");
        } else {
          setLogoUrl("");
        }

        if (hotel?.HOTEL_CONTRACT) {
          const url = await getAttachmentUrl(hotel.HOTEL_CONTRACT);
          setContractUrl(url || "");
        } else {
          setContractUrl("");
        }
      } catch (err) {
        console.error("Failed to load attachment URLs", err);
      }
    };

    if (hotel) loadFiles();
  }, [hotel]);

  if (loading || (!hotel && !loadError)) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Hotel Profile" />
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading hotel details...
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Hotel Profile" />

        <Row className="mb-3">
          <Col>
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate("/contracting/hotels")}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Hotels
            </Button>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card>
              <CardBody>
                {loadError && (
                  <Alert color="danger" className="mb-3">
                    {loadError}
                  </Alert>
                )}

                {hotel && (
                  <>
                    {/* Header */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                      <div>
                        <h4 className="mb-1">{hotel.HOTEL_NAME}</h4>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {renderStars(hotel.HOTEL_STARS)}
                          {renderStatusBadge(hotel.ACTIVE_STATUS)}
                        </div>
                        <div className="text-muted">
                          {hotel.HOTEL_CHAIN && (
                            <>
                              Chain: <strong>{hotel.HOTEL_CHAIN}</strong>
                            </>
                          )}
                          {hotel.HOTEL_LOCATION && (
                            <>
                              {hotel.HOTEL_CHAIN ? " · " : ""}
                              Location: <strong>{hotel.HOTEL_LOCATION}</strong>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">General Info</h6>
                        <dl className="row mb-0">
                          <dt className="col-sm-4">Hotel ID</dt>
                          <dd className="col-sm-8">{hotel.HOTEL_ID}</dd>

                          <dt className="col-sm-4">Address</dt>
                          <dd className="col-sm-8">
                            {hotel.HOTEL_ADDRESS || "-"}
                          </dd>

                          <dt className="col-sm-4">Phone</dt>
                          <dd className="col-sm-8">
                            {hotel.HOTEL_PHONE || "-"}
                          </dd>

                          <dt className="col-sm-4">Reservation Email</dt>
                          <dd className="col-sm-8">
                            {hotel.HOTEL_RESERVATION_EMAIL || "-"}
                          </dd>

                          <dt className="col-sm-4">Contact Person</dt>
                          <dd className="col-sm-8">
                            {hotel.HOTEL_CONTACT_PERSON_NAME || "-"}
                          </dd>
                        </dl>
                      </Col>

                      <Col md={6}>
                        <h6 className="mb-3">System Info</h6>
                        <dl className="row mb-0">
                          <dt className="col-sm-4">Company ID</dt>
                          <dd className="col-sm-8">
                            {hotel.COMPANY_ID || "-"}
                          </dd>

                          <dt className="col-sm-4">Created By</dt>
                          <dd className="col-sm-8">
                            {hotel.CREATED_BY_USER || "-"}
                          </dd>

                          <dt className="col-sm-4">Contract Ref</dt>
                          <dd className="col-sm-8">
                            {hotel.HOTEL_CONTRACT || "-"}
                          </dd>
                        </dl>
                      </Col>
                    </Row>
                  </>
                )}
              </CardBody>
            </Card>
          </Col>

          {/* Right column: logo & contract */}
          <Col lg={4}>
            <Card className="mb-3">
              <CardBody className="text-center">
                <h6 className="mb-3">Hotel Logo</h6>
                {/* Logo */}
                {logoUrl ? (
                  <div className="mb-2 d-flex justify-content-center">
                    <img
                      src={logoUrl}
                      alt="Hotel Logo"
                      style={{
                        width: "160px",
                        height: "160px",
                        objectFit: "contain",
                        border: "1px solid #eee",
                        borderRadius: "6px",
                        padding: "4px",
                        background: "#fafafa",
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-muted mb-0">
                    No logo uploaded for this hotel.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h6 className="mb-3">Contract</h6>
                {/* Contract */}
                {contractUrl ? (
                  <div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bx bxs-file-pdf me-2" />
                      <div>
                        <div className="fw-semibold">Hotel Contract</div>
                        <small className="text-muted">
                          Attachment ID: {hotel?.HOTEL_CONTRACT}
                        </small>
                      </div>
                    </div>
                    <div
                      style={{
                        height: "260px",
                        border: "1px solid #eee",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        title="Hotel Contract PDF"
                        src={contractUrl}
                        width="100%"
                        height="100%"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted mb-0">No contract file attached.</p>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Map / location */}
        <Row className="mt-3">
          <Col lg={12}>
            <Card>
              <CardBody>
                <h6 className="mb-3">Location</h6>
                {hotel?.HOTEL_LAT && hotel?.HOTEL_LAN ? (
                  <>
                    <div className="mb-2 text-muted">
                      {hotel.HOTEL_LAT}, {hotel.HOTEL_LAN}
                    </div>
                    <MapLocationPicker
                      latitude={Number(hotel.HOTEL_LAT)}
                      longitude={Number(hotel.HOTEL_LAN)}
                    />
                  </>
                ) : (
                  <p className="text-muted mb-0">
                    No coordinates available for this hotel.
                  </p>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const HotelProfile = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <HotelProfileInner />
  </RequireModule>
);

export default HotelProfile;
