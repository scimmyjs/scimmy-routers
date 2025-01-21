import sinon from "sinon";
import request from "supertest";
import SCIMMY from "scimmy";
import {withStubs} from "../hooks/middleware.js";
import {expectListResponse, expectBadRequest, expectNotFound} from "../hooks/responses.js";
import {Search} from "#@/routers/search.js";

const suite = (app, resources = [], path = "") => {
    const sandbox = sinon.createSandbox();
    
    beforeEach(() => sandbox.stub(SCIMMY.Resources, "declared").returns(resources));
    beforeEach(() => Object.values(resources).forEach((Resource) => sandbox.stub(Resource.prototype, "read").returns(new SCIMMY.Messages.ListResponse())));
    afterEach(() => sandbox.restore());
    
    specify(`POST ${path}/.search`, async () => {
        await expectBadRequest(request(app).post(`${path}/.search`), "invalidSyntax", "SearchRequest request body messages must exclusively specify schema as 'urn:ietf:params:scim:api:messages:2.0:SearchRequest'");
        await expectListResponse(request(app).post(`${path}/.search`).send({schemas: ["urn:ietf:params:scim:api:messages:2.0:SearchRequest"]}), []);
    });
    
    specify.skip(`GET ${path}/.search`, () => expectNotFound(request(app).get(`${path}/.search`)));
    specify.skip(`PUT ${path}/.search`, () => expectNotFound(request(app).put(`${path}/.search`)));
    specify.skip(`PATCH ${path}/.search`, () => expectNotFound(request(app).patch(`${path}/.search`)));
    specify.skip(`DELETE ${path}/.search`, () => expectNotFound(request(app).del(`${path}/.search`)));
};

describe("Search middleware", () => {
    it("should not expect 'context' method argument to be defined", async () => {
        await expectBadRequest(request(withStubs(new Search(SCIMMY.Resources.User))).post("/.search"), "invalidSyntax", "SearchRequest request body messages must exclusively specify schema as 'urn:ietf:params:scim:api:messages:2.0:SearchRequest'");
    });
    
    suite(withStubs(new Search(() => {})), [SCIMMY.Resources.User]);
});

export default suite;