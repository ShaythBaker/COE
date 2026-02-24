// src/helpers/image_helper.jsx

// File -> base64 string (without data: prefix)
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result looks like: data:image/png;base64,xxxxxxxx
      const result = reader.result || "";
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) return resolve(result);
      const base64 = result.substring(commaIndex + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// base64 string -> img src for <img>
export const base64ToImageSrc = (base64, mime = "image/png") => {
  if (!base64) return null;
  return `data:${mime};base64,${base64}`;
};
 