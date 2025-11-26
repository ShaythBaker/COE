import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Form,
  Input,
  Label,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import Dropzone from "react-dropzone";

import { Link } from "react-router-dom";
import classnames from "classnames";

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const Requests = () => {
  //meta title
  document.title = "HR Requests | Travco - COE";

  // Wizard states
  const [activeTab, setactiveTab] = useState(1);
  const [passedSteps, setpassedSteps] = useState([1]);
  const [requestTypeOpen, setRequestTypeOpen] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState("Select Request Type");

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [description, setdescription] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState("");

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setUploadFile(acceptedFiles[0]);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleUploadDocument = async () => {
    if (!uploadFile) {
      setUploadError("Please choose a file.");
      return;
    }

    try {
      setUploadLoading(true);
      setUploadError(null);

      const base64String = await fileToBase64(uploadFile);

      const newDoc = {
        id: Date.now(),
        file_name: uploadFile.name,
        created_at: new Date().toISOString(),
        base64: base64String,
      };

      setDocuments((prev) => [...prev, newDoc]);

      setUploadFile(null);
    } catch (e) {
      setUploadError(e.message || "Failed to upload document");
    } finally {
      setUploadLoading(false);
    }
  };

  const toggleTab = (tab) => {
    if (tab >= 1 && tab <= 4) {
      setactiveTab(tab);
      if (!passedSteps.includes(tab)) {
        setpassedSteps([...passedSteps, tab]);
      }
    }
  };

  const handleNextClick = async (e) => {
    e.preventDefault();

    if (activeTab === 2) {
      const hadFile = uploadFile !== null;
      await handleUploadDocument();
      if (hadFile) {
        toggleTab(activeTab + 1);
      }
      return;
    }

    if (activeTab === 4) {
      const payload = {
        requestType: selectedRequestType,
        documents,
        description,
      };

      console.log("Submitting HR request payload:", payload);

      setSubmissionMessage(JSON.stringify(payload, null, 2));
      return;
    }

    toggleTab(activeTab + 1);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid={true}>
          {/* Render Breadcrumbs */}
          <Breadcrumbs title="HR Request" breadcrumbItem="Request" />

          <Row>
            <Col lg="12">
              <Card>
                <CardBody>
                  <h4 className="card-title mb-4">Create Request to HR</h4>

                  <div className="wizard clearfix">
                    <div className="steps clearfix">
                      <ul>
                        <NavItem className={classnames({ current: activeTab === 1 })}>
                          <NavLink
                            className={classnames({ current: activeTab === 1 })}
                            onClick={() => setactiveTab(1)}
                            disabled={!passedSteps.includes(1)}
                          >
                            <span className="number">1.</span> Seller Details
                          </NavLink>
                        </NavItem>

                        <NavItem className={classnames({ current: activeTab === 2 })}>
                          <NavLink
                            className={classnames({ active: activeTab === 2 })}
                            onClick={() => setactiveTab(2)}
                            disabled={!passedSteps.includes(2)}
                          >
                            <span className="number">2.</span> Supporting Documents
                          </NavLink>
                        </NavItem>

                        <NavItem className={classnames({ current: activeTab === 3 })}>
                          <NavLink
                            className={classnames({ active: activeTab === 3 })}
                            onClick={() => setactiveTab(3)}
                            disabled={!passedSteps.includes(3)}
                          >
                            <span className="number">3.</span> Description of Request
                          </NavLink>
                        </NavItem>

                        <NavItem className={classnames({ current: activeTab === 4 })}>
                          <NavLink
                            className={classnames({ active: activeTab === 4 })}
                            onClick={() => setactiveTab(4)}
                            disabled={!passedSteps.includes(4)}
                          >
                            <span className="number">4.</span> Confirm Details
                          </NavLink>
                        </NavItem>
                      </ul>
                    </div>

                    <div className="content clearfix">
                      <TabContent activeTab={activeTab} className="body">
                        <TabPane tabId={1}>
                          <Form>
                            <Row>
                              
                            <Col sm={6}>
                              <div className="mb-3">
                                <Label>Type of Request</Label>

                                <Dropdown
                                  isOpen={requestTypeOpen}
                                  toggle={() => setRequestTypeOpen(!requestTypeOpen)}
                                >
                                  <DropdownToggle
                                    color="primary"
                                    className="w-100 text-start"
                                    caret
                                  >
                                    {selectedRequestType} <i className="mdi mdi-chevron-down float-end" />
                                  </DropdownToggle>

                                  <DropdownMenu className="w-100">
                                    <DropdownItem onClick={() => setSelectedRequestType("Leave Request")}>
                                      Leave Request
                                    </DropdownItem>

                                    <DropdownItem onClick={() => setSelectedRequestType("Salary Certificate")}>
                                      Salary Certificate
                                    </DropdownItem>

                                    <DropdownItem onClick={() => setSelectedRequestType("ID Replacement")}>
                                      ID Replacement
                                    </DropdownItem>

                                    <DropdownItem onClick={() => setSelectedRequestType("Bank Letter")}>
                                      Bank Letter
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            </Col>
                            </Row>
                          </Form>
                        </TabPane>

                        <TabPane tabId={2}>
                          <Form>
                            <div className="mb-3">
                              <Label className="form-label">Upload Supporting Documents</Label>
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
                          </Form>
                        </TabPane>

                        <TabPane tabId={3}>
                          <Form>
                            <Row>
                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Description of Request</Label>
                                  <Input
                                    type="textarea"
                                    placeholder="Description of Request"
                                    value={description}
                                    onChange={(e) => setdescription(e.target.value)}
                                  />
                                </div>
                              </Col>
                            </Row>
                          </Form>
                        </TabPane>

                        <TabPane tabId={4}>
                          <div className="row justify-content-center">
                            <Col lg="6">
                              <div className="text-center">
                                <div className="mb-4">
                                  <i className="mdi mdi-check-circle-outline text-success display-4" />
                                </div>
                                <h5>Confirm Details</h5>
                                <p className="text-muted">
                                  If you are sure about the information provided, please click Submit to send your request to HR.
                                </p>
                                {submissionMessage && (
                                  <div className="alert alert-info mt-3 text-start">
                                    <h6 className="mb-2">Payload to send to backend:</h6>
                                    <pre
                                      className="mb-0"
                                      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                    >
                                      {submissionMessage}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </Col>
                          </div>
                        </TabPane>
                      </TabContent>
                    </div>

                    <div className="actions clearfix">
                      <ul>
                        <li className={activeTab === 1 ? "previous disabled" : "previous"}>
                          <Link to="#" onClick={() => toggleTab(activeTab - 1)}>
                            Previous
                          </Link>
                        </li>

                        <li className="next">
                          <Link to="#" onClick={handleNextClick}>
                            {activeTab === 4 ? "Submit" : "Next"}
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Requests;