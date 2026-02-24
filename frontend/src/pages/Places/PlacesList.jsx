import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Container,
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
  Row,
  Col,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Dropzone from "react-dropzone";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import TableContainer from "../../components/Common/TableContainer";

import { getSystemListItems } from "/src/helpers/fakebackend_helper";
import {
  getAttachmentUrl,
  uploadAttachment,
} from "/src/helpers/attachments_helper";

import {
  getPlaces,
  createPlace,
  deletePlace,
  clearPlacesMessages,
} from "/src/store/places/actions";

import {
  Carousel,
  CarouselItem,
  CarouselControl,
  CarouselIndicators,
} from "reactstrap";

const EMPTY_PLACES_STATE = {};

const placesSelector = createSelector(
  (state) => state?.Places || state?.places || EMPTY_PLACES_STATE,
  (placesState) => ({
    places: placesState?.list || [],
    loadingPlaces: placesState?.loadingList || false,
    saving: placesState?.saving || false,
    error: placesState?.error || null,
    successMessage: placesState?.successMessage || null,
  })
);

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

  if (!attachmentIds?.length) {
    return <div className="text-muted">No images.</div>;
  }

  if (!slides.length) {
    return (
      <div className="text-center">
        <Spinner size="sm" className="me-2" />
        Loading images...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
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
                  maxHeight: 420,
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

const PlacesListInner = () => {
  document.title = "Places | Travco - COE";

  const dispatch = useDispatch();
  const { places, loadingPlaces, saving, error, successMessage } =
    useSelector(placesSelector);

  const currentUserId = getCurrentUserId();

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);

  const [selectedAreaId, setSelectedAreaId] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [imagesTarget, setImagesTarget] = useState(null);
  const [isImagesOpen, setIsImagesOpen] = useState(false);

  // ✅ Dropzone files state (create modal only)
  // Each item: { id, name, size, formattedSize, preview, uploading, FILE_ID, error }
  const [dzFiles, setDzFiles] = useState([]);
  const [dzUploadingCount, setDzUploadingCount] = useState(0);

  const toggleCreate = () => setIsCreateOpen((v) => !v);
  const toggleDelete = () => setIsDeleteOpen((v) => !v);
  const toggleImages = () => setIsImagesOpen((v) => !v);

  // cleanup previews on close
  useEffect(() => {
    if (isCreateOpen) return;
    // modal closed => cleanup previews and reset
    dzFiles.forEach((f) => {
      if (f?.preview) URL.revokeObjectURL(f.preview);
    });
    setDzFiles([]);
    setDzUploadingCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateOpen]);

  const areaLabel = useCallback(
    (areaId) => {
      if (areaId === null || areaId === undefined || areaId === "") return "-";
      const found = areas?.find(
        (a) => Number(a.LIST_ITEM_ID) === Number(areaId)
      );
      return found?.ITEM_NAME || `#${areaId}`;
    },
    [areas]
  );

  // Load AREAS system list
  useEffect(() => {
    let mounted = true;
    const loadAreas = async () => {
      setAreasLoading(true);
      setAreasError(null);
      try {
        const res = await getSystemListItems("AREAS");
        if (!mounted) return;
        setAreas(res?.ITEMS || []);
      } catch (e) {
        if (!mounted) return;
        setAreasError(
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

  // Load places list (with optional filter)
  useEffect(() => {
    dispatch(getPlaces(selectedAreaId));
  }, [dispatch, selectedAreaId]);

  // Messages to toast
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearPlacesMessages());
    }
    if (error) {
      toast.error(error);
      dispatch(clearPlacesMessages());
    }
  }, [successMessage, error, dispatch]);

  const columns = useMemo(
    () => [
      {
        header: "Place Name",
        accessorKey: "PLACE_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Area",
        accessorKey: "PLACE_AREA_ID",
        enableColumnFilter: false,
        cell: ({ row }) => areaLabel(row.original.PLACE_AREA_ID),
      },
      {
        header: "Description",
        accessorKey: "PLACE_DESCRIPTION",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const v = row.original.PLACE_DESCRIPTION || "";
          if (!v) return "-";
          return v.length > 60 ? `${v.slice(0, 60)}...` : v;
        },
      },
      {
        header: "Images",
        accessorKey: "IMAGES",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const images = row.original.IMAGES || [];
          const count = images.length || 0;
          if (!count) return <span className="text-muted">0</span>;
          return (
            <Button
              size="sm"
              color="info"
              outline
              onClick={() => {
                setImagesTarget(row.original);
                setIsImagesOpen(true);
              }}
            >
              View ({count})
            </Button>
          );
        },
      },
      {
        header: "Created On",
        accessorKey: "CREATED_ON",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const v = row.original.CREATED_ON;
          if (!v) return "-";
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
        },
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              size="sm"
              color="primary"
              onClick={() =>
                (window.location.href = `/contracting/places/${row.original.PLACE_ID}`)
              }
            >
              Details
            </Button>
            <Button
              size="sm"
              color="danger"
              outline
              onClick={() => {
                setDeleteTarget(row.original);
                setIsDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [areaLabel]
  );

  const createSchema = Yup.object().shape({
    PLACE_NAME: Yup.string().required("Place name is required"),
  });

  const initialValues = {
    PLACE_NAME: "",
    PLACE_AREA_ID: "",
    PLACE_DESCRIPTION: "",
  };

  const updateDzFile = (id, patch) => {
    setDzFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  // ✅ Dropzone handler: upload each dropped file using SAME S3 payload as AttachmentUploader
  const handleDropFiles = async (acceptedFiles) => {
    if (!acceptedFiles?.length) return;

    const newItems = acceptedFiles.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatBytes(file.size),
        preview: URL.createObjectURL(file),
        uploading: true,
        FILE_ID: null,
        error: null,
      };
    });

    setDzFiles((prev) => [...prev, ...newItems]);
    setDzUploadingCount((c) => c + newItems.length);

    // upload sequentially (stable UX + avoids many parallel uploads)
    for (const item of newItems) {
      try {
        const formData = new FormData();
        formData.append("USER_ID", String(currentUserId || ""));
        formData.append("FILE_CATEGORY", "PLACE_IMAGES");
        formData.append("FILE_NAME", item.file.name);
        formData.append("file", item.file);

        const res = await uploadAttachment(formData);
        updateDzFile(item.id, {
          uploading: false,
          FILE_ID: res?.FILE_ID || null,
          error: null,
        });

        if (!res?.FILE_ID) {
          updateDzFile(item.id, {
            error: "Upload finished but FILE_ID is missing",
          });
          toast.error("Image uploaded but FILE_ID missing from response.");
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Upload failed";
        updateDzFile(item.id, { uploading: false, error: msg, FILE_ID: null });
        toast.error(`${item.name}: ${msg}`);
      } finally {
        setDzUploadingCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const removeDzFile = (id) => {
    setDzFiles((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const onSubmitCreate = (values, { resetForm }) => {
    const attachmentIds = dzFiles
      .filter((x) => x?.FILE_ID)
      .map((x) => x.FILE_ID);

    const images = attachmentIds.map((id) => ({
      PLACE_IMAGE_ATTACHMENT_ID: id,
    }));

    const payload = {
      PLACE_NAME: values.PLACE_NAME,
      PLACE_AREA_ID: values.PLACE_AREA_ID ? Number(values.PLACE_AREA_ID) : null,
      PLACE_DESCRIPTION: values.PLACE_DESCRIPTION || null,
      IMAGES: images,
    };

    dispatch(createPlace(payload));
    setIsCreateOpen(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (!deleteTarget?.PLACE_ID) return;
    dispatch(deletePlace(deleteTarget.PLACE_ID));
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const createDisabled = saving || dzUploadingCount > 0;

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Places" />

        <ToastContainer closeButton={false} />

        <Card>
          <CardBody>
            <Row className="align-items-end mb-3">
              <Col md="4">
                <FormGroup>
                  <Label>Filter by Area</Label>
                  <Input
                    type="select"
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={areasLoading}
                  >
                    <option value="">All Areas</option>
                    {areas.map((a) => (
                      <option key={a.LIST_ITEM_ID} value={a.LIST_ITEM_ID}>
                        {a.ITEM_NAME}
                      </option>
                    ))}
                  </Input>
                  {areasLoading && (
                    <small className="text-muted d-block mt-1">
                      Loading areas...
                    </small>
                  )}
                  {areasError && (
                    <small className="text-danger d-block mt-1">
                      {areasError}
                    </small>
                  )}
                </FormGroup>
              </Col>

              <Col className="text-end">
                <Button color="success" onClick={toggleCreate}>
                  Add Place
                </Button>
              </Col>
            </Row>

            {loadingPlaces ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading places...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={places || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClass="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search places..."
                isAddButton={false}
                isCustomPageSize={true}
                disableFilters={true}
              />
            )}

            {!!error && (
              <Alert color="danger" className="mt-3 mb-0">
                {error}
              </Alert>
            )}
          </CardBody>
        </Card>

        {/* ✅ Create Place Modal (enhanced with Dropzone) */}
        <Modal isOpen={isCreateOpen} toggle={toggleCreate} centered size="lg">
          <ModalHeader toggle={toggleCreate}>Add Place</ModalHeader>

          <Formik
            initialValues={initialValues}
            validationSchema={createSchema}
            onSubmit={onSubmitCreate}
          >
            {({ values, handleChange, handleBlur, touched, errors }) => {
              const uploadedAttachmentIds = dzFiles
                .filter((x) => x?.FILE_ID)
                .map((x) => x.FILE_ID);

              return (
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

                    {/* ✅ Dropzone Upload */}
                    <FormGroup>
                      <Label className="d-block">Images</Label>

                      <Dropzone
                        accept={{ "image/*": [] }}
                        onDrop={(acceptedFiles) =>
                          handleDropFiles(acceptedFiles)
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
                                PNG, JPG, GIF up to 5MB
                              </div>

                              {dzUploadingCount > 0 ? (
                                <div className="text-center mt-3">
                                  <Spinner size="sm" className="me-2" />
                                  Uploading {dzUploadingCount} file(s)...
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </Dropzone>

                      {/* ✅ Previews list */}
                      <div
                        className="dropzone-previews mt-3"
                        id="file-previews"
                      >
                        {dzFiles.map((f) => (
                          <Card
                            className="mt-1 mb-0 shadow-none border"
                            key={f.id}
                          >
                            <div className="p-2">
                              <Row className="align-items-center">
                                <Col className="col-auto">
                                  <img
                                    height="80"
                                    className="avatar-sm rounded bg-light"
                                    alt={f.name}
                                    src={f.preview}
                                    style={{ objectFit: "cover" }}
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
                                      Uploaded (FILE_ID: {f.FILE_ID})
                                    </small>
                                  ) : null}
                                </Col>

                                <Col className="col-auto">
                                  <Button
                                    type="button"
                                    size="sm"
                                    color="danger"
                                    outline
                                    onClick={() => removeDzFile(f.id)}
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

                      {/* ✅ Carousel preview for uploaded images (friendly UX) */}
                      <div className="mt-3">
                        <AttachmentCarousel
                          attachmentIds={uploadedAttachmentIds}
                        />
                      </div>

                      <small className="text-muted d-block mt-2">
                        The uploaded files will be used across the system.
                      </small>
                    </FormGroup>
                  </ModalBody>

                  <ModalFooter>
                    <Button type="button" color="light" onClick={toggleCreate}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      color="success"
                      disabled={createDisabled}
                    >
                      {createDisabled ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          {saving ? "Saving..." : "Uploading..."}
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </ModalFooter>
                </Form>
              );
            }}
          </Formik>
        </Modal>

        {/* Images Viewer Modal */}
        <Modal isOpen={isImagesOpen} toggle={toggleImages} centered size="lg">
          <ModalHeader toggle={toggleImages}>
            {imagesTarget?.PLACE_NAME || "Place Images"}
          </ModalHeader>
          <ModalBody>
            <AttachmentCarousel
              attachmentIds={(imagesTarget?.IMAGES || []).map(
                (x) => x.PLACE_IMAGE_ATTACHMENT_ID
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={toggleImages}>
              Close
            </Button>
          </ModalFooter>
        </Modal>

        {/* Delete Confirm Modal */}
        <Modal isOpen={isDeleteOpen} toggle={toggleDelete} centered>
          <ModalHeader toggle={toggleDelete}>Confirm Delete</ModalHeader>
          <ModalBody>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.PLACE_NAME}</strong>?
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={toggleDelete}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmDelete} disabled={saving}>
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
      </Container>
    </div>
  );
};

const PlacesList = () => (
  <RequireModule moduleCode="CONTRACTING">
    <PlacesListInner />
  </RequireModule>
);

export default PlacesList;
