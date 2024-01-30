"use client";

import { cn } from "@/utils/cn";
import React, { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddEventFormProps {
  id: string;
}

const AddEventForm: FC<AddEventFormProps> = ({ id }) => {
  const router = useRouter();

  const [eventFormIsActive, setEventFormIsActive] = useState<boolean>(false);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<{ title: string }>();

  const onSubmit = async ({ title }: { title: string }) => {
    try {
      const response = await fetch("http://localhost:8080/counters/increment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ counter_id: parseInt(id), title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEventFormIsActive(false);
      const json = await response.json();
      console.log(json);

      reset();

      router.refresh();
    } catch (error) {
      console.error("Failed to create counter:", error);
    }
  };

  return (
    <>
      <div className="border-b border-neutral-800 uppercase tracking-[0.15em] text-xs p-4 text-neutral-500 flex items-center justify-center">
        <button
          className={cn(
            `rounded-md text-sm px-4 py-1.5 uppercase tracking-[0.15em] flex items-center`,
            !eventFormIsActive && `bg-neutral-900`
          )}
          onClick={() => setEventFormIsActive((prev) => !prev)}
        >
          {eventFormIsActive ? (
            <>
              Cancel <X height={14} />
            </>
          ) : (
            <>
              Increase <Plus height={14} />
            </>
          )}
        </button>
      </div>
      {eventFormIsActive && (
        <form className={`bg-neutral-950`} onSubmit={handleSubmit(onSubmit)}>
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
              placeholder="It happened again."
              className={cn(
                `border border-neutral-800 w-full py-2 px-4 focus:outline-none focus:border-neutral-700 rounded-md text-sm bg-transparent placeholder-neutral-800`,
                errors.title && `border-red-500 focus:border-red-500`
              )}
              {...register("title", { required: true, minLength: 3 })}
            />
            <div>
              {errors.title ? (
                <span className="pl-2 text-red-500 text-xs uppercase tracking-[0.15em]">
                  Enter at least 3 characters.
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
                value="Increment counter"
                disabled={!isValid}
                className={cn(
                  `bg-neutral-800 rounded-md px-4 py-1.5 uppercase tracking-[0.15em] text-sm`,
                  !isValid && `opacity-40 cursor-not-allowed`
                )}
              />
            </div>
          </div>
        </form>
      )}
    </>
  );
};

export default AddEventForm;
