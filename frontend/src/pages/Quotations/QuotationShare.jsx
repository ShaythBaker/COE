import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  Button,
  Form,
  Label,
  Input,
  InputGroup,
  InputGroupText,
  Badge,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useNavigate, useParams } from "react-router-dom";

import { Editor } from "@tinymce/tinymce-react";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";

import {
  getQoutationDetails,
  clearQoutationsMessages,
} from "/src/store/quotations/actions";

import { getAttachmentUrl } from "/src/helpers/attachments_helper";

const HEADER_IMG_URL = "/images/quotation-header.png"; 
const TITLE_RED = "#d60000";

const EMPTY_STATE = {};

const quotationsSelector = createSelector(
  (state) => state?.Quotations || state?.quotations || EMPTY_STATE,
  (q) => ({
    details: q?.details || null,
    loadingDetails: q?.loadingDetails || false,
    error: q?.error || null,
  }),
);

const money = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(2);
};

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
};

const applyProfitToCosts = (details, profitType, profitValue) => {
  if (!details) return details;

  const type = profitType;
  const val = safeNum(profitValue);

  const multiplier = type === "percentage" ? 1 + val / 100 : 1;
  const fixedAdd = type === "fixed" ? val : 0;

  const clone = JSON.parse(JSON.stringify(details));
  const costs = clone.COSTS || null;
  if (!costs) return clone;

  const mul = (x) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return x;
    return n * multiplier;
  };

  if (costs.PER_PERSON) {
    Object.keys(costs.PER_PERSON).forEach((k) => {
      costs.PER_PERSON[k] = mul(costs.PER_PERSON[k]);
    });
  }

  if (costs.TOTAL && typeof costs.TOTAL === "object") {
    Object.keys(costs.TOTAL).forEach((k) => {
      costs.TOTAL[k] = mul(costs.TOTAL[k]);
    });
  }

  if (Array.isArray(costs.OPTIONS)) {
    costs.OPTIONS = costs.OPTIONS.map((o) => {
      const next = { ...o };
      Object.keys(next).forEach((k) => {
        const num = Number(next[k]);
        if (Number.isFinite(num)) next[k] = num * multiplier;
      });
      return next;
    });
  }

  if (fixedAdd) {
    if (costs.GRAND_TOTAL !== undefined) {
      costs.GRAND_TOTAL = safeNum(costs.GRAND_TOTAL) + fixedAdd;
    } else if (costs.TOTAL?.TOTAL !== undefined) {
      costs.TOTAL.TOTAL = safeNum(costs.TOTAL.TOTAL) + fixedAdd;
    } else if (typeof costs.TOTAL === "number") {
      costs.TOTAL = safeNum(costs.TOTAL) + fixedAdd;
    }
  }

  clone.COSTS = costs;
  return clone;
};

/**
 * Build template including places images + descriptions.
 * imgUrls: { [attachmentId]: url }
 */
