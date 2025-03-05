const mongoose = require('mongoose');
const Product = require('../models/productModel');
const { getProducts } = require('../controllers/productController');

describe('Product Controller', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should fetch all products', async () => {
    const mockProducts = [{ name: 'Test Product', price: 10 }];
    jest.spyOn(Product, 'find').mockResolvedValue(mockProducts);

    const req = {};
    const res = { json: jest.fn() };

    await getProducts(req, res);
    expect(res.json).toHaveBeenCalledWith(mockProducts);
  });
});