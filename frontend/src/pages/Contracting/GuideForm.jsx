import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Form,
  Label,
  Input,
  FormFeedback,
  FormGroup,
} from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Formik } from "formik";
import * as Yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import { getListByKey } from "/src/helpers/fakebackend_helper";
import { getAttachmentUrl } from "/src/helpers/attachments_helper";

import { getGuide, createGuide, updateGuide } from "/src/store/guides/actions";

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

const GuideFormInner = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current, loadingOne, creating, updating } = useSelector(
    (s) => s.Guides
  );

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  // languages
  const [languages, setLanguages] = useState([]);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [languagesError, setLanguagesError] = useState(null);

  // preview
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

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

  useEffect(() => {
    if (isEdit) dispatch(getGuide(id));
  }, [dispatch, isEdit, id]);

  // Load existing preview when editing (like ClientProfile loads logo)
  useEffect(() => {
    const loadExisting = async () => {
      try {
        if (isEdit && current?.GUIDE_PROFILE_IMAGE) {
          const url = await getAttachmentUrl(current.GUIDE_PROFILE_IMAGE);
          setImagePreviewUrl(url || null);
        } else {
          setImagePreviewUrl(null);
        }
      } catch (e) {
        console.error("Failed to load existing guide image", e);
        setImagePreviewUrl(null);
      }
    };

    loadExisting();
  }, [isEdit, current]);

  const languageOptions = useMemo(
    () =>
      (languages || []).map((x) => ({
        value: x.ID ?? x.LIST_ITEM_ID ?? x.KEY_ID ?? x.value,
        label: x.NAME ?? x.ITEM_NAME ?? x.KEY_NAME ?? x.label,
      })),
    [languages]
  );

  const initialValues = useMemo(
    () => ({
      GUIDE_NAME: current?.GUIDE_NAME || "",
      GUIDE_LANGUAGE_ID: current?.GUIDE_LANGUAGE_ID
        ? String(current.GUIDE_LANGUAGE_ID)
        : "",
      GUIDE_DAILY_RATE: current?.GUIDE_DAILY_RATE ?? "",
      GUIDE_PHONE_NUMBER: current?.GUIDE_PHONE_NUMBER ?? "",
      GUIDE_EMAIL: current?.GUIDE_EMAIL ?? "",
      GUIDE_ACTIVE_STATUS:
        current?.GUIDE_ACTIVE_STATUS === 0 ||
        current?.GUIDE_ACTIVE_STATUS === "0"
          ? 0
          : 1,

      GUIDE_PROFILE_IMAGE_FILE_ID: current?.GUIDE_PROFILE_IMAGE || null,
      GUIDE_PROFILE_IMAGE_FILE_NAME: "",
    }),
    [current]
  );

  const validation = Yup.object({
    GUIDE_NAME: Yup.string().trim().required("Guide name is required."),
    GUIDE_EMAIL: Yup.string()
      .trim()
      .email("Please enter a valid email address.")
      .nullable(),
    GUIDE_DAILY_RATE: Yup.number()
      .typeError("Daily rate must be a number.")
      .nullable(),
  });

  const toPayload = (values) => {
    // Allowed fields only (no COMPANY_ID, no CREATED/UPDATED fields)
    const payload = {
      GUIDE_NAME: values.GUIDE_NAME.trim(),
      GUIDE_ACTIVE_STATUS: Number(values.GUIDE_ACTIVE_STATUS) === 0 ? 0 : 1,
    };

    if (values.GUIDE_LANGUAGE_ID !== "")
      payload.GUIDE_LANGUAGE_ID = Number(values.GUIDE_LANGUAGE_ID);
    if (values.GUIDE_DAILY_RATE !== "")
      payload.GUIDE_DAILY_RATE = Number(values.GUIDE_DAILY_RATE);
    if (values.GUIDE_PHONE_NUMBER)
      payload.GUIDE_PHONE_NUMBER = values.GUIDE_PHONE_NUMBER;
    if (values.GUIDE_EMAIL) payload.GUIDE_EMAIL = values.GUIDE_EMAIL;

    // store attachment id as string (fits example response)
    payload.GUIDE_PROFILE_IMAGE = values.GUIDE_PROFILE_IMAGE_FILE_ID
      ? String(values.GUIDE_PROFILE_IMAGE_FILE_ID)
      : null;

    return payload;
  };

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb
          title="Contracting"
          breadcrumbItem={isEdit ? "Edit Guide" : "Add Guide"}
        />

        <Card>
          <CardBody>
            {isEdit && loadingOne ? (
              <div className="text-center py-5">
                <Spinner /> <div className="mt-2">Loading guide details…</div>
              </div>
            ) : (
              <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={validation}
                onSubmit={(values) => {
                  const payload = toPayload(values);

                  if (!isEdit) {
                    dispatch(
                      createGuide(payload, (err, res) => {
                        if (err) {
                          toast.error(`We couldn't create this guide. ${err}`);
                          return;
                        }
                        toast.success("Guide created successfully ✅");
                        navigate(`/contracting/guides/${res.GUIDE_ID}`);
                      })
                    );
                  } else {
                    dispatch(
                      updateGuide(id, payload, (err) => {
                        if (err) {
                          toast.error(`We couldn't save your changes. ${err}`);
                          return;
                        }
                        toast.success("Changes saved ✅");
                        navigate(`/contracting/guides/${id}`);
                      })
                    );
                  }
                }}
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
                    <Row>
                      <Col md={6} className="mb-3">
                        <Label>Guide Name *</Label>
                        <Input
                          name="GUIDE_NAME"
                          value={values.GUIDE_NAME}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={touched.GUIDE_NAME && !!errors.GUIDE_NAME}
                        />
                        <FormFeedback>{errors.GUIDE_NAME}</FormFeedback>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Label>Language</Label>
                        <Input
                          type="select"
                          name="GUIDE_LANGUAGE_ID"
                          value={values.GUIDE_LANGUAGE_ID}
                          onChange={(e) =>
                            setFieldValue("GUIDE_LANGUAGE_ID", e.target.value)
                          }
                          disabled={languagesLoading}
                        >
                          <option value="">— Optional —</option>
                          {languageOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Input>
                        {languagesError ? (
                          <small className="text-danger">
                            {languagesError}
                          </small>
                        ) : null}
                      </Col>

                      <Col md={4} className="mb-3">
                        <Label>Daily Rate</Label>
                        <Input
                          name="GUIDE_DAILY_RATE"
                          value={values.GUIDE_DAILY_RATE}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={
                            touched.GUIDE_DAILY_RATE &&
                            !!errors.GUIDE_DAILY_RATE
                          }
                        />
                        <FormFeedback>{errors.GUIDE_DAILY_RATE}</FormFeedback>
                      </Col>

                      <Col md={4} className="mb-3">
                        <Label>Phone</Label>
                        <Input
                          name="GUIDE_PHONE_NUMBER"
                          value={values.GUIDE_PHONE_NUMBER}
                          onChange={handleChange}
                        />
                      </Col>

                      <Col md={4} className="mb-3">
                        <Label>Email</Label>
                        <Input
                          name="GUIDE_EMAIL"
                          value={values.GUIDE_EMAIL}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={touched.GUIDE_EMAIL && !!errors.GUIDE_EMAIL}
                        />
                        <FormFeedback>{errors.GUIDE_EMAIL}</FormFeedback>
                      </Col>

                      <Col md={6} className="mb-3">
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
                                fileMeta?.FILE_NAME ||
                                  fileMeta?.ORIGINAL_NAME ||
                                  ""
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
                      </Col>

                      <Col md={6} className="mb-3">
                        <Label>Status</Label>
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
                        >
                          <option value={1}>Active</option>
                          <option value={0}>Inactive</option>
                        </Input>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button
                        type="button"
                        color="light"
                        onClick={() => navigate("/contracting/guides")}
                      >
                        Back
                      </Button>
                      <Button
                        color="primary"
                        type="submit"
                        disabled={creating || updating}
                      >
                        {creating || updating ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

const GuideForm = () => (
  <RequireModule module="CONTRACTING_USER">
    <GuideFormInner />
  </RequireModule>
);

export default GuideForm;
