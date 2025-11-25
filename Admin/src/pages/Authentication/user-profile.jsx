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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

import withRouter from "../../components/Common/withRouter";
import Breadcrumb from "../../components/Common/Breadcrumb";

import avatar from "../../assets/images/users/avatar-1.jpg";
import Dropzone from "react-dropzone";
import { usePermissions } from "../../helpers/usePermissions";

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

  const { modules } = usePermissions();

  const [idx, setIdx] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const canManageCategories =
    modules && Array.isArray(modules)
      ? modules.some(
          (m) =>
            m.MODULE_CODE === "DOCUMENT_CATEGORIES" &&
            (m.CAN_CREATE || m.CAN_EDIT || m.CAN_VIEW)
        )
      : false;

  const fetchDocuments = async (userId) => {
    // FRONTEND-ONLY: no backend call yet
    setDocumentsLoading(false);
    setDocumentsError(null);
    // Keep whatever is already in `documents`; do not fetch from server.
  };

  const fetchCategories = async () => {
    // FRONTEND-ONLY: no backend call yet
    setCategoriesLoading(false);
    setCategoriesError(null);
    // Leave categories as-is; backend will populate in the future.
  };

  const handleOpenDocumentDialog = () => {
    setUploadFile(null);
    setSelectedCategoryId("");
    setUploadError(null);
    setIsDocumentDialogOpen(true);
    fetchCategories();
  };

  const handleCloseDocumentDialog = () => {
    if (uploadLoading) return;
    setIsDocumentDialogOpen(false);
  };

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setUploadFile(acceptedFiles[0]);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !selectedCategoryId) {
      setUploadError("Please select a category and choose a file.");
      return;
    }

    try {
      setUploadLoading(true);
      setUploadError(null);

      // FRONTEND-ONLY: create a fake document object in memory
      const newDoc = {
        id: Date.now(),
        file_name: uploadFile.name,
        category_id: selectedCategoryId,
        created_at: new Date().toISOString(),
        // Optional local preview URL (not used for backend)
        url: URL.createObjectURL(uploadFile),
      };

      setDocuments((prev) => [...prev, newDoc]);

      setIsDocumentDialogOpen(false);
      setUploadFile(null);
      setSelectedCategoryId("");
    } catch (e) {
      console.error(e);
      setUploadError(e.message || "Failed to upload document");
    } finally {
      setUploadLoading(false);
    }
  };
  useEffect(() => {
    if (!idx) return;
    fetchDocuments(idx);
  }, [idx]);

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

          <h4 className="card-title mb-4">Documents</h4>

          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">User Documents</h5>
                <Button color="primary" onClick={handleOpenDocumentDialog}>
                  Add New Document
                </Button>
              </div>

              {documentsError && (
                <Alert color="danger" fade={false}>
                  {documentsError}
                </Alert>
              )}

              {documentsLoading ? (
                <p>Loading documents...</p>
              ) : (
                <>
                  {documents && documents.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead>
                          <tr>
                            <th>File Name</th>
                            <th>Category</th>
                            <th>Created</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => {
                            const category =
                              categories && Array.isArray(categories)
                                ? categories.find(
                                    (c) =>
                                      c.id === doc.category_id ||
                                      c.ID === doc.category_id
                                  )
                                : null;

                            const categoryName =
                              (category && (category.name || category.NAME)) ||
                              doc.category_name ||
                              "-";

                            const createdRaw =
                              doc.created_at || doc.createdAt || doc.CREATED_AT;
                            const createdFormatted = createdRaw
                              ? new Date(createdRaw).toLocaleDateString()
                              : "-";

                            const fileUrl =
                              doc.url || doc.file_url || doc.FILE_URL || doc.link;

                            const fileName =
                              doc.file_name ||
                              doc.filename ||
                              doc.name ||
                              doc.FILE_NAME ||
                              "Document";

                            return (
                              <tr key={doc.id || doc.ID || fileName}>
                                <td>{fileName}</td>
                                <td>{categoryName}</td>
                                <td>{createdFormatted}</td>
                                <td>
                                  {fileUrl ? (
                                    <Button
                                      color="link"
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          fileUrl,
                                          "_blank",
                                          "noopener,noreferrer"
                                        )
                                      }
                                    >
                                      View
                                    </Button>
                                  ) : (
                                    <span className="text-muted">No file</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted mb-0">No documents uploaded yet.</p>
                  )}
                </>
              )}

              {categoriesError && (
                <Alert color="danger" fade={false}>
                  {categoriesError}
                </Alert>
              )}
              {categoriesLoading && <p>Loading categories...</p>}
            </CardBody>
          </Card>

          <Modal isOpen={isDocumentDialogOpen} toggle={handleCloseDocumentDialog}>
            <ModalHeader toggle={handleCloseDocumentDialog}>
              Add New Document
            </ModalHeader>
            <ModalBody>
              {categoriesError && (
                <Alert color="danger" fade={false}>
                  {categoriesError}
                </Alert>
              )}

              <div className="mb-3 d-flex align-items-center">
                <div className="flex-grow-1">
                  <Label className="form-label">Category</Label>
                  <Input
                    type="select"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat.ID} value={cat.id || cat.ID}>
                        {cat.name || cat.NAME}
                      </option>
                    ))}
                  </Input>
                </div>
                {canManageCategories && (
                  <Button
                    color="link"
                    className="ms-2 mt-4"
                    onClick={() => {
                      window.location.href = "/admin/document-categories";
                    }}
                  >
                    Manage Categories
                  </Button>
                )}
              </div>

              {categoriesLoading && <p>Loading categories...</p>}

              <div className="mb-3">
                <Label className="form-label">File</Label>
                <Dropzone onDrop={handleDrop} multiple={false}>
                  {({ getRootProps, getInputProps }) => (
                    <div className="dropzone">
                      <div className="dz-message needsclick" {...getRootProps()}>
                        <input {...getInputProps()} />
                        {!uploadFile ? (
                          <>
                            <div className="mb-3">
                              <i className="display-4 text-muted bx bx-cloud-upload"></i>
                            </div>
                            <h4>Drop file here or click to upload.</h4>
                          </>
                        ) : (
                          <div>
                            <p className="mb-1">{uploadFile.name}</p>
                            <p className="text-muted mb-0">
                              {Math.round(uploadFile.size / 1024)} KB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Dropzone>
              </div>

              {uploadError && (
                <Alert color="danger" fade={false}>
                  {uploadError}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="secondary"
                onClick={handleCloseDocumentDialog}
                disabled={uploadLoading}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onClick={handleUploadDocument}
                disabled={uploadLoading}
              >
                {uploadLoading ? "Uploading..." : "Submit"}
              </Button>
            </ModalFooter>
          </Modal>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(UserProfile);
