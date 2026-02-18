# m7-js-lib

*Normalization-first singleton utility runtime for modern JavaScript*

## Introduction

`m7-js-lib` is a modernization effort of roughly 25 years of JavaScript utility work.

It is a general-purpose frontend core library designed for ergonomic APIs, predictable contracts, and resilient type normalization. It is intentionally singleton-based and designed to be extended by additional modules layered onto the core.

The project is not benchmark-chasing software. It is built for practical performance with high readability and low integration friction.

---

## Navigation

If you are new to the project, the recommended reading order is:

1. **About m7-js-lib** -> [docs/ABOUT.md](docs/ABOUT.md)
2. **Introduction** -> [docs/usage/INTRODUCTION.md](docs/usage/INTRODUCTION.md)
3. **Quick Start** -> [docs/usage/QUICKSTART.md](docs/usage/QUICKSTART.md)
4. **Usage TOC** -> [docs/usage/TOC.md](docs/usage/TOC.md)
5. **Architecture Index** -> [docs/architecture/INDEX.md](docs/architecture/INDEX.md)
6. **API Index** -> [docs/api/INDEX.md](docs/api/INDEX.md)

Related documents:

* **Entrypoint Contract (`index.js`, `auto.js`)** -> [docs/entrypoints-contract.md](docs/entrypoints-contract.md)
* **LLM API Contract** -> [docs/api/M7_JS_LIB_API_CONTRACT.md](docs/api/M7_JS_LIB_API_CONTRACT.md)
* **Philosophy** -> [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md)
* **Use Policy** -> [docs/USE_POLICY.md](docs/USE_POLICY.md)
* **AI Disclosure** -> [docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md)
* **What Makes m7-js-lib Different** -> [docs/WHAT_MAKES_US_DIFFERENT.md](docs/WHAT_MAKES_US_DIFFERENT.md)
* **Requirements** -> [docs/usage/REQUIREMENTS.md](docs/usage/REQUIREMENTS.md)

---

## Motivation

m7-js-lib exists to reduce repetitive defensive code and integration glue in real frontend systems.

1. Keep call sites linear by normalizing uncertain input centrally.
2. Provide stable helper contracts that are resilient under partial or malformed input.
3. Preserve readability by avoiding unnecessary optimization complexity.
4. Support long-lived codebases where ergonomics and clarity matter as much as runtime speed.
5. Provide a stable singleton core that other m7 libraries can extend.

---

## What This Library Guarantees

* Singleton by intent.
* Side-effect-free import from `src/index.js`.
* Optional import-time initialization from `src/auto.js`.
* Explicit and guarded lifecycle through `init()`.
* Normalization/coercion-first helper posture across core modules.
* Practical, production-ready performance without readability sacrifice.

---

## Quick Example

```js
import lib, { init } from "./src/index.js";

init();

const n = lib.number.toInt("42");
const yes = lib.bool.yes("true");
```

```js
import lib from "./src/auto.js";

const parts = lib.array.to("a b c", /\s+/);
```

---

## Core Concepts

### Singleton Runtime

There is one `lib` object per loaded module instance. Multi-instance factory mode is out of scope by design.

### Normalization-First Utilities

Core helpers prioritize total or near-total conversion behavior so consumers can write less defensive branching code.

### Explicit Lifecycle Boundaries

`index.js` gives explicit lifecycle control. `auto.js` exists for convenience when import-time readiness is preferred.

### Extension-Friendly Posture

The core library is intentionally structured so additional modules can attach behavior without replacing the base model.

---

## What This Library Does Not Do

It does not:

* provide a non-singleton factory model
* own application rendering architecture
* chase maximal micro-benchmark wins at readability cost
* replace domain-specific application logic

---

## Documentation Map

* Usage docs -> [docs/usage/TOC.md](docs/usage/TOC.md)
* About -> [docs/ABOUT.md](docs/ABOUT.md)
* Architecture docs -> [docs/architecture/INDEX.md](docs/architecture/INDEX.md)
* API docs -> [docs/api/INDEX.md](docs/api/INDEX.md)
* Source entry -> [src/index.js](src/index.js)
* Auto entry -> [src/auto.js](src/auto.js)

---

## Philosophy

> "Maximum readability and ergonomics with sufficient real-world performance."

See [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md).

---

## License

See [LICENSE.md](LICENSE.md) for full terms.

* Free for personal, non-commercial use
* Commercial licensing available under MTL-10

---

## AI Usage Disclosure

See:

* [docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md)
* [docs/USE_POLICY.md](docs/USE_POLICY.md)

for disclosure and permitted-use guidance.

---

## Feedback / Security

* General licensing inquiries: [legal@m7.org](mailto:legal@m7.org)
* Security issues: [security@m7.org](mailto:security@m7.org)
