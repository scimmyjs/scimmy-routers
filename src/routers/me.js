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
     * @param {Function} handler - method to invoke to get ID of authenticated SCIM user
     */
    constructor(handler) {
        super();
        
        // Respond to GET requests for /Me endpoint
        this.get("/Me", async (req, res) => {
            try {
                let isDeclared = SCIMMY.Resources.declared(SCIMMY.Resources.User),
                    id = await handler(req),
                    // Only get the authenticated user if Users is declared and handler returns a string
                    user = (isDeclared && typeof id === "string" ? await new SCIMMY.Resources.User(id).read() : false);
                
                // Set the actual location of the user resource, or respond with 501 not implemented
                if (user && user?.meta?.location) res.location(user.meta.location).send(user);
                else res.status(501).send();
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
        
        // Respond with 501 not implemented to all other requests for /Me endpoint 
        this.use("/Me", (req, res) => {
            res.status(501).send();
        });
    }
}