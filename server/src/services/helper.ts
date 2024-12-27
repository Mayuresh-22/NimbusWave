import moment from "moment";
import { v4 } from "uuid";

/**
 * Get the current SQL DateTime
 * @returns SQL DateTime string
 */
export const getSQLDateTimeNow = (milliseconds?: boolean) => {
  return moment().format(`YYYY-MM-DD HH:mm:ss${milliseconds ? ".ssss" : ""}`);
};

/**
 * Sanitize a string by replacing all non-alphanumeric characters with underscores
 * @param str
 * @returns
 */
export const sanitizeString = (str: string) => {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
};

/**
 * Normalize a project name by replacing all non-alphanumeric characters with hyphens
 * and appending a UUID and adding a mid string if provided
 * @param str
 * @param mid
 * @returns
 */
export const normalizeProjectName = (str: string, mid?: string) => {
  return (
    str.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() +
    `${mid ? "-" + mid : ""}-` +
    v4().split("-")[0]
  );
};
