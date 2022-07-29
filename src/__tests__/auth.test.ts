import Server, { server } from "../server";
import * as supertest from "supertest";
import fetch from "node-fetch";
//import exp from "constants";
export const testServer = supertest(Server);

jest.mock("node-fetch");
describe("Auth endpoint", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("Succeed - Authorized Login", async () => {
        expect.assertions(2);
        const successResponse = {
            id: 2,
            name: "Steve",
            token:
                "abJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5d",
        };
        fetch.mockResolvedValue({
            json: () => Promise.resolve(successResponse),
            status: 200,
        });
        const response = await testServer
            .post(`/v3/auth/login`)
            .send({ username: "test", password: "test" })
            .set("Content-type", "application/json");
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            ...successResponse,
            authorized: true,
        });
    });

    it("Unauthorized Login with wrong credentials", async () => {
        expect.assertions(2);
        fetch.mockRejectedValue({ status: 401 });
        const response = await testServer
            .post(`/v3/auth/login`)
            .send({ username: "test", password: "invalidPassword" })
            .set("Content-type", "application/json");
        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({});
    });

    it("Error in Login request api", async () => {
        expect.assertions(1);
        fetch.mockImplementation(() => {
            throw new Error("login request to with fails with error...");
        });
        const response = await testServer
            .post(`/v3/auth/login`)
            .send({ username: "test", password: "test" })
            .set("Content-type", "application/json");
        expect(response.status).toBe(500);
    });
});

afterAll(() => {
    server.close();
});