const buildHtmlTemplate = ({ details, profitType, profitValue, imgUrls }) => {
  const q = details?.QOUTATION || {};
  const routes = details?.ROUTES || [];
  const costs = details?.COSTS || {};
  const options = costs?.OPTIONS || [];
  const extraServices = details?.EXTRA_SERVICES || [];

  const stayOptionsRaw =
    details?.STAY_OPTIONS ||
    details?.STAYS_OPTIONS ||
    details?.STAYOPTIONS ||
    details?.ACCOMMODATION_OPTIONS ||
    [];
  const stayOptions = Array.isArray(stayOptionsRaw) ? stayOptionsRaw : [];

  // Map OPTION_ID -> OPTION_NAME (fallbacks included)
  const optionNameById = {};
  options.forEach((o) => {
    const id = o?.OPTION_ID ?? o?.OptionId ?? o?.option_id;
    if (id === null || id === undefined || id === "") return;
    const name =
      o?.OPTION_NAME ||
      o?.NAME ||
      o?.OptionName ||
      o?.option_name ||
      `Option ${id}`;
    optionNameById[String(id)] = name;
  });

  // Group STAY_OPTIONS by OPTION_ID
  const staysByOptionId = stayOptions.reduce((acc, rec) => {
    const id =
      rec?.OPTION_ID ??
      rec?.OptionId ??
      rec?.option_id ??
      rec?.STAY_OPTION_ID ??
      rec?.stay_option_id;
    if (id === null || id === undefined || id === "") return acc;
    const key = String(id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(rec);
    // also try to capture option name from record if not in costs.OPTIONS
    const recName =
      rec?.OPTION_NAME ||
      rec?.OptionName ||
      rec?.option_name ||
      rec?.STAY_OPTION_NAME ||
      rec?.stay_option_name;
    if (recName && !optionNameById[key]) optionNameById[key] = recName;
    return acc;
  }, {});

  const optionIdsFromStays = Object.keys(staysByOptionId);

  const renderStayRows = (records) =>
    records
      .map((r) => {
        const hotelName =
          r?.HOTEL_NAME || r?.HotelName || r?.hotel_name || "-";
        const areaName =
          r?.HOTEL_AREA_NAME ||
          r?.AREA_NAME ||
          r?.HotelAreaName ||
          r?.hotel_area_name ||
          "-";
        const stars =
          r?.HOTEL_STARS ?? r?.STARS ?? r?.hotel_stars ?? r?.stars ?? "-";
        const chain =
          r?.HOTEL_CHAIN_NAME ||
          r?.CHAIN_NAME ||
          r?.hotel_chain_name ||
          "-";
        const nights = r?.NIGHTS ?? r?.nights ?? "-";

        return `<tr>
          <td style="border:1px solid #ddd; padding:6px 8px;">${hotelName}</td>
          <td style="border:1px solid #ddd; padding:6px 8px;">${areaName}</td>
          <td style="border:1px solid #ddd; padding:6px 8px; text-align:center;">${stars}</td>
          <td style="border:1px solid #ddd; padding:6px 8px;">${chain}</td>
          <td style="border:1px solid #ddd; padding:6px 8px; text-align:center;">${nights}</td>
        </tr>`;
      })
      .join("");

  const staysOptionsTables = optionIdsFromStays
    .map((optId) => {
      const records = staysByOptionId[optId] || [];
      const optName = optionNameById[optId] || `Option ${optId}`;
      const rows = renderStayRows(records);
      if (!rows) return "";
      return `
        <div style="margin-top:14px;">
          <div style="font-size:12px; font-weight:700; margin-bottom:6px;">
            OPTION_NAME: ${optName} &nbsp; | &nbsp; OPTION_ID: ${optId}
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr>
                <th style="border:1px solid #ddd; padding:6px 8px; text-align:left; background:#f6f6f6;">HOTEL_NAME</th>
                <th style="border:1px solid #ddd; padding:6px 8px; text-align:left; background:#f6f6f6;">HOTEL_AREA_NAME</th>
                <th style="border:1px solid #ddd; padding:6px 8px; text-align:center; background:#f6f6f6;">HOTEL_STARS</th>
                <th style="border:1px solid #ddd; padding:6px 8px; text-align:left; background:#f6f6f6;">HOTEL_CHAIN_NAME</th>
                <th style="border:1px solid #ddd; padding:6px 8px; text-align:center; background:#f6f6f6;">NIGHTS</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    })
    .join("");

  const calcBase = (r) =>
    safeNum(r?.RATE_AMOUNT ?? r?.rate_amount) *
    safeNum(r?.GUESTS ?? r?.guests ?? q?.QOUTATION_TOTAL_PAX) *
    safeNum(r?.NIGHTS ?? r?.nights);

  const optionsCostRowsFromStays = optionIdsFromStays
    .map((optId) => {
      const records = staysByOptionId[optId] || [];
      const optName = optionNameById[optId] || `Option ${optId}`;
      const total = records.reduce((sum, r) => sum + calcBase(r), 0);
      return `<tr>
        <td style="border:1px solid #ddd; padding:6px 8px;">${optName}</td>
        <td style="border:1px solid #ddd; padding:6px 8px; text-align:center;">${optId}</td>
        <td style="border:1px solid #ddd; padding:6px 8px; text-align:right; font-weight:700;">${money(
          total,
        )}</td>
      </tr>`;
    })
    .join("");

  const supplementsRowsFromStays = optionIdsFromStays
    .map((optId) => {
      const records = staysByOptionId[optId] || [];
      const optName = optionNameById[optId] || `Option ${optId}`;

      const totals = records.reduce(
        (acc, r) => {
          const base = calcBase(r);
          acc.half += base + safeNum(r?.RATE_HALF_BOARD_AMOUNT ?? r?.rate_half_board_amount);
          acc.full += base + safeNum(r?.RATE_FULL_BOARD_AMOUNT ?? r?.rate_full_board_amount);
          acc.single += base + safeNum(
            r?.RATE_SINGLE_SPPLIMENT_AMOUNT ??
              r?.RATE_SINGLE_SUPPLIMENT_AMOUNT ??
              r?.rate_single_sppliment_amount ??
              r?.rate_single_suppliment_amount,
          );
          return acc;
        },
        { half: 0, full: 0, single: 0 },
      );

      return `<tr>
        <td style="border:1px solid #ddd; padding:6px 8px;">${optName}</td>
        <td style="border:1px solid #ddd; padding:6px 8px; text-align:center;">${optId}</td>
        <td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          totals.half,
        )}</td>
        <td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          totals.full,
        )}</td>
        <td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          totals.single,
        )}</td>
      </tr>`;
    })
    .join("");

  const profitLabel =
    profitType === "percentage"
      ? `Profit: ${safeNum(profitValue)}%`
      : profitType === "fixed"
        ? `Profit: ${money(safeNum(profitValue))} (fixed)`
        : "Profit: -";

  const today = new Date().toISOString().slice(0, 10);

  const perPerson = costs?.PER_PERSON || {};
  const grandTotal =
    costs?.GRAND_TOTAL ?? costs?.TOTAL?.TOTAL ?? costs?.TOTAL ?? "";

  const optionsRows = options
    .map((o) => {
      const name =
        o?.OPTION_NAME ||
        o?.NAME ||
        o?.OptionName ||
        o?.option_name ||
        `Option ${o?.OPTION_ID || ""}`;
      const total =
        o?.TOTAL ||
        o?.TOTAL_COST ||
        o?.TOTAL_PRICE ||
        o?.TOTAL_AMOUNT ||
        o?.total ||
        "";
      return `<tr><td>${name}</td><td style="text-align:right;">${money(
        total,
      )}</td></tr>`;
    })
    .join("");

  const extraRows = extraServices
    .map((s) => {
      const name = s?.EXTRA_SERVICE_NAME || s?.SERVICE_NAME || "-";
      const rate = money(s?.EXTRA_SERVICE_RATE_PP || s?.RATE_PP || s?.RATE);
      return `<tr><td>${name}</td><td style="text-align:right;">${rate}</td></tr>`;
    })
    .join("");

  const placeCard = (place) => {
    const placeName =
      place?.PLACE_NAME || place?.PLACE_DETAILS?.PLACE_NAME || "-";
    const desc =
      place?.PLACE_DETAILS?.PLACE_DESCRIPTION ||
      place?.PLACE_DESCRIPTION ||
      place?.DESCRIPTION ||
      "";

    const attId =
      place?.PLACE_IMAGE?.PLACE_IMAGE_ATTACHMENT_ID ||
      place?.PLACE_IMAGE?.place_image_attachment_id;

    const url = attId ? imgUrls?.[String(attId)] : null;

    return `
      <div style="display:flex; gap:12px; border:1px solid #eee; border-radius:10px; padding:10px; margin:10px 0;">
        <div style="width:160px; flex:0 0 160px;">
          ${
            url
              ? `<img data-place-img="1" src="${url}" alt="${placeName}" style="width:160px; height:105px; object-fit:cover; border-radius:8px; border:1px solid #eee;" />`
              : `<div style="width:160px; height:105px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px dashed #ccc; color:#888; font-size:11px;">No Image</div>`
          }
        </div>
        <div style="flex:1;">
          <div style="font-size:13px; font-weight:700; margin-bottom:4px;">${placeName}</div>
          <div style="font-size:12px; color:#333; white-space:pre-wrap;">${desc || "-"}</div>
        </div>
      </div>
    `;
  };

  const programHtml = routes
    .map((r, idx) => {
      const dayTitle = r?.ROUTE_NAME || `Day ${idx + 1}`;
      const dateText = r?.ROUTE_DATE ? ` (${formatDate(r.ROUTE_DATE)})` : "";

      const placesHtml = (r?.PLACES || []).map(placeCard).join("");

      const meals = (r?.MEALS || [])
        .map((m) => {
          const rest = m?.RESTUARANT_NAME || "-";
          const type = m?.RESTAURANT_MEAL_TYPE_NAME || "-";
          const rate = money(m?.RESTAURANT_MEAL_RATE_PP);
          const desc = m?.RESTAURANT_MEAL_DESCRIPTION || "";
          return `<li><b>${rest}</b> — ${type} (Rate/Person: ${rate})${
            desc ? ` — ${desc}` : ""
          }</li>`;
        })
        .join("");

      return `
        <div style="margin-top:16px;">
          <h4 style="margin:0 0 8px; font-size:14px; color:${TITLE_RED};">${dayTitle}${dateText}</h4>
          ${placesHtml || `<div style="font-size:12px; color:#666;">No places.</div>`}
          ${
            meals
              ? `<div style="margin-top:8px;">
                    <div style="font-size:12px; font-weight:700; margin-bottom:6px;">Meals</div>
                    <ul style="margin:0 0 0 18px; font-size:12px;">${meals}</ul>
                 </div>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <div style="margin-bottom:16px;">
      <img src="${HEADER_IMG_URL}" alt="Travco Header" style="width:100%; height:auto; display:block; object-fit:contain;" />
    </div>

    <style>
      h2, h3, h4 { color: ${TITLE_RED}; }
    </style>

    <div style="border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-size:18px; font-weight:700;">Travco Jordan</div>
          <div style="font-size:12px;">Quotation / Offer</div>
          <div style="font-size:11px; margin-top:4px;">Generated: ${today}</div>
        </div>
        <div style="text-align:right; font-size:12px;">
          <div><b>Quotation ID:</b> ${q?.QOUTATION_ID ?? "-"}</div>
          <div><b>Group:</b> ${q?.QOUTATION_GROUP_NAME || "-"}</div>
          <div><b>Total Pax:</b> ${q?.QOUTATION_TOTAL_PAX ?? "-"}</div>
          <div style="margin-top:6px;">
            <span style="display:inline-block; padding:2px 8px; border:1px solid #999; border-radius:12px; font-size:11px;">
              ${profitLabel}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex; gap:16px; margin-bottom:12px;">
      <div style="flex:1;">
        <h3 style="margin:0 0 6px; font-size:13px;">Client</h3>
        <div style="font-size:12px;"><b>Name:</b> ${q?.CLIENT_NAME || "-"}</div>
        <div style="font-size:12px;"><b>Email:</b> ${q?.CLIENT_EMAIL || "-"}</div>
        <div style="font-size:12px;"><b>Phone:</b> ${q?.CLIENT_PHONE || "-"}</div>
      </div>
      <div style="flex:1;">
        <h3 style="margin:0 0 6px; font-size:13px;">Travel Dates</h3>
        <div style="font-size:12px;"><b>Arriving:</b> ${formatDate(
          q?.QOUTATION_ARRIVING_DATE,
        )}</div>
        <div style="font-size:12px;"><b>Departing:</b> ${formatDate(
          q?.QOUTATION_DEPARTURING_DATE,
        )}</div>
      </div>
    </div>

    <h3 style="margin:10px 0 8px; font-size:13px;">Cost Summary</h3>
    <table style="width:100%; border-collapse:collapse; font-size:12px;">
      <tbody>
        <tr><td style="border:1px solid #ddd; padding:6px 8px;">Transportation (PP)</td><td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          perPerson?.TRANSPORTATION,
        )}</td></tr>
        <tr><td style="border:1px solid #ddd; padding:6px 8px;">Entrance Fees (PP)</td><td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          perPerson?.ENTRANCE_FEES,
        )}</td></tr>
        <tr><td style="border:1px solid #ddd; padding:6px 8px;">Guide (PP)</td><td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          perPerson?.GUIDE,
        )}</td></tr>
        <tr><td style="border:1px solid #ddd; padding:6px 8px;">Meals (PP)</td><td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          perPerson?.MEALS,
        )}</td></tr>
        <tr><td style="border:1px solid #ddd; padding:6px 8px;">Extra Services (PP)</td><td style="border:1px solid #ddd; padding:6px 8px; text-align:right;">${money(
          perPerson?.EXTRA_SERVICES,
        )}</td></tr>
        <tr><td style="border:1px solid #ddd; padding:8px; font-weight:700;">Total (PP)</td><td style="border:1px solid #ddd; padding:8px; text-align:right; font-weight:700;">${money(
          perPerson?.TOTAL_WITHOUT_ACCOMMODATION ?? grandTotal,
        )}</td></tr>
      </tbody>
    </table>

    ${
      optionsRows
        ? `
      <h3 style="margin:14px 0 8px; font-size:13px;">Options</h3>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:left; background:#f6f6f6;">Option</th>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:right; background:#f6f6f6;">Total</th>
          </tr>
        </thead>
        <tbody>${optionsRows}</tbody>
      </table>
    `
        : ""
    }

    ${
      staysOptionsTables
        ? `
      <h3 style="margin:14px 0 8px; font-size:13px;">Stay Options</h3>
      ${staysOptionsTables}
    `
        : ""
    }

    ${
      optionsCostRowsFromStays
        ? `
      <h3 style="margin:14px 0 8px; font-size:13px;">Options Cost</h3>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:left; background:#f6f6f6;">OPTION_NAME</th>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:center; background:#f6f6f6;">OPTION_ID</th>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:right; background:#f6f6f6;">Cost</th>
          </tr>
        </thead>
        <tbody>${optionsCostRowsFromStays}</tbody>
      </table>
    `
        : ""
    }

    ${
      supplementsRowsFromStays
        ? `
      <h3 style="margin:14px 0 8px; font-size:13px;">Supplements Cost</h3>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:left; background:#f6f6f6;">OPTION_NAME</th>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:center; background:#f6f6f6;">OPTION_ID</th>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:right; background:#f6f6f6;">Half Board</th>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:right; background:#f6f6f6;">Full Board</th>
            <th style="border:1px solid #ddd; padding:6px 8px; text-align:right; background:#f6f6f6;">Single Supplement</th>
          </tr>
        </thead>
        <tbody>${supplementsRowsFromStays}</tbody>
      </table>
    `
        : ""
    }


    ${
      extraRows
        ? `
      <h3 style="margin:14px 0 8px; font-size:13px;">Extra Services (Per Person)</h3>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tbody>${extraRows}</tbody>
      </table>
    `
        : ""
    }

    <h3 style="margin:14px 0 8px; font-size:13px;">Program</h3>
    ${programHtml || `<div style="font-size:12px; color:#666;">No routes found.</div>`}

    <div style="margin-top:18px; border-top:1px solid #ddd; padding-top:10px; font-size:11px; color:#555;">
      <b>Notes:</b> You can edit all content above before exporting to PDF.
    </div>
  </div>
  `;
};

