/**
 * Reads SignNet's weights straight out of the notebook's `sign_model.onnx`,
 * so the app ships the training export unchanged and needs no ONNX runtime
 * (onnxruntime-web's WASM alone is about 15 MB; this model is 0.19 M
 * parameters).
 *
 * This is not a general ONNX interpreter. It checks that the graph uses only
 * the operators SignNet exports to, finds each weight by its role in the
 * graph (not by its auto-generated name), and rejects anything else. A
 * changed architecture in the notebook therefore fails loudly here instead
 * of running wrong. `test/parity.test.ts` checks the result against the
 * notebook's own probabilities.
 */

import type { SignNetWeights } from "./signnet";

type Field = [field: number, value: bigint | Uint8Array];

/** Wire-format protobuf decoder: one message level, fields in order. */
function decode(buf: Uint8Array): Field[] {
  let pos = 0;
  const varint = (): bigint => {
    let result = BigInt(0);
    let shift = BigInt(0);
    for (;;) {
      if (pos >= buf.length) throw new Error("ONNX: truncated varint");
      const byte = buf[pos++]!;
      result |= BigInt(byte & 0x7f) << shift;
      if (!(byte & 0x80)) return result;
      shift += BigInt(7);
    }
  };
  const take = (n: number) => {
    if (pos + n > buf.length) throw new Error("ONNX: truncated field");
    const out = buf.subarray(pos, pos + n);
    pos += n;
    return out;
  };
  const fields: Field[] = [];
  while (pos < buf.length) {
    const key = Number(varint());
    const field = key >>> 3;
    switch (key & 7) {
      case 0:
        fields.push([field, varint()]);
        break;
      case 1:
        fields.push([field, take(8)]);
        break;
      case 2:
        fields.push([field, take(Number(varint()))]);
        break;
      case 5:
        fields.push([field, take(4)]);
        break;
      default:
        throw new Error(`ONNX: unsupported wire type ${key & 7}`);
    }
  }
  return fields;
}

const text = new TextDecoder();
const str = (v: bigint | Uint8Array) => (typeof v === "bigint" ? "" : text.decode(v));
const int = (v: bigint) => Number(BigInt.asIntN(64, v));

function ints(v: bigint | Uint8Array): number[] {
  if (typeof v === "bigint") return [int(v)];
  return decode(prefixPacked(v)).map(([, x]) => int(x as bigint));
}

/** Re-frames packed varints as repeated field-1 varints so `decode` can read them. */
function prefixPacked(packed: Uint8Array): Uint8Array {
  const out: number[] = [];
  let start = 0;
  for (let i = 0; i < packed.length; i++) {
    if (packed[i]! & 0x80) continue;
    out.push(0x08, ...packed.subarray(start, i + 1));
    start = i + 1;
  }
  return Uint8Array.from(out);
}

interface Tensor {
  name: string;
  dims: number[];
  data: Float32Array;
}

const FLOAT = 1;

function tensor(buf: Uint8Array): Tensor {
  let name = "";
  let type = 0;
  const dims: number[] = [];
  let raw: Uint8Array | null = null;
  let floats: Uint8Array | null = null;
  for (const [f, v] of decode(buf)) {
    if (f === 1) dims.push(...ints(v));
    else if (f === 2) type = int(v as bigint);
    else if (f === 8) name = str(v);
    else if (f === 9) raw = v as Uint8Array;
    else if (f === 4) floats = v as Uint8Array;
    else if (f === 13) throw new Error(`ONNX: tensor ${name || "?"} uses external data`);
  }
  if (type !== FLOAT) return { name, dims, data: new Float32Array(0) };
  const bytes = raw ?? floats ?? new Uint8Array(0);
  // slice() copies into a fresh, aligned buffer. ONNX is little-endian, like
  // every platform a browser runs on.
  const data = new Float32Array(bytes.slice().buffer);
  const expected = dims.reduce((a, b) => a * b, 1);
  if (data.length !== expected) throw new Error(`ONNX: ${name} has ${data.length} values, expected ${expected}`);
  return { name, dims, data };
}

interface Attribute {
  name: string;
  f?: number;
  i?: number;
  ints?: number[];
}

function attribute(buf: Uint8Array): Attribute {
  const a: Attribute = { name: "" };
  for (const [f, v] of decode(buf)) {
    if (f === 1) a.name = str(v);
    else if (f === 2) a.f = new DataView((v as Uint8Array).slice().buffer).getFloat32(0, true);
    else if (f === 3) a.i = int(v as bigint);
    else if (f === 8) (a.ints ??= []).push(...ints(v));
  }
  return a;
}

interface Node {
  op: string;
  inputs: string[];
  outputs: string[];
  attrs: Map<string, Attribute>;
}

function node(buf: Uint8Array): Node {
  const n: Node = { op: "", inputs: [], outputs: [], attrs: new Map() };
  for (const [f, v] of decode(buf)) {
    if (f === 1) n.inputs.push(str(v));
    else if (f === 2) n.outputs.push(str(v));
    else if (f === 4) n.op = str(v);
    else if (f === 5) {
      const a = attribute(v as Uint8Array);
      n.attrs.set(a.name, a);
    }
  }
  return n;
}

