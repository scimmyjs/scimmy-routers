import sinon from "sinon";
import request from "supertest";
import SCIMMY from "scimmy";
import {withStubs} from "../hooks/middleware.js";
import {expectContentType, expectNotFound, expectInternalServerError, expectNotImplemented} from "../hooks/responses.js";
import {Bulk} from "#@/routers/bulk.js";

const suite = (app) => {
    const sandbox = sinon.createSandbox();
    
    afterEach(() => sandbox.restore());
    
    specify("GET /Bulk", () => expectNotFound(request(app).get("/Bulk")));
    specify("GET /Bulk/:id", () => expectNotFound(request(app).get("/Bulk/test")));
    specify("PUT /Bulk", () => expectNotFound(request(app).put("/Bulk")));
    specify("PUT /Bulk/:id", () => expectNotFound(request(app).put("/Bulk/test")));
    
    specify("POST /Bulk/:id", () => expectNotFound(request(app).post("/Bulk/test").send({})));
    specify("POST /Bulk", async () => {
        sandbox.stub(SCIMMY.Resources, "declared").returns({});
        sandbox.stub(SCIMMY.Config, "get")
            .onFirstCall().returns({bulk: {}})
            .onSecondCall().returns({bulk: {supported: true, maxOperations: 1000, maxPayloadSize: 0}})
            .onThirdCall().returns({bulk: {supported: true, maxOperations: 1000, maxPayloadSize: 1048576}})
            .throws();
        
        await expectNotImplemented(request(app).post("/Bulk").send({}));
        await expectContentType(request(app).post("/Bulk").send({})).expect(413, {schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "413", detail: "The size of the bulk operation exceeds maxPayloadSize limit (0)"});
        await expectContentType(request(app).post("/Bulk").send({schemas: ["urn:ietf:params:scim:api:messages:2.0:BulkRequest"], Operations: [{method: "delete", path: "/"}]})).expect(200);
        await expectInternalServerError(request(app).post("/Bulk").send({}));
    });
    
    specify("PATCH /Bulk", () => expectNotFound(request(app).patch("/Bulk").send({})));
    specify("PATCH /Bulk/:id", () => expectNotFound(request(app).patch("/Bulk/test").send({})));
    specify("DELETE /Bulk", () => expectNotFound(request(app).del("/Bulk")));
    specify("DELETE /Bulk/:id", () => expectNotFound(request(app).del("/Bulk/test")));
};

describe("Bulk middleware", () => suite(withStubs(new Bulk(() => {}))));

export default suite;