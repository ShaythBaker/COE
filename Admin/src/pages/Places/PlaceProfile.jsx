import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Badge,
} from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { useDispatch, useSelector } from "react-redux";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";

import {
  getPlaceById,
  updatePlace,
  deletePlace,
  getSystemListItems,
} from "/src/helpers/fakebackend_helper";

import {
  getAttachmentUrl,
  uploadAttachment,
} from "/src/helpers/attachments_helper";

import Dropzone from "react-dropzone";

import {
  Carousel,
  CarouselItem,
  CarouselControl,
  CarouselIndicators,
} from "reactstrap";

import {
  getPlaceEntranceFees,
  createPlaceEntranceFees,
  updatePlaceEntranceFee,
  deletePlaceEntranceFee,
  clearPlaceEntranceFeesMessages,
} from "/src/store/PlaceEntranceFees/actions";

const getCurrentUserId = () => {
  try {
    const raw =
      sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed.USER_ID || parsed.user_id || parsed.id || "";
  } catch {
    return "";
  }
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const AttachmentCarousel = ({ attachmentIds = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!attachmentIds?.length) {
          if (mounted) setUrls([]);
          return;
        }
        const res = await Promise.all(
          attachmentIds.map(async (id) => {
            try {
              const u = await getAttachmentUrl(id);
              return u || "";
            } catch {
              return "";
            }
          })
        );
        if (mounted) setUrls(res.filter(Boolean));
      } catch {
        if (mounted) setUrls([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [attachmentIds]);

  const slides = urls.map((u, idx) => ({ src: u, key: idx }));

  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };
  const prev = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };
  const goToIndex = (newIndex) => {
    if (animating) return;
    setActiveIndex(newIndex);
  };

  if (!attachmentIds?.length)
    return <div className="text-muted">No images.</div>;
  if (!slides.length)
    return (
      <div className="text-center">
        <Spinner size="sm" className="me-2" />
        Loading images...
      </div>
    );

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <Carousel
        activeIndex={activeIndex}
        next={next}
        previous={prev}
        ride={false}
      >
        <CarouselIndicators
          items={slides}
          activeIndex={activeIndex}
          onClickHandler={goToIndex}
        />
        {slides.map((item) => (
          <CarouselItem
            onExiting={() => setAnimating(true)}
            onExited={() => setAnimating(false)}
            key={item.key}
          >
            <div className="text-center">
              <img
                src={item.src}
                alt={`Place image ${item.key + 1}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: 480,
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            </div>
          </CarouselItem>
        ))}
        {slides.length > 1 && (
          <>
            <CarouselControl
              direction="prev"
              directionText="Previous"
              onClickHandler={prev}
            />
            <CarouselControl
              direction="next"
              directionText="Next"
              onClickHandler={next}
            />
          </>
        )}
      </Carousel>
      <div className="text-muted text-center mt-2">
        {activeIndex + 1} / {slides.length}
      </div>
    </div>
  );
};

const PlaceProfileInner = () => {
  document.title = "Place Details | Travco - COE";

  const { placeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUserId = getCurrentUserId();

  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);

  // ✅ COUNTRIES list for entrance fees checkboxes/select
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [imagesTouched, setImagesTouched] = useState(false);

  // ✅ Dropzone state for EDIT modal (images)
  const [editFiles, setEditFiles] = useState([]);
  const [editUploadingCount, setEditUploadingCount] = useState(0);

  // ✅ Entrance Fees UI state
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [isEditFeeOpen, setIsEditFeeOpen] = useState(false);
  const [isDeleteFeeOpen, setIsDeleteFeeOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const {
    list: feesList,
    loadingList: feesLoading,
    saving: feesSaving,
    deleting: feesDeleting,
    successMessage: feesSuccessMessage,
    error: feesError,
  } = useSelector((state) => state.PlaceEntranceFees || {});

  const toggleEdit = () => setIsEditOpen((v) => !v);
  const toggleDelete = () => setIsDeleteOpen((v) => !v);

  const toggleAddFee = () => setIsAddFeeOpen((v) => !v);
  const toggleEditFee = () => setIsEditFeeOpen((v) => !v);
  const toggleDeleteFee = () => setIsDeleteFeeOpen((v) => !v);

  const areaLabel = useMemo(() => {
    if (!place) return "-";
    const id = place.PLACE_AREA_ID;
    if (id === null || id === undefined || id === "") return "-";
    const found = areas?.find((a) => Number(a.LIST_ITEM_ID) === Number(id));
    return found?.ITEM_NAME || `#${id}`;
  }, [place, areas]);

  const countryNameById = useMemo(() => {
    const map = new Map();
    (countries || []).forEach((c) => {
      map.set(Number(c.LIST_ITEM_ID), c.ITEM_NAME);
    });
    return (id) => map.get(Number(id)) || `#${id}`;
  }, [countries]);

  const fetchPlace = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getPlaceById(placeId);
      setPlace(res);
    } catch (e) {
      setLoadError(
        e?.response?.data?.message || e?.message || "Failed to load place"
      );
      setPlace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (placeId) fetchPlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  // Load AREAS list once
  useEffect(() => {
    let mounted = true;
    const loadAreas = async () => {
      setAreasLoading(true);
      try {
        const res = await getSystemListItems("AREAS");
        if (!mounted) return;
        setAreas(res?.ITEMS || []);
      } catch (e) {
        toast.error(
          e?.response?.data?.message || e?.message || "Failed to load areas"
        );
      } finally {
        if (mounted) setAreasLoading(false);
      }
    };
    loadAreas();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Load COUNTRIES list once
  useEffect(() => {
    let mounted = true;
    const loadCountries = async () => {
      setCountriesLoading(true);
      try {
        const res = await getSystemListItems("COUNTRIES");
        if (!mounted) return;
        setCountries(res?.ITEMS || []);
      } catch (e) {
        toast.error(
          e?.response?.data?.message || e?.message || "Failed to load countries"
        );
      } finally {
        if (mounted) setCountriesLoading(false);
      }
    };
    loadCountries();
    return () => {
      mounted = false;
    };
  }, []);

  // Put these states near your other useState hooks in PlaceProfileInner:
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [countriesErr, setCountriesErr] = useState("");

  // helper toggle
  const toggleCountry = (id) => {
    setSelectedCountries((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      return next;
    });
    setCountriesErr("");
  };

  // ✅ Load entrance fees for this place (redux)
  useEffect(() => {
    if (placeId) dispatch(getPlaceEntranceFees(placeId));
  }, [placeId, dispatch]);

  // ✅ Fees toast handling like Clients module
  useEffect(() => {
    if (feesError) {
      toast.error(feesError);
      dispatch(clearPlaceEntranceFeesMessages());
    }
  }, [feesError, dispatch]);

  useEffect(() => {
    if (feesSuccessMessage) {
      toast.success(feesSuccessMessage);
      dispatch(clearPlaceEntranceFeesMessages());
    }
  }, [feesSuccessMessage, dispatch]);

  const schema = Yup.object().shape({
    PLACE_NAME: Yup.string().required("Place name is required"),
  });

  const attachmentIds = useMemo(
    () => (place?.IMAGES || []).map((x) => x.PLACE_IMAGE_ATTACHMENT_ID),
    [place]
  );

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      const res = await deletePlace(placeId);
      toast.success(res?.message || "Place deleted");
      navigate("/contracting/places");
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to delete place"
      );
    } finally {
      setSaving(false);
      setIsDeleteOpen(false);
    }
  };

  const buildInitialValues = () => ({
    PLACE_NAME: place?.PLACE_NAME || "",
    PLACE_AREA_ID: place?.PLACE_AREA_ID ? String(place.PLACE_AREA_ID) : "",
    PLACE_DESCRIPTION: place?.PLACE_DESCRIPTION || "",
  });

  // ✅ Initialize EDIT dropzone files from existing images when modal opens
  useEffect(() => {
    let mounted = true;

    const initExisting = async () => {
      if (!isEditOpen) return;

      setImagesTouched(false);
      setEditUploadingCount(0);

      const existingIds = (place?.IMAGES || []).map(
        (x) => x.PLACE_IMAGE_ATTACHMENT_ID
      );

      const base = existingIds.map((id) => ({
        uid: `existing-${id}`,
        kind: "existing",
        FILE_ID: id,
        name: `Attachment #${id}`,
        formattedSize: "-",
        preview: "",
        uploading: false,
        error: null,
      }));

      setEditFiles(base);

      try {
        const urls = await Promise.all(
          existingIds.map(async (id) => {
            try {
              return await getAttachmentUrl(id);
            } catch {
              return "";
            }
          })
        );
        if (!mounted) return;

        setEditFiles((prev) =>
          prev.map((f) => {
            if (f.kind !== "existing") return f;
            const id = f.FILE_ID;
            const idx = existingIds.findIndex((x) => Number(x) === Number(id));
            return { ...f, preview: urls[idx] || "" };
          })
        );
      } catch {
        // ignore
      }
    };

    initExisting();

    return () => {
      mounted = false;
    };
  }, [isEditOpen, place]);

  // cleanup object URLs for newly added files when modal closes/unmounts
  useEffect(() => {
    if (isEditOpen) return;

    editFiles.forEach((f) => {
      if (f.kind === "new" && f.preview) {
        try {
          URL.revokeObjectURL(f.preview);
        } catch {
          // ignore
        }
      }
    });

    setEditFiles([]);
    setEditUploadingCount(0);
    setImagesTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditOpen]);

  const updateEditFile = (uid, patch) => {
    setEditFiles((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, ...patch } : f))
    );
  };

  const removeEditFile = (uid) => {
    setImagesTouched(true);
    setEditFiles((prev) => {
      const target = prev.find((x) => x.uid === uid);
      if (target?.kind === "new" && target?.preview) {
        try {
          URL.revokeObjectURL(target.preview);
        } catch {
          // ignore
        }
      }
      return prev.filter((x) => x.uid !== uid);
    });
  };

  // Dropzone handler for EDIT modal (uploads using S3 flow)
  const handleEditDrop = async (acceptedFiles) => {
    if (!acceptedFiles?.length) return;

    setImagesTouched(true);

    const newItems = acceptedFiles.map((file) => {
      const uid = `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return {
        uid,
        kind: "new",
        file,
        FILE_ID: null,
        name: file.name,
        formattedSize: formatBytes(file.size),
        preview: URL.createObjectURL(file),
        uploading: true,
        error: null,
      };
    });

    setEditFiles((prev) => [...prev, ...newItems]);
    setEditUploadingCount((c) => c + newItems.length);

    for (const item of newItems) {
      try {
        const formData = new FormData();
        formData.append("USER_ID", String(currentUserId || ""));
        formData.append("FILE_CATEGORY", "PLACE_IMAGES");
        formData.append("FILE_NAME", item.file.name);
        formData.append("file", item.file);

        const res = await uploadAttachment(formData);

        updateEditFile(item.uid, {
          uploading: false,
          FILE_ID: res?.FILE_ID || null,
          error: null,
        });

        if (!res?.FILE_ID) {
          updateEditFile(item.uid, {
            error: "Upload finished but FILE_ID is missing",
          });
          toast.error("Image uploaded but FILE_ID missing from response.");
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Upload failed";
        updateEditFile(item.uid, {
          uploading: false,
          error: msg,
          FILE_ID: null,
        });
        toast.error(`${item.name}: ${msg}`);
      } finally {
        setEditUploadingCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const handleUpdate = async (values) => {
    setSaving(true);
    try {
      const payload = {
        PLACE_NAME: values.PLACE_NAME,
        PLACE_AREA_ID: values.PLACE_AREA_ID
          ? Number(values.PLACE_AREA_ID)
          : null,
        PLACE_DESCRIPTION: values.PLACE_DESCRIPTION || null,
      };

      if (imagesTouched) {
        payload.IMAGES = (editFiles || [])
          .filter((x) => x?.FILE_ID)
          .map((x) => ({ PLACE_IMAGE_ATTACHMENT_ID: x.FILE_ID }));
      }

      const res = await updatePlace(placeId, payload);
      toast.success(res?.message || "Place updated");
      setIsEditOpen(false);
      setImagesTouched(false);
      await fetchPlace();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to update place"
      );
    } finally {
      setSaving(false);
    }
  };

  const editSaveDisabled = saving || editUploadingCount > 0;

  const editAttachmentIds = useMemo(
    () => (editFiles || []).filter((x) => x?.FILE_ID).map((x) => x.FILE_ID),
    [editFiles]
  );

  // =========================
  // Entrance Fees CRUD handlers
  // =========================
  const openEditFee = (fee) => {
    setSelectedFee(fee);
    setIsEditFeeOpen(true);
  };

  const openDeleteFee = (fee) => {
    setSelectedFee(fee);
    setIsDeleteFeeOpen(true);
  };

  const confirmDeleteFee = () => {
    if (!selectedFee) return;
    dispatch(
      deletePlaceEntranceFee(placeId, selectedFee.PLACE_ENTRANCE_FEE_ID)
    );
    setIsDeleteFeeOpen(false);
    setSelectedFee(null);
  };

  const addFeeSchema = Yup.object().shape({
    PLACE_ENTRANCE_FEE_AMOUNT: Yup.number()
      .typeError("Amount must be a number")
      .required("Fee amount is required"),
    SELECTED_COUNTRIES: Yup.array()
      .of(Yup.number())
      .min(1, "Select at least one country")
      .required("Select at least one country"),
  });

  const editFeeSchema = Yup.object().shape({
    PLACE_ENTRANCE_FEE_AMOUNT: Yup.number()
      .typeError("Amount must be a number")
      .required("Fee amount is required"),
    PLACE_ENTRANCE_FEE_COUNTRY_ID: Yup.number()
      .typeError("Country is required")
      .required("Country is required"),
  });

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Place Details" />
        <ToastContainer closeButton={false} />

        {loadError && <Alert color="danger">{loadError}</Alert>}

        {loading ? (
          <div className="text-center my-4">
            <Spinner size="sm" className="me-2" />
            Loading place...
          </div>
        ) : place ? (
          <>
            <Row className="mb-3">
              <Col className="d-flex justify-content-end gap-2">
                <Button
                  color="light"
                  onClick={() => navigate("/contracting/places")}
                >
                  Back
                </Button>
                <Button color="primary" onClick={() => setIsEditOpen(true)}>
                  Edit
                </Button>
                <Button
                  color="danger"
                  outline
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Delete
                </Button>
              </Col>
            </Row>

            <Row>
              <Col lg="5">
                <Card>
                  <CardBody>
                    <h5 className="mb-3">{place.PLACE_NAME}</h5>

                    <div className="mb-2">
                      <Badge color="info" className="me-2">
                        Area
                      </Badge>
                      {areasLoading ? "Loading..." : areaLabel}
                    </div>

                    <div className="mb-2">
                      <Badge color="secondary" className="me-2">
                        Created
                      </Badge>
                      {formatDateTime(place.CREATED_ON)}
                    </div>

                    <div className="mb-2">
                      <Badge color="secondary" className="me-2">
                        Updated
                      </Badge>
                      {place.UPDATED_ON
                        ? formatDateTime(place.UPDATED_ON)
                        : "-"}
                    </div>

                    <hr />

                    <div>
                      <h6>Description</h6>
                      <div className="text-muted">
                        {place.PLACE_DESCRIPTION || "-"}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              <Col lg="7">
                <Card>
                  <CardBody>
                    <h6 className="mb-3">Images</h6>
                    <AttachmentCarousel attachmentIds={attachmentIds} />
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* ✅ Entrance Fees Card */}
            <Row className="mt-3">
              <Col lg="12">
                <Card>
                  <CardBody>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="mb-0">Entrance Fees</h6>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => setIsAddFeeOpen(true)}
                        disabled={countriesLoading}
                      >
                        + Add Fees
                      </Button>
                    </div>

                    {feesLoading ? (
                      <div className="text-center my-3">
                        <Spinner size="sm" className="me-2" />
                        Loading fees...
                      </div>
                    ) : (feesList || []).length ? (
                      <div className="table-responsive">
                        <table className="table align-middle table-nowrap mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: 90 }}>ID</th>
                              <th>Country</th>
                              <th style={{ width: 140 }}>Amount</th>
                              <th style={{ width: 200 }}>Created</th>
                              <th style={{ width: 140 }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(feesList || []).map((fee) => (
                              <tr key={fee.PLACE_ENTRANCE_FEE_ID}>
                                <td>{fee.PLACE_ENTRANCE_FEE_ID}</td>
                                <td>
                                  {countryNameById(
                                    fee.PLACE_ENTRANCE_FEE_COUNTRY_ID
                                  )}
                                </td>
                                <td>{fee.PLACE_ENTRANCE_FEE_AMOUNT}</td>
                                <td>{formatDateTime(fee.CREATED_ON)}</td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Button
                                      color="link"
                                      className="p-0"
                                      size="sm"
                                      onClick={() => openEditFee(fee)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      color="link"
                                      className="p-0 text-danger"
                                      size="sm"
                                      onClick={() => openDeleteFee(fee)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted">No entrance fees yet.</div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Edit Place Modal (images dropzone) */}
            <Modal isOpen={isEditOpen} toggle={toggleEdit} centered size="lg">
              <ModalHeader toggle={toggleEdit}>Edit Place</ModalHeader>

              <Formik
                enableReinitialize
                initialValues={buildInitialValues()}
                validationSchema={schema}
                onSubmit={handleUpdate}
              >
                {({ values, handleChange, handleBlur, touched, errors }) => (
                  <Form>
                    <ModalBody>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label>Place Name *</Label>
                            <Input
                              name="PLACE_NAME"
                              value={values.PLACE_NAME}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={
                                !!(touched.PLACE_NAME && errors.PLACE_NAME)
                              }
                            />
                            {touched.PLACE_NAME && errors.PLACE_NAME ? (
                              <FormFeedback>{errors.PLACE_NAME}</FormFeedback>
                            ) : null}
                          </FormGroup>
                        </Col>

                        <Col md="6">
                          <FormGroup>
                            <Label>Area</Label>
                            <Input
                              type="select"
                              name="PLACE_AREA_ID"
                              value={values.PLACE_AREA_ID}
                              onChange={handleChange}
                              disabled={areasLoading}
                            >
                              <option value="">Select area</option>
                              {areas.map((a) => (
                                <option
                                  key={a.LIST_ITEM_ID}
                                  value={a.LIST_ITEM_ID}
                                >
                                  {a.ITEM_NAME}
                                </option>
                              ))}
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      <FormGroup>
                        <Label>Description</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          name="PLACE_DESCRIPTION"
                          value={values.PLACE_DESCRIPTION}
                          onChange={handleChange}
                        />
                      </FormGroup>

                      <hr />

                      <FormGroup>
                        <Label className="d-block">Images</Label>

                        <Dropzone
                          accept={{ "image/*": [] }}
                          onDrop={(acceptedFiles) =>
                            handleEditDrop(acceptedFiles)
                          }
                        >
                          {({ getRootProps, getInputProps }) => (
                            <div className="dropzone">
                              <div
                                className="dz-message needsclick mt-2"
                                {...getRootProps()}
                                style={{
                                  border: "2px dashed #ced4da",
                                  borderRadius: 8,
                                  padding: "22px 16px",
                                  cursor: "pointer",
                                  background: "#fafafa",
                                }}
                              >
                                <input {...getInputProps()} />
                                <div className="mb-2 text-center">
                                  <i className="display-4 text-muted bx bxs-cloud-upload" />
                                </div>
                                <h5 className="text-center mb-0">
                                  Drop images here or click to upload
                                </h5>
                                <div className="text-muted text-center mt-1">
                                  Uploads to S3 (attachments module)
                                </div>

                                {editUploadingCount > 0 ? (
                                  <div className="text-center mt-3">
                                    <Spinner size="sm" className="me-2" />
                                    Uploading {editUploadingCount} file(s)...
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </Dropzone>

                        <div
                          className="dropzone-previews mt-3"
                          id="edit-file-previews"
                        >
                          {editFiles.map((f) => (
                            <Card
                              className="mt-1 mb-0 shadow-none border"
                              key={f.uid}
                            >
                              <div className="p-2">
                                <Row className="align-items-center">
                                  <Col className="col-auto">
                                    <img
                                      height="80"
                                      className="avatar-sm rounded bg-light"
                                      alt={f.name}
                                      src={f.preview || ""}
                                      style={{ objectFit: "cover" }}
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </Col>

                                  <Col>
                                    <div className="text-muted fw-bold">
                                      {f.name}
                                    </div>
                                    <p className="mb-0">
                                      <strong>{f.formattedSize}</strong>
                                    </p>

                                    {f.uploading ? (
                                      <small className="text-muted">
                                        <Spinner size="sm" className="me-1" />
                                        Uploading...
                                      </small>
                                    ) : f.error ? (
                                      <small className="text-danger">
                                        {f.error}
                                      </small>
                                    ) : f.FILE_ID ? (
                                      <small className="text-success">
                                        Ready (FILE_ID: {f.FILE_ID})
                                      </small>
                                    ) : null}
                                  </Col>

                                  <Col className="col-auto">
                                    <Button
                                      type="button"
                                      size="sm"
                                      color="danger"
                                      outline
                                      onClick={() => removeEditFile(f.uid)}
                                      disabled={f.uploading}
                                    >
                                      Remove
                                    </Button>
                                  </Col>
                                </Row>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="mt-3">
                          <AttachmentCarousel
                            attachmentIds={editAttachmentIds}
                          />
                        </div>

                        <small className="text-muted d-block mt-2">
                          If you change images, the backend will replace the
                          full set for this place. If you don’t touch images,
                          they remain unchanged.
                        </small>
                      </FormGroup>
                    </ModalBody>

                    <ModalFooter>
                      <Button type="button" color="light" onClick={toggleEdit}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        color="primary"
                        disabled={editSaveDisabled}
                      >
                        {editSaveDisabled ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            {saving ? "Saving..." : "Uploading..."}
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </ModalFooter>
                  </Form>
                )}
              </Formik>
            </Modal>

            {/* Delete Place Modal */}
            <Modal isOpen={isDeleteOpen} toggle={toggleDelete} centered>
              <ModalHeader toggle={toggleDelete}>Confirm Delete</ModalHeader>
              <ModalBody>
                Are you sure you want to delete{" "}
                <strong>{place.PLACE_NAME}</strong>?
              </ModalBody>
              <ModalFooter>
                <Button color="light" onClick={toggleDelete}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onClick={handleConfirmDelete}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </ModalFooter>
            </Modal>

            {/* ✅ Add Entrance Fees Modal (checkboxes managed in local state) */}
            <Modal
              isOpen={isAddFeeOpen}
              toggle={() => {
                toggleAddFee();
                setSelectedCountries([]);
                setCountriesErr("");
              }}
              centered
              size="lg"
            >
              <ModalHeader
                toggle={() => {
                  toggleAddFee();
                  setSelectedCountries([]);
                  setCountriesErr("");
                }}
              >
                Add Entrance Fees
              </ModalHeader>

              <Formik
                enableReinitialize
                initialValues={{
                  PLACE_ENTRANCE_FEE_AMOUNT: "",
                }}
                validationSchema={Yup.object().shape({
                  PLACE_ENTRANCE_FEE_AMOUNT: Yup.number()
                    .typeError("Amount must be a number")
                    .required("Fee amount is required"),
                })}
                onSubmit={(values) => {
                  // validate countries locally
                  if (!selectedCountries.length) {
                    setCountriesErr("Select at least one country");
                    return;
                  }

                  const payload = {
                    PLACE_ENTRANCE_FEE_AMOUNT: Number(
                      values.PLACE_ENTRANCE_FEE_AMOUNT
                    ),
                    PLACE_ENTRANCE_FEE_COUNTRY_ID: selectedCountries, // ✅ array of numbers
                  };

                  dispatch(createPlaceEntranceFees(placeId, payload));

                  toggleAddFee();
                  setSelectedCountries([]);
                  setCountriesErr("");
                }}
              >
                {({ values, errors, touched, handleChange, handleBlur }) => (
                  <Form>
                    <ModalBody>
                      <Row>
                        <Col md="4">
                          <FormGroup>
                            <Label>Fee Amount *</Label>
                            <Input
                              name="PLACE_ENTRANCE_FEE_AMOUNT"
                              value={values.PLACE_ENTRANCE_FEE_AMOUNT}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={
                                !!(
                                  touched.PLACE_ENTRANCE_FEE_AMOUNT &&
                                  errors.PLACE_ENTRANCE_FEE_AMOUNT
                                )
                              }
                              placeholder="e.g. 25.5"
                            />
                            {touched.PLACE_ENTRANCE_FEE_AMOUNT &&
                            errors.PLACE_ENTRANCE_FEE_AMOUNT ? (
                              <FormFeedback>
                                {errors.PLACE_ENTRANCE_FEE_AMOUNT}
                              </FormFeedback>
                            ) : null}
                          </FormGroup>
                        </Col>

                        <Col md="8">
                          <FormGroup>
                            <Label>Countries *</Label>

                            {countriesLoading ? (
                              <div className="text-muted">
                                <Spinner size="sm" className="me-2" />
                                Loading countries...
                              </div>
                            ) : (
                              <div
                                // ✅ force this block to be clickable even if something overlays
                                style={{
                                  border: "1px solid #e9ecef",
                                  borderRadius: 6,
                                  padding: 12,
                                  maxHeight: 260,
                                  overflowY: "auto",
                                  position: "relative",
                                  zIndex: 2,
                                  pointerEvents: "auto",
                                }}
                              >
                                {(countries || []).map((c) => {
                                  const id = Number(c.LIST_ITEM_ID);
                                  const name = c.ITEM_NAME;

                                  const checked =
                                    selectedCountries.includes(id);

                                  return (
                                    <div
                                      key={id}
                                      className="d-flex align-items-center mb-2"
                                      style={{
                                        cursor: "pointer",
                                        userSelect: "none",
                                        pointerEvents: "auto",
                                      }}
                                      onMouseDown={(e) => {
                                        // ✅ prevents modal/drag selecting weirdness
                                        e.preventDefault();
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleCountry(id);
                                      }}
                                    >
                                      <Input
                                        type="checkbox"
                                        checked={checked}
                                        readOnly
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleCountry(id);
                                        }}
                                        style={{
                                          cursor: "pointer",
                                          pointerEvents: "auto",
                                        }}
                                      />
                                      <span
                                        className="ms-2"
                                        style={{
                                          cursor: "pointer",
                                          pointerEvents: "auto",
                                        }}
                                      >
                                        {name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {countriesErr ? (
                              <div
                                className="text-danger mt-2"
                                style={{ fontSize: 12 }}
                              >
                                {countriesErr}
                              </div>
                            ) : null}

                            {/* Optional: quick visual of selection */}
                            {selectedCountries.length ? (
                              <div
                                className="text-muted mt-2"
                                style={{ fontSize: 12 }}
                              >
                                Selected: {selectedCountries.join(", ")}
                              </div>
                            ) : null}
                          </FormGroup>
                        </Col>
                      </Row>

                      <small className="text-muted">
                        One POST will create one fee row per selected country.
                      </small>
                    </ModalBody>

                    <ModalFooter>
                      <Button
                        type="button"
                        color="light"
                        onClick={() => {
                          toggleAddFee();
                          setSelectedCountries([]);
                          setCountriesErr("");
                        }}
                      >
                        Cancel
                      </Button>

                      <Button
                        type="submit"
                        color="primary"
                        disabled={feesSaving}
                      >
                        {feesSaving ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </ModalFooter>
                  </Form>
                )}
              </Formik>
            </Modal>

            {/* ✅ Edit Entrance Fee Modal */}
            <Modal isOpen={isEditFeeOpen} toggle={toggleEditFee} centered>
              <ModalHeader toggle={toggleEditFee}>
                Edit Entrance Fee
              </ModalHeader>

              <Formik
                enableReinitialize
                initialValues={{
                  PLACE_ENTRANCE_FEE_AMOUNT:
                    selectedFee?.PLACE_ENTRANCE_FEE_AMOUNT ?? "",
                  PLACE_ENTRANCE_FEE_COUNTRY_ID:
                    selectedFee?.PLACE_ENTRANCE_FEE_COUNTRY_ID
                      ? Number(selectedFee.PLACE_ENTRANCE_FEE_COUNTRY_ID)
                      : "",
                }}
                validationSchema={editFeeSchema}
                onSubmit={(values) => {
                  if (!selectedFee) return;

                  const payload = {
                    PLACE_ENTRANCE_FEE_AMOUNT: Number(
                      values.PLACE_ENTRANCE_FEE_AMOUNT
                    ),
                    PLACE_ENTRANCE_FEE_COUNTRY_ID: Number(
                      values.PLACE_ENTRANCE_FEE_COUNTRY_ID
                    ),
                  };

                  dispatch(
                    updatePlaceEntranceFee(
                      placeId,
                      selectedFee.PLACE_ENTRANCE_FEE_ID,
                      payload
                    )
                  );

                  setIsEditFeeOpen(false);
                  setSelectedFee(null);
                }}
              >
                {({ values, errors, touched, handleChange, handleBlur }) => (
                  <Form>
                    <ModalBody>
                      <FormGroup>
                        <Label>Fee Amount *</Label>
                        <Input
                          name="PLACE_ENTRANCE_FEE_AMOUNT"
                          value={values.PLACE_ENTRANCE_FEE_AMOUNT}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={
                            !!(
                              touched.PLACE_ENTRANCE_FEE_AMOUNT &&
                              errors.PLACE_ENTRANCE_FEE_AMOUNT
                            )
                          }
                        />
                        {touched.PLACE_ENTRANCE_FEE_AMOUNT &&
                        errors.PLACE_ENTRANCE_FEE_AMOUNT ? (
                          <FormFeedback>
                            {errors.PLACE_ENTRANCE_FEE_AMOUNT}
                          </FormFeedback>
                        ) : null}
                      </FormGroup>

                      <FormGroup>
                        <Label>Country *</Label>
                        <Input
                          type="select"
                          name="PLACE_ENTRANCE_FEE_COUNTRY_ID"
                          value={values.PLACE_ENTRANCE_FEE_COUNTRY_ID}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={countriesLoading}
                          invalid={
                            !!(
                              touched.PLACE_ENTRANCE_FEE_COUNTRY_ID &&
                              errors.PLACE_ENTRANCE_FEE_COUNTRY_ID
                            )
                          }
                        >
                          <option value="">Select country</option>
                          {(countries || []).map((c) => (
                            <option
                              key={c.LIST_ITEM_ID}
                              value={Number(c.LIST_ITEM_ID)}
                            >
                              {c.ITEM_NAME}
                            </option>
                          ))}
                        </Input>
                        {touched.PLACE_ENTRANCE_FEE_COUNTRY_ID &&
                        errors.PLACE_ENTRANCE_FEE_COUNTRY_ID ? (
                          <FormFeedback>
                            {errors.PLACE_ENTRANCE_FEE_COUNTRY_ID}
                          </FormFeedback>
                        ) : null}
                      </FormGroup>
                    </ModalBody>

                    <ModalFooter>
                      <Button
                        type="button"
                        color="light"
                        onClick={toggleEditFee}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        color="primary"
                        disabled={feesSaving}
                      >
                        {feesSaving ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </ModalFooter>
                  </Form>
                )}
              </Formik>
            </Modal>

            {/* ✅ Delete Entrance Fee Modal */}
            <Modal isOpen={isDeleteFeeOpen} toggle={toggleDeleteFee} centered>
              <ModalHeader toggle={toggleDeleteFee}>
                Delete Entrance Fee
              </ModalHeader>
              <ModalBody>
                Are you sure you want to delete this entrance fee?
              </ModalBody>
              <ModalFooter>
                <Button color="light" onClick={toggleDeleteFee}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onClick={confirmDeleteFee}
                  disabled={feesDeleting}
                >
                  {feesDeleting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </ModalFooter>
            </Modal>
          </>
        ) : null}
      </Container>
    </div>
  );
};

const PlaceProfile = () => (
  <RequireModule moduleCode="CONTRACTING">
    <PlaceProfileInner />
  </RequireModule>
);

export default PlaceProfile;
