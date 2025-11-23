// cypress/support/commands.js - Custom Cypress commands

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

Cypress.Commands.add('createPost', (postData) => {
  cy.request({
    method: 'POST',
    url: '/api/posts',
    body: postData,
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
  });
});

Cypress.Commands.add('deletePost', (postId) => {
  cy.request({
    method: 'DELETE',
    url: `/api/posts/${postId}`,
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
  });
});