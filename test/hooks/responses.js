export const expectContentType = (req) => req.expect("Content-Type", /application\/scim\+json/);

export const expectListResponse = (req, Resources = []) => expectContentType(req).expect(200, {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    itemsPerPage: 20, startIndex: 1, totalResults: Resources.length,
    Resources
});

export const expectNotFilterable = (name, req) => (
    expectForbidden(req.query({filter: "id pr"}), `${name} does not support retrieval by filter`)
);

export const expectBadRequest = (req, scimType, detail) => expectContentType(req).expect(400, {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: "400", scimType, detail
});

export const expectForbidden = (req, detail) => expectContentType(req).expect(403, {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: "403", detail
});

export const expectNotFound = (req, detail = "Endpoint Not Found") => expectContentType(req).expect(404, {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: "404", detail
});

export const expectInternalServerError = (req, detail = "Error") => expectContentType(req).expect(500, {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: "500", detail
});

export const expectNotImplemented = (req, detail = "Endpoint Not Implemented") => expectContentType(req).expect(501, {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: "501", detail
});