// src/pages/Contracting/TransportationCompanyCreate.jsx
import React, { useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
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

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import {
  createTransportationCompany,
  clearTransportationMessages,
} from "../../store/transportation/actions";

const Schema = Yup.object({
  TRANSPORTATION_COMPANY_NAME: Yup.string().required(
    "Company name is required"
  ),
  TRANSPORTATION_COMPANY_EMAIL: Yup.string().email("Invalid email").nullable(),
  TRANSPORTATION_PHONE: Yup.string().nullable(),
  TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME: Yup.string().nullable(),
  TRANSPORTATION_COMPANY_LOGO: Yup.string().nullable(),
  TRANSPORTATION_COMPANY_ACTIVE_STATUS: Yup.number().oneOf([0, 1]).required(),
});

const TransportationCompanyCreateInner = () => {
  document.title = "Create Transportation Company | COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();

 const { creatingCompany, successMessage, errorMessage } = useSelector((state) => {
  const s = state.Transportation || {};
  return {
    creatingCompany: s.creatingCompany || false,
    successMessage: s.successMessage || null,
    errorMessage: s.errorMessage || null,
  };
});


  useEffect(() => {
    return () => dispatch(clearTransportationMessages());
  }, [dispatch]);

  return (
    <RequireModule moduleName="TRANSPORTATION">
      <div className="page-content">
        <Container fluid>
          <Breadcrumb
            title="Contracting"
            breadcrumbItem="Create Transportation Company"
          />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  {errorMessage && <Alert color="danger">{errorMessage}</Alert>}
                  {successMessage && (
                    <Alert color="success">{successMessage}</Alert>
                  )}

                  <Formik
                    initialValues={{
                      TRANSPORTATION_COMPANY_NAME: "",
                      TRANSPORTATION_PHONE: "",
                      TRANSPORTATION_COMPANY_EMAIL: "",
                      TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME: "",
                      TRANSPORTATION_COMPANY_LOGO: "",
                      TRANSPORTATION_COMPANY_ACTIVE_STATUS: 1,
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
                        TRANSPORTATION_COMPANY_LOGO:
                          values.TRANSPORTATION_COMPANY_LOGO || "",
                        TRANSPORTATION_COMPANY_ACTIVE_STATUS: Number(
                          values.TRANSPORTATION_COMPANY_ACTIVE_STATUS
                        ),
                      };

                      dispatch(createTransportationCompany(payload));
                      // Same behavior as HotelCreate: go back to list
                      navigate("/contracting/transportation/companies");
                    }}
                  >
                    {({ errors, touched }) => (
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

                          <Col md={6}>
                            <FormGroup>
                              <Label>Company Logo (URL or file ref)</Label>
                              <Field
                                as={Input}
                                name="TRANSPORTATION_COMPANY_LOGO"
                              />
                            </FormGroup>
                          </Col>

                          <Col md={6}>
                            <FormGroup>
                              <Label>Status</Label>
                              <Field
                                as={Input}
                                type="select"
                                name="TRANSPORTATION_COMPANY_ACTIVE_STATUS"
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
