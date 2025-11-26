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

  const toggleTab = (tab) => {
    if (tab >= 1 && tab <= 4) {
      setactiveTab(tab);
      if (!passedSteps.includes(tab)) {
        setpassedSteps([...passedSteps, tab]);
      }
    }
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
                            <span className="number">2.</span> Company Document
                          </NavLink>
                        </NavItem>

                        <NavItem className={classnames({ current: activeTab === 3 })}>
                          <NavLink
                            className={classnames({ active: activeTab === 3 })}
                            onClick={() => setactiveTab(3)}
                            disabled={!passedSteps.includes(3)}
                          >
                            <span className="number">3.</span> Bank Details
                          </NavLink>
                        </NavItem>

                        <NavItem className={classnames({ current: activeTab === 4 })}>
                          <NavLink
                            className={classnames({ active: activeTab === 4 })}
                            onClick={() => setactiveTab(4)}
                            disabled={!passedSteps.includes(4)}
                          >
                            <span className="number">4.</span> Confirm Detail
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
                            <Row>
                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>PAN Card</Label>
                                  <Input type="text" placeholder="Enter Your PAN No." />
                                </div>
                              </Col>

                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>VAT/TIN No.</Label>
                                  <Input type="text" placeholder="Enter Your VAT/TIN No." />
                                </div>
                              </Col>
                            </Row>

                            <Row>
                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>CST No.</Label>
                                  <Input type="text" placeholder="Enter Your CST No." />
                                </div>
                              </Col>

                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Service Tax No.</Label>
                                  <Input type="text" placeholder="Enter Your Service Tax No." />
                                </div>
                              </Col>
                            </Row>

                            <Row>
                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Company UIN</Label>
                                  <Input type="text" placeholder="Enter Your Company UIN" />
                                </div>
                              </Col>

                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Declaration</Label>
                                  <Input type="text" placeholder="Declaration Details" />
                                </div>
                              </Col>
                            </Row>
                          </Form>
                        </TabPane>

                        <TabPane tabId={3}>
                          <Form>
                            <Row>
                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Name on Card</Label>
                                  <Input type="text" placeholder="Enter Name on Card" />
                                </div>
                              </Col>

                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Credit Card Type</Label>
                                  <select className="form-select">
                                    <option>Select Card Type</option>
                                    <option value="AE">American Express</option>
                                    <option value="VI">Visa</option>
                                    <option value="MC">MasterCard</option>
                                    <option value="DI">Discover</option>
                                  </select>
                                </div>
                              </Col>
                            </Row>

                            <Row>
                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Credit Card Number</Label>
                                  <Input type="text" placeholder="Credit Card Number" />
                                </div>
                              </Col>

                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Card Verification Number</Label>
                                  <Input type="text" placeholder="Card Verification Number" />
                                </div>
                              </Col>
                            </Row>

                            <Row>
                              <Col lg="6">
                                <div className="mb-3">
                                  <Label>Expiration Date</Label>
                                  <Input type="text" placeholder="Card Expiration Date" />
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
                                <h5>Confirm Detail</h5>
                                <p className="text-muted">
                                  If several languages coalesce, the grammar of the resulting…
                                </p>
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

                        <li className={activeTab === 4 ? "next disabled" : "next"}>
                          <Link to="#" onClick={() => toggleTab(activeTab + 1)}>
                            Next
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