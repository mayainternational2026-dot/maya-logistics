---
name: Object storage client-side href construction
description: How to build a fetchable URL from a stored objectPath when linking to uploaded images/videos in the frontend.
---

The object storage template's upload flow returns/stores an `objectPath` like `/objects/uploads/<uuid>`, but the serving route is mounted at `/storage/objects/*path` under the API's `/api` prefix. A raw `<a href={objectPath}>` will 404.

**Rule:** convert the stored path before using it as a link/src: strip the leading `/objects/` and prepend `/api/storage/objects/`, i.e. `` `/api/storage/objects/${objectPath.replace(/^\/objects\//, "")}` ``.

**Why:** the mismatch between where `objectPath` is normalized (relative to `PRIVATE_OBJECT_DIR`) and where the read route is actually mounted is easy to get wrong and fails silently (broken image/video links, no console error beyond a 404).

**How to apply:** whenever a new feature displays/links to an uploaded object storage file, add a small helper (e.g. `toStorageUrl`) at the point of rendering rather than trusting the raw stored path.
