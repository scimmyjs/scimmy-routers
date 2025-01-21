import sinon from "sinon";
import request from "supertest";
import SCIMMY from "scimmy";
import {withStubs} from "../hooks/middleware.js";
import {expectContentType, expectListResponse, expectNotFilterable, expectNotFound} from "../hooks/responses.js";
import {ResourceTypes} from "#@/routers/resourcetypes.js";

const suite = (app, resources = []) => {
    const sandbox = sinon.createSandbox();
    const [R] = Object.values(resources);
    
    beforeEach(() => sandbox.stub(SCIMMY.Resources.ResourceType, "basepath").returns("/ResourceTypes"));
    beforeEach(() => sandbox.stub(SCIMMY.Resources, "declared").withArgs(R.name).returns(R).withArgs().returns(resources));
    afterEach(() => sandbox.restore());
    
    specify("GET /ResourceTypes", () => expectListResponse(request(app).get("/ResourceTypes"), JSON.parse(JSON.stringify(Object.values(resources).map((R) => new SCIMMY.Schemas.ResourceType(R.describe(), "/ResourceTypes"))))));
    specify("GET /ResourceTypes?filter", () => expectNotFilterable("ResourceType", request(app).get("/ResourceTypes")));
    specify("GET /ResourceTypes/:id", async () => {
        await expectNotFound(request(app).get("/ResourceTypes/test"), "ResourceType test not found");
        await expectContentType(request(app).get(`/ResourceTypes/${R.name}`)).expect(200, JSON.parse(JSON.stringify(new SCIMMY.Schemas.ResourceType(R.describe(), "/ResourceTypes"))));
    });
    specify("PUT /ResourceTypes", () => expectNotFound(request(app).put("/ResourceTypes")));
    specify("POST /ResourceTypes", () => expectNotFound(request(app).post("/ResourceTypes")));
    specify("PATCH /ResourceTypes", () => expectNotFound(request(app).patch("/ResourceTypes")));
    specify("DELETE /ResourceTypes", () => expectNotFound(request(app).del("/ResourceTypes")));
};

describe("ResourceTypes middleware", () => suite(withStubs(new ResourceTypes()), [SCIMMY.Resources.User]));

export default suite;