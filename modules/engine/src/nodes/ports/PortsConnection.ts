import { PortLocation } from "./IPort.js";

/**
 * Stores connection information between 2 ports. Safe to use for saving to JSON.
 */
export interface PortsConnection {
    /**
     * Location of the port to connect from.
     */
    from: PortLocation;

    /**
     * Location of the port to connect to.
     */
    to: PortLocation;
}