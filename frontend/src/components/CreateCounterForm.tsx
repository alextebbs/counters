"use client";

import { cn } from "@/utils/cn";
import React, { FC } from "react";
import { useForm } from "react-hook-form";
import { CounterListItem } from "./CounterListItem";
import {
  CounterServiceCreateRequest,
  CounterServiceCreateResponse,
} from "@pb/counter/v1/counter";
import { Timestamp } from "@pb/google/protobuf/timestamp";
import { createCounter } from "@/grpc/actions";
import { useGRPCFormState } from "@/grpc/useGRPCFormState";
import { zodResolver } from "@hookform/resolvers/zod";
import { incrementCounterSchema } from "@/grpc/zod-schemas";
import { ErrorMessage } from "@hookform/error-message";

interface AddCounterFormProps {
  setAddFormIsActive: (isActive: boolean) => void;
}

export const CreateCounterForm: FC<AddCounterFormProps> = () => {
  const {
    register,
    reset,
    watch,
    formState: { errors },
    setError,
  } = useForm<CounterServiceCreateRequest>({
    mode: "all",
    resolver: zodResolver(incrementCounterSchema),
  });

  const watchTitle = watch("title", " ..");

  const { formAction } = useGRPCFormState(
    createCounter,
    null,
    CounterServiceCreateResponse,
    reset,
    setError
  );

  return (
    <form className={`bg-neutral-950`} action={formAction}>
      <div className={`p-4 border-b border-neutral-800`}>
        <h2 className="text-center text-sm text-neutral-500 mb-2">
          Start a new counter
        </h2>
        <div className="mb-2">
          <label
            htmlFor="title"
            className="pl-2 mb-1 mt-4 text-xs text-neutral-500 uppercase tracking-[0.15em]"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            autoFocus
            className={cn(
              `border border-neutral-800 w-full py-2 px-4 focus:outline-none focus:border-neutral-700 rounded-md text-sm bg-transparent`,
              errors.title && `border-red-500 focus:border-red-500`
            )}
            {...register("title")}
          />
          <div>
            {errors.title ? (
              <span className="pl-2 text-red-500 text-xs uppercase tracking-[0.15em]">
                <ErrorMessage name="title" errors={errors} />
              </span>
            ) : (
              <span className="pl-2 text-xs text-neutral-700">
                Time since...
              </span>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="title"
            className="pl-2 mb-1 mt-4 text-xs text-neutral-500 uppercase tracking-[0.15em]"
          >
            Initial event
          </label>
          <input
            type="text"
            id="eventTitle"
            className={cn(
              `border border-neutral-800 w-full py-2 px-4 focus:outline-none focus:border-neutral-700 rounded-md text-sm bg-transparent`,
              errors.eventTitle && `border-red-500 focus:border-red-500`
            )}
            {...register("eventTitle")}
          />
          <div>
            {errors.eventTitle ? (
              <span className="pl-2 text-red-500 text-xs uppercase tracking-[0.15em]">
                <ErrorMessage name="eventTitle" errors={errors} />
              </span>
            ) : (
              <span className="pl-2 text-xs text-neutral-700">
                Why are you starting this counter?
              </span>
            )}
          </div>
        </div>

        <div className="pl-2 mb-1 mt-4 text-xs text-neutral-700 uppercase tracking-[0.15em]">
          Preview
        </div>

        <div className="rounded-lg border border-dashed border-neutral-800">
          <CounterListItem
            count={1}
            paused={true}
            preview={true}
            title={watchTitle}
            id={"fakeid"}
            timestamp={Timestamp.create()}
          />
        </div>

        <div className="mt-4">
          <input
            type="submit"
            value="Start counter"
            className="bg-neutral-900 rounded-md px-4 py-1.5 uppercase tracking-[0.15em] text-sm"
          />
        </div>
      </div>
    </form>
  );
};
