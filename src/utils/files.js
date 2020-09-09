import uuid from "uuid";

const FILE_TYPES = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "spreadsheet",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "doc",
  "application/vnd.ms-excel": "spreadsheet",
  "application/octet-stream": "binary",
  "application/zip": "zip"
};

/**
 * Converts bytes to human readable size
 * @param {Number} bytes
 * @returns {String}
 */
export function bytesToSize(bytes) {
  if (!bytes || bytes === 0) {
    return "0 Bytes";
  }
  const k = 1000;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const output = (bytes / k ** i).toPrecision(3);

  return `${output} ${sizes[i]}`;
}

/**
 * Converts a buffer object to a objectUrl and blob
 * @param {Object} buffer
 * @returns {Object}
 */
export function bufferToBlob(buffer) {
  const urlCreator = window.URL || window.webkitURL;
  const blob = new Blob([buffer], { type: buffer.type });
  const objectUrl = urlCreator.createObjectURL(blob);

  return { blob, objectUrl };
}

/**
 * Formats a file object with the appropriate fields
 * @param {Object} file
 * @returns {Object}
 */
export function constructFile(file) {
  return Object.assign(file, {
    clientTempId: uuid.v4(),
    displayName: file.name,
    fileSize: file.size,
    fileSizePretty: bytesToSize(file.size),
    mimeType: file.type
  });
}

/**
 * Takes an array of files and formats them with appropriate fields
 * @param {Array} files
 * @returns {Array}
 */
export function constructFiles(files) {
  const constructedFiles = [];

  for (let i = 0; i < files.length; i += 1) {
    constructedFiles.push(constructFile(files[i]));
  }

  return constructedFiles;
}

/**
 * Checks if file object is an image
 * @param {Object} file
 * @returns {Boolean}
 */
export function isImage(file) {
  return file.type.indexOf("image") !== -1;
}

/**
 * Cleans a file object
 * @param {Object} file
 * @returns {Object}
 */
export function sanitize(file) {
  return Object.assign(file, {
    id: file.clientTempId,
    displayName: file.displayName || null,
    fileSize: file.fileSize || 0,
    fileSizePretty: bytesToSize(file.fileSize)
  });
}

/**
 * Converts a mimeType string into a human readable string
 * @param {String} mimeType
 * @returns {String}
 */
export function getFileType(mimeType) {
  if (FILE_TYPES[mimeType]) {
    return FILE_TYPES[mimeType];
  }
  if (mimeType) {
    const tokens = mimeType.split("/");

    if (tokens[0] === "image") {
      return "image";
    }
    if (tokens[0] === "text") {
      return `${tokens[1].charAt(0).toUpperCase()}${tokens[1].slice(1)} file`;
    }
  }

  return "file";
}
