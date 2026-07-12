
import { test, expect } from '@playwright/test';

//GET-HTTP method
test('gets a singel product', async({ request }) => {

    const response = await request.get('https://dummyjson.com/products/1');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.title).toBe('Essence Mascara Lash Princess');
});

//POST-HTTP method
test('creates a product', async ({ request }) => {
    const response = await request.post('https://dummyjson.com/products/add', {
        data: {
            title:'Test Product',
        },
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.title).toBe('Test Product');
    console.log(body.id);//gives 195 as id
} )

//PUT/PATCH - HTTP method
test('updates a product', async ({ request}) => {
    const response = await request.put('https://dummyjson.com/products/1',{
        data: {
            title: 'updated title',
        },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.title).toBe('updated title');
    console.log(body.id);
})

//DELETE -HTTP method
test('deletes a product', async ({ request })=> {
    const response = await request.delete('https://dummyjson.com/products/1');
    
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.isDeleted).toBe(true);
})

//Failure Case
test('returns 404 for non-existent product', async ({ request })=> {
    const response = await request.get('https://dummyjson.com/products/9999999');
    expect(response.status()).toBe(404);
});

//Chaining Example-test if testperson is logged/or/not
test('logs in and fetches the authenticated user', async({ request })=> {
    const loginResponse = await request.post('https://dummyjson.com/auth/login',{
        data: {
            username: 'emilys',
            password:'emilyspass',
        },
    });
    expect(loginResponse.status()).toBe(200);

    const loginBody = await loginResponse.json();
    const token = loginBody.accessToken;

    const meResponse = await request.get('https://dummyjson.com/auth/me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    expect(meResponse.status()).toBe(200);

    const meBody = await meResponse.json();
    expect(meBody.username).toBe('emilys');
});

