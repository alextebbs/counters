"use client";

import { useFormState } from "react-dom";
import { FormState } from "./client";
import { MessageType } from "@protobuf-ts/runtime";

type ServerAction = (state: FormState, data: FormData) => Promise<FormState>;

export const useGRPCFormState = <Res extends object>(
  serverAction: ServerAction,
  initialState: FormState,
  responseClass: MessageType<Res>
) => {
  const [state, formAction] = useFormState<FormState, FormData>(
    serverAction,
    initialState
  );

  const response =
    state?.status === "success"
      ? responseClass.fromBinary(new Uint8Array(state.message))
      : undefined;

  return { state, formAction, response };
};
