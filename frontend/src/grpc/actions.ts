"use server";

import { createGRPCServerAction } from "@/grpc/grpc-client";
import {
  createCounterSchema,
  incrementCounterSchema,
} from "@/grpc/zod-schemas";
import { CounterServiceClient } from "@pb/counter/v1/counter.client";
import {
  CounterServiceCreateResponse,
  CounterServiceIncrementResponse,
} from "@pb/counter/v1/counter";

export const createCounter = createGRPCServerAction(
  CounterServiceClient,
  "create",
  createCounterSchema,
  CounterServiceCreateResponse
);

export const incrementCounter = createGRPCServerAction(
  CounterServiceClient,
  "increment",
  incrementCounterSchema,
  CounterServiceIncrementResponse
);
