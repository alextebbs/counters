// @generated by protobuf-ts 2.9.3
// @generated from protobuf file "tag/v1/tag.proto" (package "tag.v1", syntax proto3)
// tslint:disable
import { ServiceType } from "@protobuf-ts/runtime-rpc";
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message tag.v1.Tag
 */
export interface Tag {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: string title = 2;
     */
    title: string;
    /**
     * @generated from protobuf field: string counter_id = 5;
     */
    counterId: string;
}
/**
 * @generated from protobuf message tag.v1.TagServiceGetRequest
 */
export interface TagServiceGetRequest {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string; // Tag ID
}
/**
 * @generated from protobuf message tag.v1.TagServiceGetResponse
 */
export interface TagServiceGetResponse {
    /**
     * @generated from protobuf field: tag.v1.Tag tag = 1;
     */
    tag?: Tag;
}
/**
 * @generated from protobuf message tag.v1.TagServiceListRequest
 */
export interface TagServiceListRequest {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string; // Counter ID
}
/**
 * @generated from protobuf message tag.v1.TagServiceListResponse
 */
export interface TagServiceListResponse {
    /**
     * @generated from protobuf field: repeated tag.v1.Tag tags = 1;
     */
    tags: Tag[];
}
// @generated message type with reflection information, may provide speed optimized methods
class Tag$Type extends MessageType<Tag> {
    constructor() {
        super("tag.v1.Tag", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "title", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "counter_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<Tag>): Tag {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.id = "";
        message.title = "";
        message.counterId = "";
        if (value !== undefined)
            reflectionMergePartial<Tag>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Tag): Tag {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* string title */ 2:
                    message.title = reader.string();
                    break;
                case /* string counter_id */ 5:
                    message.counterId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: Tag, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* string title = 2; */
        if (message.title !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.title);
        /* string counter_id = 5; */
        if (message.counterId !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.counterId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message tag.v1.Tag
 */
export const Tag = new Tag$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TagServiceGetRequest$Type extends MessageType<TagServiceGetRequest> {
    constructor() {
        super("tag.v1.TagServiceGetRequest", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<TagServiceGetRequest>): TagServiceGetRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.id = "";
        if (value !== undefined)
            reflectionMergePartial<TagServiceGetRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TagServiceGetRequest): TagServiceGetRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: TagServiceGetRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message tag.v1.TagServiceGetRequest
 */
export const TagServiceGetRequest = new TagServiceGetRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TagServiceGetResponse$Type extends MessageType<TagServiceGetResponse> {
    constructor() {
        super("tag.v1.TagServiceGetResponse", [
            { no: 1, name: "tag", kind: "message", T: () => Tag }
        ]);
    }
    create(value?: PartialMessage<TagServiceGetResponse>): TagServiceGetResponse {
        const message = globalThis.Object.create((this.messagePrototype!));
        if (value !== undefined)
            reflectionMergePartial<TagServiceGetResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TagServiceGetResponse): TagServiceGetResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* tag.v1.Tag tag */ 1:
                    message.tag = Tag.internalBinaryRead(reader, reader.uint32(), options, message.tag);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: TagServiceGetResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* tag.v1.Tag tag = 1; */
        if (message.tag)
            Tag.internalBinaryWrite(message.tag, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message tag.v1.TagServiceGetResponse
 */
export const TagServiceGetResponse = new TagServiceGetResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TagServiceListRequest$Type extends MessageType<TagServiceListRequest> {
    constructor() {
        super("tag.v1.TagServiceListRequest", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<TagServiceListRequest>): TagServiceListRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.id = "";
        if (value !== undefined)
            reflectionMergePartial<TagServiceListRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TagServiceListRequest): TagServiceListRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: TagServiceListRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message tag.v1.TagServiceListRequest
 */
export const TagServiceListRequest = new TagServiceListRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TagServiceListResponse$Type extends MessageType<TagServiceListResponse> {
    constructor() {
        super("tag.v1.TagServiceListResponse", [
            { no: 1, name: "tags", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Tag }
        ]);
    }
    create(value?: PartialMessage<TagServiceListResponse>): TagServiceListResponse {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.tags = [];
        if (value !== undefined)
            reflectionMergePartial<TagServiceListResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TagServiceListResponse): TagServiceListResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated tag.v1.Tag tags */ 1:
                    message.tags.push(Tag.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: TagServiceListResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated tag.v1.Tag tags = 1; */
        for (let i = 0; i < message.tags.length; i++)
            Tag.internalBinaryWrite(message.tags[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message tag.v1.TagServiceListResponse
 */
export const TagServiceListResponse = new TagServiceListResponse$Type();
/**
 * @generated ServiceType for protobuf service tag.v1.TagService
 */
export const TagService = new ServiceType("tag.v1.TagService", [
    { name: "Get", options: {}, I: TagServiceGetRequest, O: TagServiceGetResponse },
    { name: "List", options: {}, I: TagServiceListRequest, O: TagServiceListResponse }
]);
