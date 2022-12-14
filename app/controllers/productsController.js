import { request, response } from "express";
import { Product } from "../models/product.js";
import { Stock } from "../models/stock.js";

const productsGet = async (req = request, res = response) => {
    const { type = undefined } = req.query;
    const query = type ? { type } : {};
    const products = await Product.find(query);
    const productsIds = products.map((p) => p.id);

    const [stocks, total] = await Promise.all([
        Stock.find({ product: productsIds }),
        Stock.countDocuments({ product: productsIds }),
    ]);

    res.json({
        stocks,
        meta: { total },
    });
};

const productsPatch = async (req = request, res = response) => {
    const { productId, sizeId, quantity } = req.body;
    const stockObj = await Stock.findOne({ product: productId, size: sizeId });

    if (!stockObj) {
        return res.status(400).json({
            message: "The product does not exist",
        });
    }

    if (!(stockObj.stock >= quantity)) {
        return res.status(400).json({
            message: `Insufficient stock - Total: ${stockObj.stock}`,
        });
    }

    await stockObj.updateOne({ stock: stockObj.stock - quantity });

    res.json({
        product: stockObj.product.name,
        size: stockObj.size.description,
        quantity,
    });
};

export { productsGet, productsPatch };
