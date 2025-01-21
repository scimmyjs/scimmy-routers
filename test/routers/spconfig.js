import sinon from "sinon";
import request from "supertest";
import SCIMMY from "scimmy";
import {withStubs} from "../hooks/middleware.js";
import {expectContentType, expectNotFilterable, expectNotFound} from "../hooks/responses.js";
import {ServiceProviderConfig} from "#@/routers/spconfig.js";

const suite = (app) => {
    const sandbox = sinon.createSandbox();
    
    beforeEach(() => sandbox.stub(SCIMMY.Resources.ServiceProviderConfig, "basepath").returns("/ServiceProviderConfig"));
    afterEach(() => sandbox.restore());
    
    specify("GET /ServiceProviderConfig", async () => {
        await expectContentType(request(app).get("/ServiceProviderConfig")).expect(200, {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
            meta: {resourceType: "ServiceProviderConfig", location: "/ServiceProviderConfig"},
            ...JSON.parse(JSON.stringify(SCIMMY.Config.get()))
        });
        
        await expectNotFilterable("ServiceProviderConfig", request(app).get("/ServiceProviderConfig"));
    });
    
    specify("GET /ServiceProviderConfig/:id", () => expectNotFound(request(app).get("/ServiceProviderConfig/test")));
    specify("PUT /ServiceProviderConfig", () => expectNotFound(request(app).put("/ServiceProviderConfig")));
    specify("POST /ServiceProviderConfig", () => expectNotFound(request(app).post("/ServiceProviderConfig")));
    specify("PATCH /ServiceProviderConfig", () => expectNotFound(request(app).patch("/ServiceProviderConfig")));
    specify("DELETE /ServiceProviderConfig", () => expectNotFound(request(app).del("/ServiceProviderConfig")));
};

describe("ServiceProviderConfig middleware", () => suite(withStubs(new ServiceProviderConfig())));

export default suite;