import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Alert,
  Spinner,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Formik } from "formik";
import * as Yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";
import RequireModule from "../../components/auth/RequireModule";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import {
  getGuides,
  createGuide,
  clearGuidesMessages,
} from "../../store/guides/actions";
import { getListByKey } from "../../helpers/fakebackend_helper";

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

const GuidesListInner = () => {
  document.title = "Guides | Travco - COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Languages dropdown (List-by-key API)
  const [languages, setLanguages] = useState([]);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [languagesError, setLanguagesError] = useState(null);

  // optional image preview (same as ClientsList)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const {
    items: guides,
    loadingList,
    creating,
    successMessage,
    errorMessage,
  } = useSelector((state) => state.Guides);

  useEffect(() => {
    // default active only
    dispatch(getGuides({ GUIDE_ACTIVE_STATUS: "1" }));
  }, [dispatch]);

  useEffect(() => {
    const loadLanguages = async () => {
      setLanguagesLoading(true);
      setLanguagesError(null);
      try {
        const res = await getListByKey("LANGUAGES");
        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.ITEMS)
          ? res.ITEMS
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setLanguages(arr);
      } catch (e) {
        console.error("Failed to load languages", e);
        setLanguagesError(
          e?.response?.data?.message || e?.message || "Failed to load languages"
        );
      } finally {
        setLanguagesLoading(false);
      }
    };

    loadLanguages();
  }, []);

  // Toast notifications like ClientsList
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setIsCreateOpen(false);
      setImagePreviewUrl(null);
      dispatch(clearGuidesMessages());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(clearGuidesMessages());
    }
  }, [errorMessage, dispatch]);

  const toggleCreate = () => {
    setIsCreateOpen((v) => !v);
    if (isCreateOpen) setImagePreviewUrl(null);
  };

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const languageLabel = (langId) => {
    if (langId === null || langId === undefined || langId === "") return "-";
    const found = (languages || []).find(
      (x) => String(x.ID ?? x.LIST_ITEM_ID ?? x.value) === String(langId)
    );
    return found?.NAME ?? found?.ITEM_NAME ?? found?.label ?? `#${langId}`;
  };

  const handleViewProfile = (guideId) => {
    navigate(`/contracting/guides/${guideId}`);
  };

  const columns = useMemo(
    () => [
      { header: "Name", accessorKey: "GUIDE_NAME", enableColumnFilter: false },
      {
        header: "Language",
        accessorKey: "GUIDE_LANGUAGE_ID",
        enableColumnFilter: false,
        cell: (info) => languageLabel(info.getValue()),
      },
      {
        header: "Daily Rate",
        accessorKey: "GUIDE_DAILY_RATE",
        enableColumnFilter: false,
      },
      {
        header: "Phone",
        accessorKey: "GUIDE_PHONE_NUMBER",
        enableColumnFilter: false,
      },
      {
        header: "Email",
        accessorKey: "GUIDE_EMAIL",
        enableColumnFilter: false,
      },
      {
        header: "Status",
        accessorKey: "GUIDE_ACTIVE_STATUS",
        enableColumnFilter: false,
        cell: (info) => renderStatusBadge(info.getValue()),
      },
      {
        id: "actions",
        header: "Actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const g = row.original;
          return (
            <Button
              color="link"
              size="sm"
              className="p-0"
              onClick={() => handleViewProfile(g.GUIDE_ID)}
            >
              View Profile
            </Button>
          );
        },
      },
    ],
    [languages]
  );

  const createSchema = Yup.object().shape({
    GUIDE_NAME: Yup.string().trim().required("Guide name is required"),
    GUIDE_LANGUAGE_ID: Yup.mixed().nullable(),
    GUIDE_DAILY_RATE: Yup.number()
      .typeError("Daily rate must be a number")
      .nullable(),
    GUIDE_PHONE_NUMBER: Yup.string().trim().nullable(),
    GUIDE_EMAIL: Yup.string().trim().email("Invalid email").nullable(),
    GUIDE_ACTIVE_STATUS: Yup.mixed()
      .oneOf([0, 1])
      .required("Status is required"),
  });

  const initialValues = {
    GUIDE_NAME: "",
    GUIDE_LANGUAGE_ID: "",
    GUIDE_DAILY_RATE: "",
    GUIDE_PHONE_NUMBER: "",
    GUIDE_EMAIL: "",
    GUIDE_ACTIVE_STATUS: 1,

    // uploader meta (same pattern as ClientsList)
    GUIDE_PROFILE_IMAGE_FILE_ID: null,
    GUIDE_PROFILE_IMAGE_FILE_NAME: "",
  };

  const onSubmitCreate = (values) => {
    // IMPORTANT: never send COMPANY_ID
    // We store attachment FILE_ID and send it as string in GUIDE_PROFILE_IMAGE
    dispatch(
      createGuide({
        GUIDE_NAME: values.GUIDE_NAME,
        GUIDE_LANGUAGE_ID: values.GUIDE_LANGUAGE_ID
          ? Number(values.GUIDE_LANGUAGE_ID)
          : null,
        GUIDE_DAILY_RATE:
          values.GUIDE_DAILY_RATE !== ""
            ? Number(values.GUIDE_DAILY_RATE)
            : null,
        GUIDE_PHONE_NUMBER: values.GUIDE_PHONE_NUMBER || null,
        GUIDE_EMAIL: values.GUIDE_EMAIL || null,
        GUIDE_ACTIVE_STATUS: Number(values.GUIDE_ACTIVE_STATUS),

        GUIDE_PROFILE_IMAGE: values.GUIDE_PROFILE_IMAGE_FILE_ID
          ? String(values.GUIDE_PROFILE_IMAGE_FILE_ID)
          : null,
      })
    );
  };

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Guides" />

        <Card>
          <CardBody>
            {errorMessage && (
              <Alert color="danger" className="mb-3">
                {errorMessage}
              </Alert>
            )}

            {loadingList ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading guides...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={guides || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClass="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search guides..."
                isAddButton={true}
                isCustomPageSize={true}
                disableFilters={true}
                handleUserClick={() => setIsCreateOpen(true)}
                buttonName="Add Guide"
              />
            )}
          </CardBody>
        </Card>

        {/* Create Guide Modal */}
        <Modal isOpen={isCreateOpen} toggle={toggleCreate} centered>
          <ModalHeader toggle={toggleCreate}>Add Guide</ModalHeader>

          <Formik
            initialValues={initialValues}
            validationSchema={createSchema}
            onSubmit={onSubmitCreate}
          >
            {({
              values,
              handleChange,
              handleBlur,
              handleSubmit,
              touched,
              errors,
              setFieldValue,
            }) => (
              <Form onSubmit={handleSubmit}>
                <ModalBody>
                  <FormGroup>
                    <Label>Guide Name *</Label>
                    <Input
                      name="GUIDE_NAME"
                      value={values.GUIDE_NAME}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={touched.GUIDE_NAME && !!errors.GUIDE_NAME}
                      placeholder="Enter guide name"
                    />
                    {touched.GUIDE_NAME && errors.GUIDE_NAME ? (
                      <FormFeedback>{errors.GUIDE_NAME}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Language</Label>
                    <Input
                      type="select"
                      name="GUIDE_LANGUAGE_ID"
                      value={values.GUIDE_LANGUAGE_ID}
                      onChange={(e) =>
                        setFieldValue("GUIDE_LANGUAGE_ID", e.target.value)
                      }
                      onBlur={handleBlur}
                      disabled={languagesLoading}
                    >
                      <option value="">Select language</option>
                      {(languages || []).map((l) => {
                        const id = l.ID ?? l.LIST_ITEM_ID ?? l.value;
                        const name = l.NAME ?? l.ITEM_NAME ?? l.label;
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        );
                      })}
                    </Input>

                    {languagesLoading ? (
                      <small className="text-muted">
                        <Spinner size="sm" className="me-1" />
                        Loading languages...
                      </small>
                    ) : null}

                    {languagesError ? (
                      <small className="text-danger">{languagesError}</small>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Daily Rate</Label>
                    <Input
                      name="GUIDE_DAILY_RATE"
                      value={values.GUIDE_DAILY_RATE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.GUIDE_DAILY_RATE && !!errors.GUIDE_DAILY_RATE
                      }
                      placeholder="e.g. 120"
                    />
                    {touched.GUIDE_DAILY_RATE && errors.GUIDE_DAILY_RATE ? (
                      <FormFeedback>{errors.GUIDE_DAILY_RATE}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Phone</Label>
                    <Input
                      name="GUIDE_PHONE_NUMBER"
                      value={values.GUIDE_PHONE_NUMBER}
                      onChange={handleChange}
                      placeholder="e.g. 00962-7xxxxxxx"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Email</Label>
                    <Input
                      name="GUIDE_EMAIL"
                      value={values.GUIDE_EMAIL}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={touched.GUIDE_EMAIL && !!errors.GUIDE_EMAIL}
                      placeholder="e.g. guide@company.com"
                    />
                    {touched.GUIDE_EMAIL && errors.GUIDE_EMAIL ? (
                      <FormFeedback>{errors.GUIDE_EMAIL}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  {/* ✅ Uploader like ClientsList */}
                  <FormGroup>
                    <Label>Profile Image</Label>
                    <AttachmentUploader
                      userId={currentUserId}
                      category="GUIDE_PROFILE_IMAGE"
                      accept="image/*"
                      fileId={values.GUIDE_PROFILE_IMAGE_FILE_ID}
                      fileName={values.GUIDE_PROFILE_IMAGE_FILE_NAME}
                      onUploaded={(fileMeta) => {
                        setFieldValue(
                          "GUIDE_PROFILE_IMAGE_FILE_ID",
                          fileMeta?.FILE_ID || null
                        );
                        setFieldValue(
                          "GUIDE_PROFILE_IMAGE_FILE_NAME",
                          fileMeta?.FILE_NAME || fileMeta?.ORIGINAL_NAME || ""
                        );

                        if (fileMeta?.url) {
                          setImagePreviewUrl(fileMeta.url);
                        } else if (fileMeta?.FILE_ID) {
                          setImagePreviewUrl(
                            `/api/attachments/${fileMeta.FILE_ID}`
                          );
                        } else {
                          setImagePreviewUrl(null);
                        }
                      }}
                    />

                    {imagePreviewUrl ? (
                      <div className="mt-2">
                        <img
                          src={imagePreviewUrl}
                          alt="Guide Image Preview"
                          style={{
                            width: "140px",
                            height: "140px",
                            objectFit: "contain",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            padding: "4px",
                            background: "#fafafa",
                          }}
                        />
                      </div>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Status *</Label>
                    <Input
                      type="select"
                      name="GUIDE_ACTIVE_STATUS"
                      value={values.GUIDE_ACTIVE_STATUS}
                      onChange={(e) =>
                        setFieldValue(
                          "GUIDE_ACTIVE_STATUS",
                          Number(e.target.value)
                        )
                      }
                      onBlur={handleBlur}
                      invalid={
                        touched.GUIDE_ACTIVE_STATUS &&
                        !!errors.GUIDE_ACTIVE_STATUS
                      }
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </Input>
                    {touched.GUIDE_ACTIVE_STATUS &&
                    errors.GUIDE_ACTIVE_STATUS ? (
                      <FormFeedback>{errors.GUIDE_ACTIVE_STATUS}</FormFeedback>
                    ) : null}
                  </FormGroup>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="light"
                    onClick={toggleCreate}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </Modal>
      </Container>
    </div>
  );
};

const GuidesList = () => (
  <RequireModule module="CONTRACTING_USER">
    <GuidesListInner />
  </RequireModule>
);

export default GuidesList;
