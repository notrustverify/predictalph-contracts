"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundParticipation = void 0;
const express_1 = require("express");
const ioredis_1 = require("ioredis");
class RoundParticipation {
    constructor() {
        this.router = (0, express_1.Router)();
        this.init();
    }
    static getRound(redisClient, address) {
        if (!RoundParticipation.keyExists(redisClient, address)) {
            return [];
        }
        redisClient.sdiff(address, "claim" + address, async (err, result) => {
            if (err) {
                console.error(err);
            }
            else {
                console.log(result);
                //await redis.del(address)
                return result;
            }
        });
    }
    static keyExists(redisClient, key) {
        redisClient.exists(key, (err, reply) => {
            if (err) {
                console.error(err);
            }
            else {
                if (reply === 1) {
                    return true;
                }
                else {
                    return false;
                }
            }
        });
        return false;
    }
    async getEpochParticipation(req, res, next) {
        console.log(req.params.address);
        const address = req.params.address;
        //const roundUser = this.getRound(req.params.address)
        let roundUser = RoundParticipation.getRound(this.redisClient, address);
        console.log(roundUser);
        if (roundUser.length > 0) {
            res.status(200)
                .send({
                message: 'Success',
                status: res.status,
                roundUser
            });
        }
        else {
            res.status(404)
                .send({
                message: 'No round played found for this address',
                status: res.status
            });
        }
    }
    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    init() {
        this.redisClient = new ioredis_1.Redis();
        this.router.get("/:address", this.getEpochParticipation);
    }
}
exports.RoundParticipation = RoundParticipation;
// Create the HeroRouter, and export its configured Express.Router
const roundUser = new RoundParticipation();
roundUser.init();
exports.default = roundUser.router;
