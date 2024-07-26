import {
  getFieldAddress,
  getFieldAddressSchema,
  getFieldAmount,
  getFieldAmountSchema,
  getFieldString,
  getFieldStringSchema,
} from "@/components/forms/CreateTxForm/Fields";
import { FieldSchemaInput } from "@/components/forms/CreateTxForm/Fields/types";
import { z } from "zod";

export const prettyFieldName = (fieldName: string) => {
  const truncatedName = fieldName.slice(fieldName.indexOf(".", "msgs.".length) + 1);
  const splitName = truncatedName.split(/(?=[A-Z])/).join(" ");
  const capitalizedName = splitName.charAt(0).toUpperCase() + splitName.slice(1);

  return capitalizedName;
};

export const getField = (fieldName: string) =>
  getFieldAddress(fieldName) || getFieldAmount(fieldName) || getFieldString(fieldName) || null;

const getFieldSchema = (fieldName: string, schemaInput: FieldSchemaInput) =>
  getFieldAddressSchema(fieldName, schemaInput) ||
  getFieldAmountSchema(fieldName) ||
  getFieldStringSchema(fieldName) ||
  null;

export const getMsgSchema = (fieldNames: readonly string[], schemaInput: FieldSchemaInput) => {
  const fieldEntries = fieldNames.map((fieldName) => [
    fieldName,
    getFieldSchema(fieldName, schemaInput),
  ]);

  return z.object(Object.fromEntries(fieldEntries));
};