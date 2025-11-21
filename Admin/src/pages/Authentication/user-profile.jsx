// src/pages/Authentication/user-profile.jsx

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  CardBody,
  Button,
  Label,
  Input,
  FormFeedback,
  Form,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

import withRouter from "../../components/Common/withRouter";
import Breadcrumb from "../../components/Common/Breadcrumb";

import avatar from "../../assets/images/users/avatar-1.jpg";

import { editProfile, resetProfileFlag } from "/src/store/actions";

const UserProfile = () => {
  document.title = "Profile | Travco - COE - React Admin & Dashboard Template";

  const dispatch = useDispatch();

  const ProfileProperties = createSelector(
    (state) => state.Profile,
    (profile) => ({
      error: profile.error,
      success: profile.success,
    })
  );

  const { error, success } = useSelector(ProfileProperties);

  const [idx, setIdx] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("authUser");
    if (!raw) return;

    const obj = JSON.parse(raw);

    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      setFirstName(obj.displayName || "");
      setLastName("");
      setEmail(obj.email || "");
      setIdx(obj.uid || 1);
    } else if (import.meta.env.VITE_APP_DEFAULTAUTH === "fake") {
      setFirstName(obj.username || "");
      setLastName("");
      setEmail(obj.email || "");
      setIdx(obj.uid || 1);
    } else if (import.meta.env.VITE_APP_DEFAULTAUTH === "jwt") {
      const u = obj.user || obj.USER || obj;

      setFirstName(u.FIRST_NAME || "");
      setLastName(u.LAST_NAME || "");
      setEmail(u.EMAIL || u.email || "");
      setPhoneNumber(u.PHONE_NUMBER || "");
      setDepartmentId(u.DEPATRMENT_ID || u.DEPARTMENT_ID || "");
      setIdx(u.USER_ID || u.uid || 1);
    }

    const timeoutId = setTimeout(() => {
      dispatch(resetProfileFlag());
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [dispatch, success]);

  const fullName =
    (firstName || lastName)
      ? `${firstName || ""} ${lastName || ""}`.trim()
      : email;

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || "",
      phoneNumber: phoneNumber || "",
      departmentId: departmentId || "",
      idx: idx || "",
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required("Please Enter Your First Name"),
      lastName: Yup.string().required("Please Enter Your Last Name"),
      email: Yup.string()
        .email("Please enter a valid Email")
        .required("Please Enter Your Email"),
      phoneNumber: Yup.string().nullable(),
      departmentId: Yup.string().nullable(),
    }),
    onSubmit: (values) => {
      dispatch(editProfile(values));
    },
  });

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Travco - COE" breadcrumbItem="Profile" />

          <Row>
            <Col lg="12">
              {error ? (
                <Alert color="danger" fade={false}>
                  {error}
                </Alert>
              ) : null}
              {success ? (
                <Alert color="success" fade={false}>
                  {success}
                </Alert>
              ) : null}

              <Card>
                <CardBody>
                  <div className="d-flex">
                    <div className="ms-3">
                      <img
                        src={avatar}
                        alt=""
                        className="avatar-md rounded-circle img-thumbnail"
                      />
                    </div>
                    <div className="flex-grow-1 align-self-center">
                      <div className="text-muted">
                        <h5>{fullName}</h5>
                        <p className="mb-1">{email}</p>
                        <p className="mb-0">Id no: #{idx}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <h4 className="card-title mb-4">Edit Profile</h4>

          <Card>
            <CardBody>
              <Form
                className="form-horizontal"
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  return false;
                }}
              >
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">First Name</Label>
                      <Input
                        name="firstName"
                        type="text"
                        placeholder="Enter First Name"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.firstName || ""}
                        invalid={
                          validation.touched.firstName &&
                          !!validation.errors.firstName
                        }
                      />
                      {validation.touched.firstName &&
                      validation.errors.firstName ? (
                        <FormFeedback type="invalid">
                          {validation.errors.firstName}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">Last Name</Label>
                      <Input
                        name="lastName"
                        type="text"
                        placeholder="Enter Last Name"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.lastName || ""}
                        invalid={
                          validation.touched.lastName &&
                          !!validation.errors.lastName
                        }
                      />
                      {validation.touched.lastName &&
                      validation.errors.lastName ? (
                        <FormFeedback type="invalid">
                          {validation.errors.lastName}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">Email</Label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Enter Email"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.email || ""}
                        invalid={
                          validation.touched.email &&
                          !!validation.errors.email
                        }
                      />
                      {validation.touched.email &&
                      validation.errors.email ? (
                        <FormFeedback type="invalid">
                          {validation.errors.email}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">Phone Number</Label>
                      <Input
                        name="phoneNumber"
                        type="text"
                        placeholder="Enter Phone Number"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.phoneNumber || ""}
                        invalid={
                          validation.touched.phoneNumber &&
                          !!validation.errors.phoneNumber
                        }
                      />
                      {validation.touched.phoneNumber &&
                      validation.errors.phoneNumber ? (
                        <FormFeedback type="invalid">
                          {validation.errors.phoneNumber}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">Department ID</Label>
                      <Input
                        name="departmentId"
                        type="text"
                        placeholder="Enter Department ID"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.departmentId || ""}
                        invalid={
                          validation.touched.departmentId &&
                          !!validation.errors.departmentId
                        }
                      />
                      {validation.touched.departmentId &&
                      validation.errors.departmentId ? (
                        <FormFeedback type="invalid">
                          {validation.errors.departmentId}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="mb-3">
                      <Label className="form-label">User ID</Label>
                      <Input
                        name="idx"
                        type="text"
                        disabled
                        value={validation.values.idx || ""}
                      />
                      <Input
                        name="idx"
                        type="hidden"
                        value={validation.values.idx || ""}
                        onChange={validation.handleChange}
                      />
                    </div>
                  </Col>
                </Row>

                {/* <div className="text-center mt-4">
                  <Button type="submit" color="danger">
                    Update Profile
                  </Button>
                </div> */}
              </Form>
            </CardBody>
          </Card>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(UserProfile);
