import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { MessageType } from "@protobuf-ts/runtime";
import {
  RpcOptions,
  RpcTransport,
  ServiceInfo,
  UnaryCall,
} from "@protobuf-ts/runtime-rpc";

export type InferResponse<T> = T extends (
  ...args: any[]
) => UnaryCall<any, infer R>
  ? R
  : never;

export type InferRequest<T> = T extends (
  arg: infer R,
  options?: RpcOptions
) => UnaryCall<any, any>
  ? R extends object
    ? R
    : never
  : never;

export type UnaryMethod<Req extends object> = (
  input: Req,
  options?: RpcOptions
) => UnaryCall<Req, any>;

export type GRPCClientConstructor<C extends ServiceInfo> = new (
  transport: RpcTransport
) => C;

export type GRPCClientInstance<T extends ServiceInfo> = InstanceType<
  GRPCClientConstructor<T>
>;

export const makeGRPCClient = <T extends ServiceInfo>(
  ClientConstructor: GRPCClientConstructor<T>
): GRPCClientInstance<T> => {
  const baseUrl =
    typeof window === "undefined"
      ? "http://envoy-proxy:8080"
      : "http://localhost:8080";

  const transport = new GrpcWebFetchTransport({ baseUrl });

  return new ClientConstructor(transport);
};

/**
 * Given a proto-generated gRPC service client, a method name, and a request,
 * call the method on the client and return the response.
 *
 * @template Client - Type of the proto-generated gRPC service client.
 * @template Method - The name of the method to call on the gRPC client.
 * @template Req - The request type, inferred from the method's type signature.
 * @template Res - The response type, inferred from the method's type signature.
 *
 * @param {GRPCClientConstructor<Client>} client - Constructor for gRPC client.
 * @param {Method} method - Name of the client method to call, as a string.
 * @param {Req} requestData - Data to send along with the request.
 *
 * @returns {Promise<Res>} A promise of the response from the gRPC method.
 *
 * @example
 * const res = await getRPC(CounterServiceClient, "create", data);
 */
export const getRPC = async <
  Client extends ServiceInfo,
  Method extends keyof Client & string,
  Req extends InferRequest<Client[Method]>,
  Res extends InferResponse<Client[Method]>
>(
  Client: GRPCClientConstructor<Client>,
  method: Client[Method] extends (
    input: any,
    options?: RpcOptions
  ) => UnaryCall<Req, Res>
    ? Method
    : never,
  requestData: Req
): Promise<Res> => {
  type Request = InferRequest<Client[Method]>;

  const thisClient = makeGRPCClient(Client);
  const res = await (thisClient[method] as UnaryMethod<Request>)(requestData);
  return res.response;
};

export type FormState = {
  status: "success";
  message: Uint8Array;
} | null;

/**
 * Given a proto-generated gRPC service client, a method name, a validation
 * schema, and a response class, generate a server action that when called
 * will validate and parse form data, make a gRPC call, and return the result.
 *
 * @template Client - The type of the proto-generated gRPC service client.
 * @template Method - The name of the method to call on the gRPC client.
 * @template Req - The request type, inferred from the method's type signature.
 * @template Res - The response type, inferred from the method's type signature.
 * @template Schema - A validation schema from zfd.formData()
 *
 * @param {GRPCClientConstructor<Client>} client - Constructor for gRPC client.
 * @param {Method} method - Name of the client method to call, as a string.
 * @param {Schema} schema - The schema object returned from zfd.formData().
 * @param {MessageType<Res>} responseClass - The proto-generated response class.
 *
 * @returns A function suitable for use as a server action.
 *
 * @example
 * const createCounterAction = createGRPCServerAction(
 *   CounterServiceClient,
 *   "create",
 *   CounterCreateSchema,
 *   CounterServiceCreateResponse
 * );
 */
export const createGRPCServerAction =
  <
    Client extends ServiceInfo,
    Method extends keyof Client & string,
    Req extends InferRequest<Client[Method]>,
    Res extends InferResponse<Client[Method]>,
    Schema extends { parse(data: FormData): Req }
  >(
    client: GRPCClientConstructor<Client>,
    method: Client[Method] extends (
      input: any,
      options?: RpcOptions
    ) => UnaryCall<Req, Res>
      ? Method
      : never,
    schema: Schema,
    responseClass: MessageType<Res>
  ) =>
  async (_: FormState | null, data: FormData) => {
    const formData = schema.parse(data);

    const res = await getRPC(client, method, formData);

    return {
      status: "success" as const, // TODO: handle errors or whatever
      message: responseClass.toBinary(res),
    };
  };
