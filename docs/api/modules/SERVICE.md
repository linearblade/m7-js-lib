# Module: lib.service

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [lib.service](./SERVICE.md)

Source: `src/lib/service.js`

In-memory service registry with conventional start/stop dispatch.

## Exported Functions

* [`set`](../functions/service/set.md) - Register a service by name.
* [`get`](../functions/service/get.md) - Retrieve a service by name.
* [`start`](../functions/service/start.md) - Start a named service when it exposes `start()`.
* [`stop`](../functions/service/stop.md) - Stop a named service when it exposes `stop()`.
* [`list`](../functions/service/list.md) - List registered service names.

## Exported Properties

* `services` - Backing service registry object exposed for direct inspection.

## Related

* Module index -> [./INDEX.md](./INDEX.md)
* Function index -> [../functions/INDEX.md](../functions/INDEX.md)
* API index -> [../INDEX.md](../INDEX.md)

