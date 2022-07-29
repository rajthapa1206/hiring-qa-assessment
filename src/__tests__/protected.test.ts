import Server, { server } from "../server";
import * as supertest from "supertest";
import fetch from "node-fetch";
import { V1_API_DOMAIN } from "../constants";
export const testServer = supertest(Server);

jest.mock("node-fetch");
describe("Protected endpoint", () => {
    afterAll(() => {
        jest.clearAllMocks();
    });

    it("Succeed", async () => {
        expect.assertions(2);
        const responseMiddleware = { response: "Ok" };
        const responseProtected = { response: "Ok in Protected call" };
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(responseMiddleware),
            status: 200,
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(responseProtected),
            status: 200,
        });
        const response = await testServer
            .post(`/v3/protected`)
            .send({
                operation: "SEND",
                count: 14,
                text: "asdfsdf",
            })
            .set("Content-type", "application/json");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(responseProtected);
    });

    it("Succeed with maxed allowed text value length 4096 characters", async () => {
        expect.assertions(2);
        const longText = [...Array(4096).fill("a")].join("");
        const responseMiddleware = { response: "Ok" };
        const responseProtected = { response: "Ok in Protected call" };
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(responseMiddleware),
            status: 200,
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(responseProtected),
            status: 200,
        });
        const response = await testServer
            .post(`/v3/protected`)
            .send({
                operation: "SEND",
                count: 13,
                text: longText,
            })
            .set("Content-type", "application/json");
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(responseProtected);
    });

    it("Authorization failed by middleware", async () => {
        expect.assertions(2);
        fetch.mockResolvedValueOnce({
            status: 401,
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ response: "Ok" }),
            status: 200,
        });
        const response = await testServer
            .post(`/v3/protected`)
            .send({
                operation: "SEND",
                count: 10,
                text: "asdfsdf",
            })
            .set("Content-type", "application/json");
        console.log(response.status, "status");
        expect(response.status).toBe(401);
        // To verify that url is from middleware not from protected controller V1 api
        expect(fetch).toHaveBeenCalledWith(`${V1_API_DOMAIN}/v1/auth/validate`, {
            headers: undefined,
        });
    });

    it("500 response code - Text value length is too long", async () => {
        expect.assertions(1);
        const invalidText = [...Array(4097).fill("a")].join("");
        const responseMiddleware = { response: "Ok" };
        const responseProtected = { response: "Ok in Protected call" };
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(responseMiddleware),
            status: 200,
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(responseProtected),
            status: 200,
        });
        const response = await testServer
            .post(`/v3/protected`)
            .send({
                operation: "SEND",
                count: 11,
                text: invalidText,
            })
            .set("Content-type", "application/json");
        expect(response.status).toBe(500);
    });
});

afterAll(() => {
    server.close();
});