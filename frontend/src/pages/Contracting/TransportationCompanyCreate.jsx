// src/pages/Contracting/TransportationCompanyCreate.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  FormFeedback,
  Input,
  Label,
  FormGroup,
  Spinner,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import {
  createTransportationCompany,
  clearTransportationMessages,
} from "../../store/transportation/actions";

// Same validation style as existing create page (but logo is uploaded -> file id)
const Schema = Yup.object({
  TRANSPORTATION_COMPANY_NAME: Yup.string().required("Company name is required"),
  TRANSPORTATION_COMPANY_EMAIL: Yup.string().email("Invalid email").nullable(),
  TRANSPORTATION_PHONE: Yup.string().nullable(),
  TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME: Yup.string().nullable(),
  TRANSPORTATION_COMPANY_ACTIVE_STATUS: Yup.number().oneOf([0, 1]).required(),
});

// Client pages usually use this pattern
const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return null;
    const obj = JSON.parse(raw);

    return (
      obj?.user?.USER_ID ||
      obj?.user?.id ||
      obj?.USER_ID ||
      obj?.id ||
      null
    );
  } catch {
    return null;
  }
};

const TransportationCompanyCreateInner = () => {
  document.title = "Create Transportation Company | COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const { creatingCompany, successMessage, errorMessage } = useSelector(
    (state) => {
      const s = state.Transportation || {};
      return {
        creatingCompany: s.creatingCompany || false,
        successMessage: s.successMessage || null,
        errorMessage: s.errorMessage || null,
      };
    }
  );

  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  // ✅ Toast behavior (like ClientsList)
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(clearTransportationMessages());
    }
  }, [errorMessage, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearTransportationMessages());
      navigate("/contracting/transportation/companies");
    }
  }, [successMessage, dispatch, navigate]);

  // Cleanup
  useEffect(() => {
    return () => dispatch(clearTransportationMessages());
  }, [dispatch]);

  return (
    <RequireModule moduleName="TRANSPORTATION">
      <div className="page-content">
        {/* ✅ Matches client pages */}
        <ToastContainer position="top-right" autoClose={3000} />

        <Container fluid>
          <Breadcrumb
            title="Contracting"
            breadcrumbItem="Create Transportation Company"
          />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <Formik
                    initialValues={{
                      TRANSPORTATION_COMPANY_NAME: "",
                      TRANSPORTATION_PHONE: "",
                      TRANSPORTATION_COMPANY_EMAIL: "",
                      TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME: "",
                      TRANSPORTATION_COMPANY_ACTIVE_STATUS: 1,

                      // ✅ uploader metadata
                      COMPANY_LOGO_FILE_ID: null,
                      COMPANY_LOGO_FILE_NAME: "",
                    }}
                    validationSchema={Schema}
                    onSubmit={(values) => {
                      const payload = {
                        TRANSPORTATION_COMPANY_NAME:
                          values.TRANSPORTATION_COMPANY_NAME,
                        TRANSPORTATION_PHONE: values.TRANSPORTATION_PHONE || "",
                        TRANSPORTATION_COMPANY_EMAIL:
                          values.TRANSPORTATION_COMPANY_EMAIL || "",
                        TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME:
                          values.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME ||
                          "",
                        TRANSPORTATION_COMPANY_ACTIVE_STATUS: Number(
                          values.TRANSPORTATION_COMPANY_ACTIVE_STATUS
                        ),

                        // ✅ same client behavior: submit file id
                        TRANSPORTATION_COMPANY_LOGO:
                          values.COMPANY_LOGO_FILE_ID || null,
                      };

                      dispatch(createTransportationCompany(payload));
                      // navigation happens on success toast (above)
                    }}
                  >
                    {({ errors, touched, setFieldValue, values }) => (
                      <Form>
                        <Row>
                          <Col md={6}>
                            <FormGroup>
                              <Label>Company Name</Label>
                              <Field
                                as={Input}
                                name="TRANSPORTATION_COMPANY_NAME"
                                invalid={
                                  touched.TRANSPORTATION_COMPANY_NAME &&
                                  !!errors.TRANSPORTATION_COMPANY_NAME
                                }
                              />
                              <FormFeedback>
                                {errors.TRANSPORTATION_COMPANY_NAME}
                              </FormFeedback>
                            </FormGroup>
                          </Col>

                          <Col md={6}>
                            <FormGroup>
                              <Label>Contact Person</Label>
                              <Field
                                as={Input}
                                name="TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME"
                              />
                            </FormGroup>
                          </Col>

                          <Col md={6}>
                            <FormGroup>
                              <Label>Phone</Label>
                              <Field as={Input} name="TRANSPORTATION_PHONE" />
                            </FormGroup>
                          </Col>

                          <Col md={6}>
                            <FormGroup>
                              <Label>Email</Label>
                              <Field
                                as={Input}
                                name="TRANSPORTATION_COMPANY_EMAIL"
                                invalid={
                                  touched.TRANSPORTATION_COMPANY_EMAIL &&
                                  !!errors.TRANSPORTATION_COMPANY_EMAIL
                                }
                              />
                              <FormFeedback>
                                {errors.TRANSPORTATION_COMPANY_EMAIL}
                              </FormFeedback>
                            </FormGroup>
                          </Col>

                          {/* ✅ Company Logo Uploader (client-style) */}
                          <Col md={6}>
                            <FormGroup>
                              <Label>Company Logo</Label>

                              <AttachmentUploader
                                userId={currentUserId}
                                category="TRANSPORTATION_COMPANY_LOGO"
                                accept="image/*"
                                fileId={values.COMPANY_LOGO_FILE_ID}
                                fileName={values.COMPANY_LOGO_FILE_NAME}
                                onUploaded={(fileMeta) => {
                                  setFieldValue(
                                    "COMPANY_LOGO_FILE_ID",
                                    fileMeta?.FILE_ID || null
                                  );
                                  setFieldValue(
                                    "COMPANY_LOGO_FILE_NAME",
                                    fileMeta?.FILE_NAME ||
                                      fileMeta?.ORIGINAL_NAME ||
                                      ""
                                  );

                                  // Preview behavior like client sample:
                                  if (fileMeta?.url) {
                                    setLogoPreviewUrl(fileMeta.url);
                                  } else if (fileMeta?.FILE_ID) {
                                    setLogoPreviewUrl(
                                      `/api/attachments/${fileMeta.FILE_ID}`
                                    );
                                  } else {
                                    setLogoPreviewUrl(null);
                                  }
                                }}
                              />

                              {logoPreviewUrl ? (
                                <div className="mt-2">
                                  <img
                                    src={logoPreviewUrl}
                                    alt="Company Logo Preview"
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

                          <Col md={6}>
                            <FormGroup>
                              <Label>Status</Label>
                              <Field
                                as={Input}
                                type="select"
                                name="TRANSPORTATION_COMPANY_ACTIVE_STATUS"
                                disabled={creatingCompany}
                              >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                              </Field>
                            </FormGroup>
                          </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            color="light"
                            onClick={() => navigate(-1)}
                            disabled={creatingCompany}
                            type="button"
                          >
                            Back
                          </Button>
                          <Button
                            color="primary"
                            type="submit"
                            disabled={creatingCompany}
                          >
                            {creatingCompany ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Saving...
                              </>
                            ) : (
                              "Create"
                            )}
                          </Button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </RequireModule>
  );
};

export default function TransportationCompanyCreate() {
  return <TransportationCompanyCreateInner />;
}
