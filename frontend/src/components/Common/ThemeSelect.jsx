import React, { useMemo } from "react";
import Select from "react-select";
import { useSelector } from "react-redux";

/**
 * ThemeSelect
 * - Theme-aware wrapper around react-select for Skote dark/light layouts
 * - Uses Layout reducer when available, otherwise falls back to body attributes
 * - Prevents menu clipping inside tables/modals using menuPortalTarget
 */
const ThemeSelect = ({
  classNamePrefix = "coe-select",
  menuPortalTarget = typeof document !== "undefined"
    ? document.body
    : undefined,
  styles: externalStyles,
  ...props
}) => {
  // Try reading layout mode from redux (common in Skote)
  const layoutModeFromRedux = useSelector((state) => {
    const layout = state?.Layout || state?.layout;
    return (
      layout?.layoutMode ||
      layout?.layoutModeType ||
      layout?.layout_mode ||
      null
    );
  });

  const isDark = useMemo(() => {
    if (layoutModeFromRedux) {
      return String(layoutModeFromRedux).toLowerCase() === "dark";
    }
    if (typeof document === "undefined") return false;

    // Skote commonly uses this attribute:
    const v1 = document.body.getAttribute("data-layout-mode");
    // Some projects use bs 5.3 theme attribute:
    const v2 = document.body.getAttribute("data-bs-theme");

    return (
      v1 === "dark" ||
      v2 === "dark" ||
      document.body.classList.contains("dark") ||
      document.documentElement.classList.contains("dark")
    );
  }, [layoutModeFromRedux]);

  const baseColors = useMemo(() => {
    if (isDark) {
      return {
        bg: "#2a3042",
        bg2: "#32394e",
        border: "#3b4257",
        text: "#e9ecef",
        muted: "rgba(233,236,239,.65)",
        hover: "rgba(255,255,255,.08)",
        primary: "#556ee6",
        white: "#fff",
      };
    }
    return {
      bg: "#fff",
      bg2: "#fff",
      border: "#ced4da",
      text: "#212529",
      muted: "rgba(33,37,41,.45)",
      hover: "rgba(0,0,0,.04)",
      primary: "#556ee6",
      white: "#fff",
    };
  }, [isDark]);

  const internalStyles = useMemo(() => {
    const s = {
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),

      control: (base, state) => ({
        ...base,
        backgroundColor: baseColors.bg,
        borderColor: state.isFocused ? baseColors.primary : baseColors.border,
        boxShadow: "none",
        minHeight: "38px",
      }),

      valueContainer: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
      }),

      singleValue: (base) => ({
        ...base,
        color: baseColors.text,
      }),

      input: (base) => ({
        ...base,
        color: baseColors.text,
      }),

      placeholder: (base) => ({
        ...base,
        color: baseColors.muted,
      }),

      indicatorsContainer: (base) => ({
        ...base,
        color: baseColors.muted,
      }),

      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: baseColors.border,
      }),

      menu: (base) => ({
        ...base,
        backgroundColor: baseColors.bg2,
        border: `1px solid ${baseColors.border}`,
      }),

      menuList: (base) => ({
        ...base,
        backgroundColor: baseColors.bg2,
      }),

      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? baseColors.primary
          : state.isFocused
          ? baseColors.hover
          : baseColors.bg2,
        color: state.isSelected ? baseColors.white : baseColors.text,
      }),
    };

    // allow caller to extend/override styles if needed
    if (externalStyles) {
      return { ...s, ...externalStyles };
    }
    return s;
  }, [baseColors, externalStyles]);

  return (
    <Select
      {...props}
      classNamePrefix={classNamePrefix}
      menuPortalTarget={menuPortalTarget}
      styles={internalStyles}
    />
  );
};

export default ThemeSelect;