const QuotationShareInner = () => {
  document.title = "Share Quotation | Travco - COE";

  const { qoutationId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { details, loadingDetails, error } = useSelector(quotationsSelector);

  const [profitType, setProfitType] = useState("percentage");
  const [profitValue, setProfitValue] = useState("");

  const [contentHtml, setContentHtml] = useState("");
  const [templateApplied, setTemplateApplied] = useState(false);

  const [imgUrls, setImgUrls] = useState({});

  const editorRef = useRef(null);

  useEffect(() => {
    if (qoutationId) dispatch(getQoutationDetails(Number(qoutationId)));
    return () => dispatch(clearQoutationsMessages());
  }, [dispatch, qoutationId]);

  const adjustedDetails = useMemo(() => {
    return applyProfitToCosts(details, profitType, profitValue);
  }, [details, profitType, profitValue]);

  // Load attachment urls for place images
  useEffect(() => {
    const loadImages = async () => {
      if (!details?.ROUTES?.length) return;

      const ids = new Set();
      details.ROUTES.forEach((r) => {
        (r?.PLACES || []).forEach((p) => {
          const attId =
            p?.PLACE_IMAGE?.PLACE_IMAGE_ATTACHMENT_ID ||
            p?.PLACE_IMAGE?.place_image_attachment_id;
          if (attId) ids.add(String(attId));
        });
      });

      if (!ids.size) return;

      const next = {};
      await Promise.all(
        Array.from(ids).map(async (id) => {
          try {
            const res = await getAttachmentUrl(id);
            next[id] = res?.url || res?.URL || res || `/api/attachments/${id}`;
          } catch {
            next[id] = `/api/attachments/${id}`;
          }
        }),
      );

      setImgUrls((prev) => ({ ...prev, ...next }));
    };

    if (details) loadImages();
  }, [details]);

  // First generate (may be before images are resolved, that's OK)
  useEffect(() => {
    if (!adjustedDetails || templateApplied) return;

    const html = buildHtmlTemplate({
      details: adjustedDetails,
      profitType,
      profitValue,
      imgUrls,
    });

    setContentHtml(html);
    setTemplateApplied(true);
  }, [adjustedDetails, templateApplied, profitType, profitValue, imgUrls]);

  // Refresh once place image urls are ready.
  // IMPORTANT: do NOT check for "<img" because header includes an <img>.
  useEffect(() => {
    if (!adjustedDetails || !templateApplied) return;
    if (Object.keys(imgUrls || {}).length === 0) return;

    // If place images already injected, do nothing
    if ((contentHtml || "").includes('data-place-img="1"')) return;

    const html = buildHtmlTemplate({
      details: adjustedDetails,
      profitType,
      profitValue,
      imgUrls,
    });

    setContentHtml(html);
  }, [
    imgUrls,
    adjustedDetails,
    templateApplied,
    profitType,
    profitValue,
    contentHtml,
  ]);

  const regenerateFromTemplate = useCallback(() => {
    if (!adjustedDetails) return;
    const html = buildHtmlTemplate({
      details: adjustedDetails,
      profitType,
      profitValue,
      imgUrls,
    });
    setContentHtml(html);
    setTemplateApplied(true);
  }, [adjustedDetails, profitType, profitValue, imgUrls]);

  const saveAsPdf = () => {
    const html = contentHtml || "";
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;

    w.document.open();
    w.document.write(`
      <html>
        <head>
          <title>Quotation_${qoutationId || ""}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, Helvetica, sans-serif; color:#111; }
            img { max-width: 100%; height: auto; }
            h2,h3,h4 { color:${TITLE_RED}; }
          </style>
        </head>
        <body>
          ${html}
          <script>
            setTimeout(() => { window.focus(); window.print(); }, 250);
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  if (loadingDetails || (!details && !error)) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Share Quotation" />
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading quotation details...
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  const q = details?.QOUTATION || null;
  const apiKey = import.meta.env.VITE_TINYMCE_API_KEY;

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Share Quotation" />

        <Row className="mb-3">
          <Col className="d-flex align-items-center">
            <Button
              color="secondary"
              size="sm"
              onClick={() =>
                navigate(`/contracting/quotations/view/${qoutationId}`)
              }
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Quotation
            </Button>
          </Col>

          <Col className="d-flex justify-content-end align-items-center gap-2">
            <Button color="info" size="sm" onClick={regenerateFromTemplate}>
              <i className="bx bx-refresh me-1" />
              Refresh from Template
            </Button>
            <Button color="success" size="sm" onClick={saveAsPdf}>
              <i className="bx bxs-file-pdf me-1" />
              Save as PDF
            </Button>
          </Col>
        </Row>

        {error ? <Alert color="danger">{error}</Alert> : null}

        {!apiKey ? (
          <Alert color="warning" className="mb-3">
            TinyMCE API key is missing. Add <b>VITE_TINYMCE_API_KEY</b> to your{" "}
            <b>.env</b> file and restart the dev server.
          </Alert>
        ) : null}

        <Row>
          <Col lg={4}>
            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3" style={{ color: TITLE_RED }}>
                  Profit Setup
                </h5>

                <Form>
                  <div className="mb-3">
                    <Label className="form-label">Profit Type</Label>
                    <Input
                      type="select"
                      value={profitType}
                      onChange={(e) => {
                        setProfitType(e.target.value);
                        setTemplateApplied(false);
                      }}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </Input>
                  </div>

                  <div className="mb-3">
                    <Label className="form-label">
                      Profit Amount {profitType === "percentage" ? "(%)" : ""}
                    </Label>
                    <InputGroup>
                      <InputGroupText>
                        {profitType === "percentage" ? "%" : "+"}
                      </InputGroupText>
                      <Input
                        value={profitValue}
                        onChange={(e) => {
                          setProfitValue(e.target.value);
                          setTemplateApplied(false);
                        }}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={
                          profitType === "percentage" ? "e.g. 15" : "e.g. 200"
                        }
                      />
                    </InputGroup>

                    <div className="mt-2">
                      <Badge color="light" className="text-dark">
                        Client: {q?.CLIENT_NAME || "-"}
                      </Badge>
                    </div>
                  </div>

                  <div className="d-grid">
                    <Button
                      color="primary"
                      type="button"
                      onClick={regenerateFromTemplate}
                      disabled={!details}
                    >
                      Apply & Generate Content
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>

            <Card className="mb-3">
              <CardBody>
                <h6 className="mb-2" style={{ color: TITLE_RED }}>
                  Images Loaded
                </h6>
                <div className="text-muted">
                  {Object.keys(imgUrls || {}).length} place images ready.
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3" style={{ color: TITLE_RED }}>
                  Quotation Content (Editable)
                </h5>

                <Editor
                  apiKey={apiKey || undefined}
                  onInit={(_, editor) => (editorRef.current = editor)}
                  value={contentHtml || ""}
                  onEditorChange={(val) => setContentHtml(val)}
                  init={{
                    height: 760,
                    menubar: true,
                    branding: false,

                    // ✅ Removed "template" plugin (TinyMCE 7 cloud 404s it)
                    plugins:
                      "preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help",

                    toolbar:
                      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor removeformat | table | image media link | code fullscreen preview | ltr rtl",

                    automatic_uploads: true,
                    file_picker_types: "image",

                    // local base64 insert for user-added images
                    file_picker_callback: (cb) => {
                      const input = document.createElement("input");
                      input.setAttribute("type", "file");
                      input.setAttribute("accept", "image/*");
                      input.onchange = () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          cb(reader.result, { title: file.name });
                        reader.readAsDataURL(file);
                      };
                      input.click();
                    },

                    content_style: `
                      body { font-family:Arial,Helvetica,sans-serif; font-size:13px; }
                      h2,h3,h4 { color:${TITLE_RED}; }
                      img { max-width:100%; height:auto; }
                      ul { margin:0 0 0 18px; }
                      table { border-collapse:collapse; width:100%; }
                      table, th, td { border:1px solid #ddd; }
                      th, td { padding:6px 8px; }
                    `,
                  }}
                />

                <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                  “Save as PDF” will open Print — choose “Save as PDF”.
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const QuotationShare = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <QuotationShareInner />
  </RequireModule>
);

export default QuotationShare;
