// cypress/e2e/critical-flows.cy.js - End-to-end tests for critical user flows

describe('Critical User Flows', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('User Registration', () => {
    it('should allow new user registration', () => {
      cy.visit('/register');

      cy.get('input[name="username"]').type('newuser');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');

      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/login');
      cy.contains('Registration successful').should('be.visible');
    });

    it('should show validation errors for invalid registration', () => {
      cy.visit('/register');

      cy.get('button[type="submit"]').click();

      cy.contains('Username is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });
  });

  describe('User Login', () => {
    it('should allow user to login with valid credentials', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');

      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
      cy.contains('Welcome back').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');

      cy.get('button[type="submit"]').click();

      cy.contains('Invalid credentials').should('be.visible');
    });
  });

  describe('Post CRUD Operations', () => {
    beforeEach(() => {
      // Login before post tests
      cy.login('test@example.com', 'password123');
    });

    it('should create a new post', () => {
      cy.visit('/posts/create');

      cy.get('input[name="title"]').type('New Test Post');
      cy.get('textarea[name="content"]').type('This is a test post content');
      cy.get('select[name="category"]').select('technology');

      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/posts');
      cy.contains('New Test Post').should('be.visible');
      cy.contains('Post created successfully').should('be.visible');
    });

    it('should edit an existing post', () => {
      cy.visit('/posts');
      
      cy.get('[data-testid="post-item"]').first().click();
      cy.get('[data-testid="edit-post"]').click();

      cy.get('input[name="title"]').clear().type('Updated Post Title');
      cy.get('button[type="submit"]').click();

      cy.contains('Post updated successfully').should('be.visible');
      cy.contains('Updated Post Title').should('be.visible');
    });

    it('should delete a post', () => {
      cy.visit('/posts');
      
      cy.get('[data-testid="post-item"]').first().within(() => {
        cy.get('[data-testid="delete-post"]').click();
      });

      cy.get('[data-testid="confirm-delete"]').click();

      cy.contains('Post deleted successfully').should('be.visible');
    });
  });

  describe('Navigation and Routing', () => {
    it('should navigate between pages correctly', () => {
      cy.visit('/');

      cy.get('nav').contains('Posts').click();
      cy.url().should('include', '/posts');

      cy.get('nav').contains('Home').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should show 404 page for unknown routes', () => {
      cy.visit('/unknown-route', { failOnStatusCode: false });

      cy.contains('Page Not Found').should('be.visible');
      cy.contains('Go Home').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });
});