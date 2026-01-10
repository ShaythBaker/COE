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
import { Link, useNavigate, useParams } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useDispatch, useSelector } from "react-redux";
import { getGuide, deleteGuide } from "../../store/guides/actions";

import { getAttachmentUrl } from "/src/helpers/attachments_helper";

// YYYY-MM-DD HH:MM:SS (local time) - copied style from ClientProfile
const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const MM = pad(d.getMinutes());
  const SS = pad(d.getSeconds());

  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
};

const renderStatusBadge = (status) => {
  const isActive = status === 1 || status === "1";
  return (
    <Badge color={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

const GuideDetailsInner = () => {
  document.title = "Guide Profile | Travco - COE";

  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current, loadingOne, deleting, errorMessage } = useSelector(
    (s) => s.Guides
  );

  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    dispatch(getGuide(id));
  }, [dispatch, id]);

  // Load image URL like ClientProfile
  useEffect(() => {
    const loadImage = async () => {
      try {
        if (current?.GUIDE_PROFILE_IMAGE) {
          const url = await getAttachmentUrl(current.GUIDE_PROFILE_IMAGE);
          setImageUrl(url || "");
        } else {
          setImageUrl("");
        }
      } catch (e) {
        console.error("Failed to load guide image", e);
        setImageUrl("");
      }
    };

    if (current) loadImage();
  }, [current]);

  useEffect(() => {
    if (errorMessage) toast.error(errorMessage);
  }, [errorMessage]);

  const onDelete = () => {
    const ok = window.confirm(
      `Delete "${current?.GUIDE_NAME}"?\nThis will deactivate the guide (soft delete).`
    );
    if (!ok) return;

    dispatch(
      deleteGuide(id, (err) => {
        if (err) {
          toast.error(`Couldn’t delete this guide. ${err}`);
          return;
        }
        toast.success("Guide deleted successfully. It’s now inactive.");
        navigate("/contracting/guides");
      })
    );
  };

  if (loadingOne || (!current && !errorMessage)) {
    return (
      <div className="page-content">
        <ToastContainer position="top-right" autoClose={3000} />
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Guide Profile" />
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading guide details...
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Guide Profile" />

        <Row className="mb-3">
          <Col className="d-flex align-items-center">
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate("/contracting/guides")}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Guides
            </Button>

            <Link
              to={`/contracting/guides/${id}/edit`}
              className="btn btn-primary btn-sm ms-2"
            >
              <i className="bx bx-edit-alt me-1" />
              Edit Guide
            </Link>

            <Button
              color="danger"
              size="sm"
              className="ms-2"
              onClick={onDelete}
              disabled={deleting || !current}
            >
              <i className="bx bx-trash me-1" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </Col>
        </Row>

        {errorMessage && (
          <Alert color="danger" className="mb-3">
            {errorMessage}
          </Alert>
        )}

        {!current ? (
          <Alert color="warning">Guide not found.</Alert>
        ) : (
          <Row>
            <Col lg={4}>
              <Card className="mb-3">
                <CardBody className="text-center">
                  {imageUrl ? (
                    <div className="avatar-xl mx-auto">
                      <div className="avatar-title rounded-circle bg-light">
                        <img
                          src={imageUrl}
                          alt="Guide"
                          className="rounded-circle img-fluid"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="avatar-xl mx-auto">
                      <div className="avatar-title rounded-circle bg-soft-secondary text-secondary">
                        <i className="bx bx-user font-size-24" />
                      </div>
                      <p className="text-muted mt-2 mb-0">No image uploaded</p>
                    </div>
                  )}

                  <br />
                  <h4 className="mb-1">{current.GUIDE_NAME || "-"}</h4>
                  <div className="text-muted">
                    {current.GUIDE_LANGUAGE_NAME || "—"}
                  </div>
                  <div className="mt-2">
                    {renderStatusBadge(current.GUIDE_ACTIVE_STATUS)}
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col lg={8}>
              <Card>
                <CardBody>
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">General Info</h6>
                      <dl className="row mb-0">
                        <dt className="col-sm-4">Daily Rate</dt>
                        <dd className="col-sm-8">
                          {current.GUIDE_DAILY_RATE ?? "-"}
                        </dd>

                        <dt className="col-sm-4">Phone</dt>
                        <dd className="col-sm-8">
                          {current.GUIDE_PHONE_NUMBER ?? "-"}
                        </dd>

                        <dt className="col-sm-4">Email</dt>
                        <dd className="col-sm-8">
                          {current.GUIDE_EMAIL ?? "-"}
                        </dd>
                      </dl>
                    </Col>

                    <Col md={6}>
                      <h6 className="mb-3">System Info</h6>
                      <dl className="row mb-0">
                        <dt className="col-sm-4">Created By</dt>
                        <dd className="col-sm-8">
                          {current.CREATED_BY_NAME || "-"}
                        </dd>

                        <dt className="col-sm-4">Creator Email</dt>
                        <dd className="col-sm-8">
                          {current.CREATED_BY_EMAIL || "-"}
                        </dd>

                        <dt className="col-sm-4">Creator Phone</dt>
                        <dd className="col-sm-8">
                          {current.CREATED_BY_PHONE || "-"}
                        </dd>

                        <dt className="col-sm-4">Created On</dt>
                        <dd className="col-sm-8">
                          {formatDateTime(current.CREATED_ON)}
                        </dd>

                        <dt className="col-sm-4">Updated On</dt>
                        <dd className="col-sm-8">
                          {formatDateTime(current.UPDATED_ON)}
                        </dd>
                      </dl>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

const GuideDetails = () => (
  <RequireModule module="CONTRACTING_USER">
    <GuideDetailsInner />
  </RequireModule>
);

export default GuideDetails;
