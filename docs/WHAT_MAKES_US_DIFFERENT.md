# What Makes m7-js-lib Different

[README](../README.md) -> [Usage TOC](./usage/TOC.md) -> [Architecture Index](./architecture/INDEX.md) -> [API Index](./api/INDEX.md)

m7-js-lib is intentionally opinionated about ergonomics, contracts, and maintainability.

## 1) Singleton by design

The core is intentionally singleton-based. This keeps lifecycle and extension semantics deterministic for downstream libraries.

## 2) Normalization over defensive call-site branching

Helpers are designed to absorb broad input shapes and return stable outputs so application code stays linear.

## 3) Practical performance posture

The project targets real-world performance without sacrificing readability for minor benchmark gains.

## 4) Extension-friendly core runtime

The base library is meant to be extended by additional modules, not replaced.

## 5) Side-effect boundary is explicit

`index.js` is side-effect free. `auto.js` is intentionally side-effectful. This makes lifecycle expectations explicit.

## 6) Contract-first documentation posture

Behavioral contracts are documented for entrypoints and module surfaces to support durable integration and future user docs generation.

---

## See Also

* [README](../README.md)
* [About](./ABOUT.md)
* [Philosophy](./philosophy.md)
* [Entrypoint Contract](./entrypoints-contract.md)
* [Usage TOC](./usage/TOC.md)
* [API Index](./api/INDEX.md)
* [Architecture Index](./architecture/INDEX.md)
