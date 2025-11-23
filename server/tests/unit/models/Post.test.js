// server/tests/unit/models/Post.test.js - Unit tests for Post model
const mongoose = require('mongoose');
const Post = require('../../../src/models/Post');

describe('Post Model', () => {
  it('should create a post with valid fields', async () => {
    const postData = {
      title: 'Test Post',
      content: 'This is a test post content',
      author: new mongoose.Types.ObjectId(),
      category: 'tech',
      slug: 'test-post',
    };

    const post = new Post(postData);
    const savedPost = await post.save();

    expect(savedPost._id).toBeDefined();
    expect(savedPost.title).toBe(postData.title);
    expect(savedPost.content).toBe(postData.content);
    expect(savedPost.slug).toBe(postData.slug);
    expect(savedPost.createdAt).toBeDefined();
    expect(savedPost.updatedAt).toBeDefined();
  });

  it('should require title field', async () => {
    const postData = {
      content: 'Content without title',
      author: new mongoose.Types.ObjectId(),
      category: 'lifestyle',
    };

    const post = new Post(postData);
    
    let error;
    try {
      await post.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.title).toBeDefined();
  });

  it('should require author field', async () => {
    const postData = {
      title: 'Post without author',
      content: 'Content without author',
      category: 'business',
    };

    const post = new Post(postData);
    
    let error;
    try {
      await post.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.author).toBeDefined();
  });

  it('should generate slug from title if not provided', async () => {
    const postData = {
      title: 'Test Post Title With Spaces',
      content: 'This is a test post content',
      author: new mongoose.Types.ObjectId(),
      category: 'travel',
    };

    const post = new Post(postData);
    const savedPost = await post.save();

    expect(savedPost.slug).toBe('test-post-title-with-spaces');
  });

  it('should not allow duplicate slugs', async () => {
    const postData = {
      title: 'Test Post',
      content: 'This is a test post content',
      author: new mongoose.Types.ObjectId(),
      category: 'other',
      slug: 'duplicate-slug',
    };

    const post1 = new Post(postData);
    await post1.save();

    const post2 = new Post({ 
      ...postData, 
      author: new mongoose.Types.ObjectId(),
      title: 'Different Title' 
    });
    
    let error;
    try {
      await post2.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Duplicate key error
  });

  it('should trim title and content', async () => {
    const postData = {
      title: '  Test Post With Spaces  ',
      content: '  Content with spaces  ',
      author: new mongoose.Types.ObjectId(),
      category: 'tech',
    };

    const post = new Post(postData);
    const savedPost = await post.save();

    expect(savedPost.title).toBe('Test Post With Spaces');
    expect(savedPost.content).toBe('Content with spaces');
  });

  it('should validate status enum values', async () => {
    const postData = {
      title: 'Test Post',
      content: 'Test Content',
      author: new mongoose.Types.ObjectId(),
      category: 'lifestyle',
      status: 'invalid-status'
    };

    const post = new Post(postData);
    
    let error;
    try {
      await post.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });
});