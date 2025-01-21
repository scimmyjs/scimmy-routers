import sinon from "sinon";
import request from "supertest";
import SCIMMY from "scimmy";
import {withStubs} from "../hooks/middleware.js";
import {expectContentType, expectListResponse, expectNotFilterable, expectNotFound} from "../hooks/responses.js";
import {Schemas} from "#@/routers/schemas.js";

const suite = (app, schemas = []) => {
    const sandbox = sinon.createSandbox();
    const [S] = schemas;
    
    beforeEach(() => sandbox.stub(SCIMMY.Resources.Schema, "basepath").returns("/Schemas"));
    beforeEach(() => sandbox.stub(SCIMMY.Schemas, "declared").withArgs(S.id).returns(S).withArgs().returns(schemas));
    afterEach(() => sandbox.restore());
    
    specify("GET /Schemas", async () => {
        await expectListResponse(request(app).get("/Schemas"), JSON.parse(JSON.stringify(schemas.map((S) => S.describe("/Schemas")))));
        await expectNotFilterable("Schema", request(app).get("/Schemas"));
    });
    
    specify("GET /Schemas/:id", async () => {
        await expectNotFound(request(app).get("/Schemas/test"), "Schema test not found");
        await expectContentType(request(app).get(`/Schemas/${S.id}`)).expect(200, JSON.parse(JSON.stringify(S.describe("/Schemas"))));
    });
    
    specify("PUT /Schemas", () => expectNotFound(request(app).put("/Schemas")));
    specify("POST /Schemas", () => expectNotFound(request(app).post("/Schemas")));
    specify("PATCH /Schemas", () => expectNotFound(request(app).patch("/Schemas")));
    specify("DELETE /Schemas", () => expectNotFound(request(app).del("/Schemas")));
};

describe("Schemas middleware", () => suite(withStubs(new Schemas()), [SCIMMY.Schemas.User.definition]));

export default suite;