/** Every operator SignNet's export uses. Anything else means a different architecture. */
const SIGNNET_OPS = new Set([
  "Constant", "Slice", "Shape", "ConstantOfShape", "Sub", "Concat", "MatMul", "Add",
  "LayerNormalization", "Div", "Erf", "Mul", "Transpose", "Conv", "Softmax",
  "ReduceSum", "ReduceMax", "Gemm",
]);

function fail(why: string): never {
  throw new Error(`sign_model.onnx is not the SignNet architecture this app runs: ${why}`);
}

/** Parses `sign_model.onnx` (as exported by the training notebook) into SignNet weights. */
export function signNetFromOnnx(bytes: Uint8Array): SignNetWeights {
  const graphField = decode(bytes).find(([f]) => f === 7);
  if (!graphField || typeof graphField[1] === "bigint") fail("no graph");

  const nodes: Node[] = [];
  const init = new Map<string, Tensor>();
  for (const [f, v] of decode(graphField[1])) {
    if (f === 1) nodes.push(node(v as Uint8Array));
    else if (f === 5) {
      const t = tensor(v as Uint8Array);
      init.set(t.name, t);
    }
  }

  for (const n of nodes) if (!SIGNNET_OPS.has(n.op)) fail(`unexpected operator ${n.op}`);
  const weight = (name: string | undefined, ...dims: number[]): Float32Array => {
    const t = name === undefined ? undefined : init.get(name);
    if (!t) fail(`missing weight ${name}`);
    if (t.dims.length !== dims.length || t.dims.some((d, i) => d !== dims[i])) {
      fail(`${t.name} has shape [${t.dims}], expected [${dims}]`);
    }
    return t.data;
  };
  const ofOp = (op: string) => nodes.filter((n) => n.op === op);
  /** The bias added right after a MatMul: the other, initializer, input of the Add consuming it. */
  const biasAfter = (n: Node) => {
    const add = nodes.find((m) => m.op === "Add" && m.inputs.includes(n.outputs[0]!));
    return add?.inputs.find((i) => init.has(i));
  };

  const matmuls = ofOp("MatMul");
  if (matmuls.length !== 2) fail(`${matmuls.length} MatMul nodes, expected 2`);
  const [inp, attn] = matmuls as [Node, Node];
  const inDims = init.get(inp.inputs[1]!)?.dims ?? fail("input projection is not a weight");
  const [nIn, width] = inDims as [number, number];

  const norms = ofOp("LayerNormalization");
  if (norms.length !== 1) fail("expected one LayerNormalization");
  const norm = norms[0]!;

  const convs = ofOp("Conv");
  const depthwise = convs.filter((c) => c.attrs.get("group")?.i === width);
  const pointwise = convs.filter((c) => c.attrs.get("kernel_shape")?.ints?.[0] === 1);
  if (depthwise.length === 0 || depthwise.length !== pointwise.length || convs.length !== 2 * depthwise.length) {
    fail("convolutions are not depthwise + pointwise pairs");
  }
  const kernel = depthwise[0]!.attrs.get("kernel_shape")?.ints?.[0] ?? fail("no kernel size");
  for (const c of convs) {
    const k = c.attrs.get("kernel_shape")?.ints?.[0] ?? 0;
    if ((c.attrs.get("pads")?.ints?.[0] ?? 0) !== k >> 1) fail("convolution padding is not 'same'");
    if (c.attrs.get("strides")?.ints?.some((s) => s !== 1)) fail("strided convolution");
    if (c.attrs.get("dilations")?.ints?.some((d) => d !== 1)) fail("dilated convolution");
  }

  const gemms = ofOp("Gemm");
  if (gemms.length !== 1 || gemms[0]!.attrs.get("transB")?.i !== 1) fail("expected one Gemm head with transB=1");
  const head = gemms[0]!;
  const nClasses = init.get(head.inputs[1]!)?.dims[0] ?? fail("head is not a weight");

  return {
    nIn,
    width,
    nClasses,
    kernel,
    inW: weight(inp.inputs[1], nIn, width),
    inB: weight(biasAfter(inp), width),
    lnG: weight(norm.inputs[1], width),
    lnB: weight(norm.inputs[2], width),
    lnEps: norm.attrs.get("epsilon")?.f ?? 1e-5,
    blocks: depthwise.map((dw, i) => ({
      dwW: weight(dw.inputs[1], width, 1, kernel),
      dwB: weight(dw.inputs[2], width),
      pwW: weight(pointwise[i]!.inputs[1], width, width, 1),
      pwB: weight(pointwise[i]!.inputs[2], width),
    })),
    attnW: weight(attn.inputs[1], width, 1),
    attnB: weight(biasAfter(attn), 1)[0]!,
    headW: weight(head.inputs[1], nClasses, 2 * width),
    headB: weight(head.inputs[2], nClasses),
  };
}
