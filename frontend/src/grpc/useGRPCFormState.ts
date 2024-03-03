"use client";

import { useFormState } from "react-dom";
import { MessageType } from "@protobuf-ts/runtime";
import {
  FieldPath,
  FieldValues,
  UseFormReset,
  UseFormSetError,
} from "react-hook-form";
import { useEffect } from "react";

type ServerAction = (state: FormState, data: FormData) => Promise<FormState>;

export type FormState =
  | {
      status: "success";
      message: Uint8Array;
    }
  | {
      status: "error";
      message: string;
      errors?: Array<{
        path: string;
        message: string;
      }>;
    }
  | null;

export const useGRPCFormState = <Res extends object, Req extends FieldValues>(
  serverAction: ServerAction,
  initialState: FormState,
  responseClass: MessageType<Res>,
  reset: UseFormReset<Req>,
  setError: UseFormSetError<Req>
) => {
  const [state, formAction] = useFormState<FormState, FormData>(
    serverAction,
    initialState
  );

  useEffect(() => {
    if (state?.status === "success") {
      reset();
    }
    if (!state) {
      return;
    }
    if (state.status === "error") {
      state.errors?.forEach((error) => {
        setError(error.path as FieldPath<Req>, {
          message: error.message,
        });
      });
    }
  }, [state, reset, setError]);

  const response =
    state?.status === "success"
      ? responseClass.fromBinary(new Uint8Array(state.message))
      : undefined;

  return { formAction, response };
};
