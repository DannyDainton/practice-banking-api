const request = require('supertest');

const apiUrl = process.env.API_URL || 'http://localhost:3000';

describe('Banking API Endpoints', () => {
    it('should ping the health check endpoint', async () => {
        const res = await request(apiUrl)
            .get('/health')
            .send();
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ status: "ok" });
    });

    it('should fetch all users', async () => {
        const res = await request(apiUrl)
            .get('/users')
            .send();

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
    });

    it('should create a new user', async () => {
        const res = await request(apiUrl)
            .post('/user')
            .send({
                name: 'Test User',
                initialBalance: 1000
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('userId');
    });

    it('should get a single user', async () => {
        const user = await request(apiUrl)
            .post('/user')
            .send({
                name: 'Test Single User',
                initialBalance: 1000
            });

        const userId = user.body.userId;

        const res = await request(apiUrl)
            .get(`/user/${userId}`)
            .send();

            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toEqual(userId);
            expect(res.body.name).toEqual('Test Single User');
            expect(res.body.balance).toEqual(1000);
    });


    it('should delete a user', async () => {
        const user = await request(apiUrl)
            .post('/user')
            .send({
                name: 'User to delete',
                initialBalance: 500
            });

        const userId = user.body.userId;

        const res = await request(apiUrl)
            .delete(`/user/${userId}`)
            .send();

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('User deleted successfully');
    });

    it('should fetch all transactions', async () => {
        const res = await request(apiUrl)
            .get('/transactions')
            .send();

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
    });
});
