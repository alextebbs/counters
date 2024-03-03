"use client";

import { cn } from "@/utils/cn";
import React, { FC } from "react";
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import {
  CounterServiceIncrementRequest,
  CounterServiceIncrementResponse,
} from "@pb/counter/v1/counter";
import { useGRPCFormState } from "@/grpc/useGRPCFormState";
import { incrementCounter } from "@/grpc/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { incrementCounterSchema } from "@/grpc/zod-schemas";
import { ErrorMessage } from "@hookform/error-message";

interface AddEventFormProps {
  id: string;
}

const CreateEventForm: FC<AddEventFormProps> = ({ id }) => {
  const {
    register,
    reset,
    formState: { errors, isValid },
    setError,
  } = useForm<CounterServiceIncrementRequest>({
    mode: "all",
    resolver: zodResolver(incrementCounterSchema),
  });

  const { formAction } = useGRPCFormState(
    incrementCounter,
    null,
    CounterServiceIncrementResponse,
    reset,
    setError
  );

  return (
    <div className="select-none">
      <input type="checkbox" id="toggle-event-form" className="peer hidden" />
      <label
        htmlFor="toggle-event-form"
        className="border-b border-neutral-800 uppercase tracking-[0.15em] text-xs p-4 text-neutral-500 flex items-center justify-center peer-checked:hidden cursor-pointer group"
      >
        <div className="bg-neutral-900 rounded-md text-sm px-4 py-1.5 uppercase tracking-[0.15em] flex items-center group-hover:bg-neutral-800 group-hover:text-white">
          Increase <Plus height={14} />
        </div>
      </label>
      <label
        htmlFor="toggle-event-form"
        className="border-b border-neutral-800 uppercase tracking-[0.15em] text-xs p-4 text-neutral-500 items-center justify-center hidden peer-checked:flex cursor-pointer group"
      >
        <div className="rounded-md text-sm px-4 py-1.5 uppercase tracking-[0.15em] flex items-center group-hover:text-neutral-300">
          Cancel <X height={14} />
        </div>
      </label>
      <div className="peer-checked:block hidden">
        <form className={`bg-neutral-950`} action={formAction}>
          <input type="hidden" name="id" value={id} />
          <div className={`p-4 border-b border-neutral-800`}>
            <label
              htmlFor="title"
              className="pl-2 mb-1 mt-4 text-xs text-neutral-500 uppercase tracking-[0.15em]"
            >
              What happened?
            </label>
            <input
              type="text"
              id="title"
              autoFocus
              placeholder="It happened again."
              className={cn(
                `border border-neutral-800 w-full py-2 px-4 focus:outline-none focus:border-neutral-700 rounded-md text-sm bg-transparent placeholder-neutral-800`,
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
                  Why are you incrementing this counter?
                </span>
              )}
            </div>

            <div className="mt-4">
              <input
                type="submit"
                // disabled={!isValid}
                className={cn(
                  `bg-neutral-800 rounded-md px-4 py-1.5 uppercase tracking-[0.15em] text-sm cursor-pointer`
                )}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventForm;
