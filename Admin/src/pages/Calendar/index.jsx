// src/pages/Calendar/Calender.jsx  (path as in your project)
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { isEmpty } from "lodash";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";

import Breadcrumbs from "/src/components/Common/Breadcrumb";

import {
  addNewEvent as onAddNewEvent,
  deleteEvent as onDeleteEvent,
  getCategories as onGetCategories,
  getEvents as onGetEvents,
  updateEvent as onUpdateEvent,
} from "/src/store/actions";

import DeleteModal from "./DeleteModal";
import verification from "../../assets/images/verification-img.png";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import BootstrapTheme from "@fullcalendar/bootstrap";
import listPlugin from "@fullcalendar/list";
import allLocales from "@fullcalendar/core/locales-all";

// PERMISSION GUARD
import RequireModule from "../../components/Auth/RequireModule";

const CalenderInner = (props) => {
  document.title = "Full Calendar | Travco - COE - ";

  const dispatch = useDispatch();

  const [event, setEvent] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  const CalendarProperties = createSelector(
    (state) => state.calendar,
    (Calendar) => ({
      events: Calendar.events,
      categories: Calendar.categories,
    })
  );

  const { events, categories } = useSelector(CalendarProperties);

  const [deleteId, setDeleteId] = useState();
  const [deleteModal, setDeleteModal] = useState(false);
  const [modalCategory, setModalCategory] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  const categoryValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: (event && event.title) || "",
      category: (event && event.category) || "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Please Enter Your Event Name"),
      category: Yup.string().required("Please Enter Your Billing Name"),
    }),
    onSubmit: (values) => {
      if (isEdit) {
        const updateEvent = {
          id: event.id,
          title: values.title,
          classNames: values.category + " text-white",
          start: event.start,
        };
        dispatch(onUpdateEvent(updateEvent));
        categoryValidation.resetForm();
      } else {
        const newEvent = {
          id: Math.floor(Math.random() * 100),
          title: values.title,
          start: selectedDay ? selectedDay.date : new Date(),
          className: values.category
            ? values.category + " text-white"
            : "bg-primary text-white",
        };
        dispatch(onAddNewEvent(newEvent));
        categoryValidation.resetForm();
      }
      toggle();
    },
  });

  useEffect(() => {
    dispatch(onGetCategories());
    dispatch(onGetEvents());
    new Draggable(document.getElementById("external-events"), {
      itemSelector: ".external-event",
    });
  }, [dispatch]);

  useEffect(() => {
    if (!modalCategory && !isEmpty(event) && !!isEdit) {
      setTimeout(() => {
        setEvent({});
        setIsEdit(false);
      }, 500);
    }
  }, [modalCategory, event, isEdit]);

  const toggle = () => {
    if (modalCategory) {
      setModalCategory(false);
      setEvent(null);
      setIsEdit(false);
    } else {
      setModalCategory(true);
    }
  };

  const handleDateClick = (arg) => {
    const date = arg.date;
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const current = new Date();
    const modifiedDate = new Date(
      year,
      month,
      day,
      current.getHours(),
      current.getMinutes(),
      current.getSeconds()
    );

    const modifiedData = { ...arg, date: modifiedDate };

    setSelectedDay(modifiedData);
    toggle();
  };

  const handleEventClick = (arg) => {
    const event = arg.event;
    setEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      className: event.classNames,
      category: event.classNames[0],
      event_category: event.classNames[0],
    });
    setDeleteId(event.id);
    setIsEdit(true);
    setModalCategory(true);
    toggle();
  };

  const handleDeleteEvent = () => {
    if (deleteId) {
      dispatch(onDeleteEvent(deleteId));
    }
    setDeleteModal(false);
  };

  const onDrag = (event) => {
    event.preventDefault();
  };

  const onDrop = (event) => {
    const date = event.date;
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const current = new Date();
    const modifiedDate = new Date(
      year,
      month,
      day,
      current.getHours(),
      current.getMinutes(),
      current.getSeconds()
    );

    const draggedEl = event.draggedEl;
    const draggedElclass = draggedEl.className;

    if (
      draggedEl.classList.contains("external-event") &&
      draggedElclass.indexOf("fc-event-draggable") === -1
    ) {
      const modifiedData = {
        id: Math.floor(Math.random() * 100),
        title: draggedEl.innerText,
        start: modifiedDate,
        className: draggedEl.className,
      };
      dispatch(onAddNewEvent(modifiedData));
    }
  };

  const enLocal = {
    code: "en-nz",
    week: { dow: 1, doy: 4 },
    buttonHints: {
      prev: "Previous $0",
      next: "Next $0",
      today: "This $0",
    },
    viewHint: "$0 view",
    navLinkHint: "Go to $0",
  };
  const [isLocal, setIsLocal] = useState(enLocal);
  const handleChangeLocals = (value) => setIsLocal(value);

  return (
    <>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteEvent}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Calendar" breadcrumbItem="Calendar" />
          <Row>
            <Col className="col-12">
              <Row>
                <Col xl={3}>
                  <Card>
                    <CardBody>
                      <div className="d-flex gap-2">
                        <div className="flex-grow-1">
                          <select
                            id="locale-selector"
                            className="form-select"
                            defaultValue={isLocal}
                            onChange={(event) => {
                              const selectedValue = event.target.value;
                              const selectedLocale = allLocales.find(
                                (locale) => locale.code === selectedValue
                              );
                              handleChangeLocals(selectedLocale);
                            }}
                          >
                            {(allLocales || []).map((localeCode, key) => (
                              <option key={key} value={localeCode.code}>
                                {localeCode.code}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          color="primary"
                          className="font-16"
                          onClick={toggle}
                        >
                          <i className="mdi mdi-plus-circle-outline me-1" />
                          Create New Event
                        </Button>
                      </div>

                      <div id="external-events" className="mt-2">
                        <br />
                        <p className="text-muted">
                          Drag and drop your event or click in the calendar
                        </p>
                        {(categories || []).map((category) => (
                          <div
                            className={`${category.type} external-event fc-event text-white`}
                            key={"cat-" + category.id}
                            draggable
                            onDrag={(event) => onDrag(event, category)}
                          >
                            <i className="mdi mdi-checkbox-blank-circle font-size-11 me-2" />
                            {category.title}
                          </div>
                        ))}
                      </div>

                      <Row className="justify-content-center mt-5">
                        <img
                          src={verification}
                          alt=""
                          className="img-fluid d-block"
                        />
                      </Row>
                    </CardBody>
                  </Card>
                </Col>

                <Col className="col-xl-9">
                  <Card>
                    <CardBody>
                      <FullCalendar
                        plugins={[
                          BootstrapTheme,
                          dayGridPlugin,
                          listPlugin,
                          interactionPlugin,
                        ]}
                        initialView="dayGridMonth"
                        slotDuration={"00:15:00"}
                        handleWindowResize={true}
                        themeSystem="bootstrap"
                        locale={isLocal}
                        headerToolbar={{
                          left: "prev,next today",
                          center: "title",
                          right: "dayGridMonth,dayGridWeek,dayGridDay,listWeek",
                        }}
                        events={events}
                        editable={true}
                        droppable={true}
                        selectable={true}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        drop={onDrop}
                      />
                    </CardBody>
                  </Card>

                  <Modal
                    isOpen={modalCategory}
                    className={props.className}
                    centered
                  >
                    <ModalHeader toggle={toggle}>
                      {!!isEdit ? "Edit Event" : "Add Event"}
                    </ModalHeader>
                    <ModalBody className="p-4">
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          categoryValidation.handleSubmit();
                          return false;
                        }}
                      >
                        <Row>
                          <Col className="col-12">
                            <div className="mb-3">
                              <Label>Event Name</Label>
                              <Input
                                name="title"
                                type="text"
                                placeholder="Insert Event Name"
                                onChange={categoryValidation.handleChange}
                                onBlur={categoryValidation.handleBlur}
                                value={categoryValidation.values.title || ""}
                                invalid={
                                  categoryValidation.touched.title &&
                                  !!categoryValidation.errors.title
                                }
                              />
                              {categoryValidation.touched.title &&
                              categoryValidation.errors.title ? (
                                <FormFeedback type="invalid">
                                  {categoryValidation.errors.title}
                                </FormFeedback>
                              ) : null}
                            </div>
                          </Col>
                          <Col className="col-12">
                            <div className="mb-3">
                              <Label>Category</Label>
                              <Input
                                type="select"
                                name="category"
                                placeholder="All Day Event"
                                onChange={categoryValidation.handleChange}
                                onBlur={categoryValidation.handleBlur}
                                value={categoryValidation.values.category || ""}
                                invalid={
                                  categoryValidation.touched.category &&
                                  !!categoryValidation.errors.category
                                }
                              >
                                <option value="bg-danger">Danger</option>
                                <option value="bg-success">Success</option>
                                <option value="bg-primary">Primary</option>
                                <option value="bg-info">Info</option>
                                <option value="bg-dark">Dark</option>
                                <option value="bg-warning">Warning</option>
                              </Input>
                              {categoryValidation.touched.category &&
                              categoryValidation.errors.category ? (
                                <FormFeedback type="invalid">
                                  {categoryValidation.errors.category}
                                </FormFeedback>
                              ) : null}
                            </div>
                          </Col>
                        </Row>

                        <Row className="mt-2">
                          <Col className="col-6">
                            {isEdit && (
                              <button
                                type="button"
                                className="btn btn-danger"
                                id="btn-delete-event"
                                onClick={() => {
                                  toggle();
                                  setDeleteModal(true);
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </Col>

                          <Col className="col-6 text-end">
                            <button
                              type="button"
                              className="btn btn-light me-1"
                              onClick={toggle}
                            >
                              Close
                            </button>
                            <button
                              type="submit"
                              className="btn btn-success"
                              id="btn-save-event"
                            >
                              Save
                            </button>
                          </Col>
                        </Row>
                      </Form>
                    </ModalBody>
                  </Modal>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

CalenderInner.propTypes = {
  events: PropTypes.array,
  categories: PropTypes.array,
  className: PropTypes.string,
};

const Calender = (props) => (
  <RequireModule moduleCode="ACCESS_ROLES">
    <CalenderInner {...props} />
  </RequireModule>
);


export default Calender;
