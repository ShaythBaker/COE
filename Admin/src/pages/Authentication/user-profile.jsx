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

import {
  uploadAttachmentApi,
  getListByKey,
  getUserAttachmentsApi,
  getAttachmentUrlApi,
} from "../../helpers/fakebackend_helper";

const UserProfile = () => {
  const getCategoryId = (cat) => cat?.id || cat?.ID || cat?.LIST_ITEM_ID;
  const getCategoryName = (cat) => cat?.name || cat?.NAME || cat?.ITEM_NAME;

  const [viewingDocId, setViewingDocId] = useState(null);
  const [viewError, setViewError] = useState(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState(null);

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
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);

      // GET /api/attachments?FILE_CATEGORY=USER_DOCUMENTS&USER_ID={userId}
      const response = await getUserAttachmentsApi("USER_DOCUMENTS", userId);

      const items = Array.isArray(response) ? response : [];

      const normalized = items.map((item) => ({
        ...item,
        id: item.FILE_ID ?? item.id,
        file_name: item.FILE_NAME ?? item.file_name,
        created_at: item.CREATED_ON ?? item.CREATED_AT ?? item.created_at,
        category_name: item.FILE_CATEGORY ?? item.category_name,
        file_description: item.FILE_DESCRIPTION ?? item.file_description,
      }));

      setDocuments(normalized);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load documents";
      setDocumentsError(msg);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      // GET /api/lists/by-key/USER_DOCUMENTS
      const response = await getListByKey("USER_DOCUMENTS");

      // response shape:
      // { LIST: {...}, ITEMS: [ { LIST_ITEM_ID, ITEM_NAME, ... }, ... ] }
      const items = (response && response.ITEMS) || [];
      setCategories(items);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load document types";
      setCategoriesError(msg);
    } finally {
      setCategoriesLoading(false);
    }
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

  const handleViewDocument = async (doc) => {
    const fileId = doc.FILE_ID || doc.id || doc.ID;

    if (!fileId) {
      setViewError("Missing file identifier");
      return;
    }

    try {
      setViewingDocId(fileId);
      setViewError(null);

      // Call backend: GET /api/attachments/{FILE_ID}/url
      const res = await getAttachmentUrlApi(fileId);

      const viewUrl = res?.url || res?.URL || res?.FILE_URL || res?.file_url;
      const expiresIn = res?.expiresIn || 300; // default 300 seconds

      if (!viewUrl) {
        setViewError("File URL is not available.");
        return;
      }

      // Store data and open confirmation modal
      setViewModalData({
        doc,
        url: viewUrl,
        expiresIn,
      });
      setViewModalOpen(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || e?.message || "Failed to open document";
      setViewError(msg);
    } finally {
      setViewingDocId(null);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewModalData(null);
    setViewError(null);
  };

  const handleOpenViewInPopup = () => {
    if (!viewModalData?.url) {
      setViewError("File URL is not available.");
      return;
    }

    const popup = window.open(
      "",
      "DocumentPreview",
      "width=900,height=700,resizable=yes,scrollbars=yes"
    );

    if (!popup) {
      setViewError(
        "Popup blocked! Please allow popups for this site to view attachments."
      );
      return;
    }

    popup.location.href = viewModalData.url;

    // Close modal once we trigger the popup
    setViewModalOpen(false);
    setViewModalData(null);
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

      // find selected category object
      const selectedCat = categories.find(
        (c) => String(getCategoryId(c)) === String(selectedCategoryId)
      );

      const fileDescription = selectedCat ? getCategoryName(selectedCat) : "";

      const formData = new FormData();
      formData.append("USER_ID", idx);
      formData.append("FILE_CATEGORY", "USER_DOCUMENTS"); // keep as is
      formData.append("FILE_NAME", uploadFile.name);
      formData.append("FILE_DESCRIPTION", fileDescription); // 👈 new
      formData.append("file", uploadFile);

      await uploadAttachmentApi(formData);

      // refresh list from API
      await fetchDocuments(idx);

      setIsDocumentDialogOpen(false);
      setUploadFile(null);
      setSelectedCategoryId("");
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || e?.message || "Failed to upload document";
      setUploadError(msg);
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
      setDepartmentId(u.COMPANY_ID || u.COMPANY_ID || "");
      setIdx(u.USER_ID || u.uid || 1);
    }

    const timeoutId = setTimeout(() => {
      dispatch(resetProfileFlag());
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [dispatch, success]);

  const fullName =
    firstName || lastName
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
                          validation.touched.email && !!validation.errors.email
                        }
                      />
                      {validation.touched.email && validation.errors.email ? (
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
                      <Label className="form-label">Company ID</Label>
                      <Input
                        name="departmentId"
                        type="text"
                        placeholder="Enter Cpmpany ID"
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

              {viewError && (
                <Alert color="danger" fade={false}>
                  {viewError}
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
                            <th>Type</th>
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
                                      String(getCategoryId(c)) ===
                                      String(doc.category_id)
                                  )
                                : null;

                            const categoryName =
                              doc.category_name ||
                              doc.FILE_CATEGORY ||
                              (category && getCategoryName(category)) ||
                              "-";

                            // 👇 New typeName: prefer FILE_DESCRIPTION, fallback to old categoryName
                            const typeName =
                              doc.file_description ||
                              doc.FILE_DESCRIPTION ||
                              categoryName;

                            const createdRaw =
                              doc.created_at ||
                              doc.createdAt ||
                              doc.CREATED_AT ||
                              doc.CREATED_ON;

                            const createdFormatted = createdRaw
                              ? new Date(createdRaw).toLocaleDateString()
                              : "-";

                            const fileName =
                              doc.file_name ||
                              doc.filename ||
                              doc.name ||
                              doc.FILE_NAME ||
                              "Document";

                            const docKey =
                              doc.id || doc.ID || doc.FILE_ID || fileName;
                            const isOpening =
                              viewingDocId ===
                              (doc.FILE_ID || doc.id || doc.ID);

                            return (
                              <tr key={docKey}>
                                <td>{fileName}</td>
                                <td>{typeName}</td>
                                <td>{createdFormatted}</td>
                                <td>
                                  <Button
                                    color="link"
                                    size="sm"
                                    onClick={() => handleViewDocument(doc)}
                                    disabled={isOpening}
                                  >
                                    {isOpening ? "Opening..." : "View"}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted mb-0">
                      No documents uploaded yet.
                    </p>
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

          {/* View Document Confirmation Modal */}
          <Modal isOpen={viewModalOpen} toggle={handleCloseViewModal}>
            <ModalHeader toggle={handleCloseViewModal}>
              View Document
            </ModalHeader>
            <ModalBody>
              <p className="mb-2">
                You are about to open the following document:
              </p>
              <p>
                <strong>
                  {viewModalData?.doc?.FILE_NAME ||
                    viewModalData?.doc?.file_name ||
                    "Document"}
                </strong>
              </p>

              <p className="mb-2">
                For security reasons, this file link will expire in{" "}
                <strong>{viewModalData?.expiresIn ?? 300} seconds</strong>.
              </p>

              <p className="text-muted mb-0">
                After it expires, you will need to click "View" again to request
                a new secure link.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={handleCloseViewModal}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleOpenViewInPopup}>
                Open Document
              </Button>
            </ModalFooter>
          </Modal>

          <Modal
            isOpen={isDocumentDialogOpen}
            toggle={handleCloseDocumentDialog}
          >
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
                    {categories.map((cat) => {
                      const id = getCategoryId(cat);
                      const name = getCategoryName(cat);
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
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
                      <div
                        className="dz-message needsclick"
                        {...getRootProps()}
                      >
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
