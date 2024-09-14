import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY Me Endpoint Router
 * @since 1.0.0
 * @class SCIMMYRouters.Me
 */
export class Me extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing "Me" endpoint
     * @param {AuthenticationHandler} handler - method to invoke to get ID of authenticated SCIM user
     * @param {AuthenticationContext} [context] - method to invoke to evaluate context passed to SCIMMY handlers
     */
    constructor(handler, context) {
        super({mergeParams: true});
        
        // Respond to GET requests for /Me endpoint
        this.get("/Me", async (req, res, next) => {
            try {
                const id = await handler(req);
                const isDeclared = SCIMMY.Resources.declared(SCIMMY.Resources.User);
                // Only get the authenticated user if Users is declared and handler returns a string
                const user = (isDeclared && typeof id === "string" ? await new SCIMMY.Resources.User(id).read(await context(req)) : false);
                
                // Set the actual location of the user resource, or respond with 501 not implemented
                if (user && user?.meta?.location) res.location(user.meta.location).send(user);
                else next(new SCIMMY.Types.Error(501, null, "Endpoint Not Implemented"));
            } catch (ex) {
                next(ex);
            }
        });
        
        // Respond with 501 not implemented to all other requests for /Me endpoint 
        this.use("/Me", (req, res, next) => {
            next(new SCIMMY.Types.Error(501, null, "Endpoint Not Implemented"));
        });
    }
}