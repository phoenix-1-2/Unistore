const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path');
const fs = require('fs');
const Items_Per_Page = 2;
const PDFDocument = require('pdfkit');
exports.getHome = (req, res, next)=>{
    const page = req.query.page;
    let total;
    Product.find().countDocuments().then(totalItems =>{
        total = totalItems;
        return Product.find().skip((page-1)* Items_Per_Page).limit(Items_Per_Page);
    })
    .then((products)=>{
        res.render('index',{
            pageTitle: '',
            products: products,
            isLoggedIn : req.session.isLoggedIn,
            totalItems:total,
            hasNext : Items_Per_Page * page < total,
            hasPrevious : page > 1,
            page : page,
            totalPages : Math.ceil(total / Items_Per_Page)
        })
    })
    
}

exports.getCart = (req, res, next)=>{

    // Exact Location 
    req.user.populate('cart.items.productId').execPopulate().then((populatedUser)=>{
        
        const products = populatedUser.cart.items.map((item)=>{
            return {
                ...item.productId._doc ,
                quantity : item.quantity
            }
        })

        res.render('cart',{
            pageTitle: 'Your Cart',
            products:products,
            isLoggedIn : req.session.isLoggedIn
        })
    })


}

exports.getProduct = (req, res, next)=>{

    const id = req.params.productId;

    Product.findById(id).then((product)=>{
        res.render('product',{
            pageTitle: product.name,
            product:product,
            isLoggedIn : req.session.isLoggedIn
        })
    })
}

exports.getOrders = (req, res, next)=>{
    Order.find({userId:req.user._id}).then(products=>{
        console.log(products);
        res.render('orders',{
            pageTitle:"Your Orders",
            products:products,
            isLoggedIn : req.session.isLoggedIn
        })
    })
}

exports.postOrders = (req, res, next)=>{
    // console.log(req.user.cart.items);
    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];
    
    req.user.populate('cart.items.productId').execPopulate().then((populatedUser)=>{
        
                
        populatedUser.cart.items.map((item)=>{
            const date = new Date();
            console.log(item);
            const order = new Order({
                orderDate : date.getDate() + " " + month[date.getMonth()] + " " + date.getFullYear(),
                productName : item.productId._doc.name,
                productId:item.productId._id,
                userId : req.user,
                quantity:item.quantity,
                price:item.productId.price
            })
            order.save().then(()=>{
                console.log('Order Saved');
            }).catch(err =>{
                res.redirect('/orders');
            })

            req.user.cart.items = [];
            req.user.save().then(()=>{
                res.redirect('/orders');
            }).catch(err =>{
                res.redirect('/orders');
            })
        })

        
    })

    
    

}

exports.postAddCart = (req, res, next)=>{
    const productId = req.body.id;

    const cartArray = [...req.user.cart.items];


    const index = cartArray.findIndex((p)=>productId == p.productId);
    const element = cartArray[index];

    if(!element){
        cartArray.push({
            productId: productId,
            quantity:1
        });
    }
    else{
        cartArray[index].quantity++;
    }
    req.user.cart.items = cartArray;

    req.user.save().then((result)=>{
        console.log('Cart Updated Success');
        res.redirect('/cart');
    }).catch((err)=>{
        res.render('500');
    })


}

exports.postDeleteCart = (req, res,next) =>{
    const id = req.body.id;
    req.user.cart.items = req.user.cart.items.filter(item => item.productId != id);
    req.user.save().then(() =>{
        console.log('Deleted From Cart')
        res.redirect('/cart');
    }).catch(err=>{
        res.render('500');
    })
}

exports.getInvoice = (req, res) =>{
    const orderId = req.params.orderId;
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data',invoiceName);
    
    Order.findById(orderId).then(order=>{
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(invoicePath));
        doc.pipe(res);
        doc.fontSize(30).text('Invoice',{
            underline: true
        });
        doc.text('\n');
        doc.fontSize(18).text(`${order.orderDate}`,{
            underline: true
        });
        doc.text('\n');
        doc.text('----------------------------------------------------------------------');
        doc.text(`${order.productName}  x ${order.quantity}                                    Rs.${order.price}`);
        doc.text('\n');
        doc.text('----------------------------------------------------------------------');
        doc.text(`SubTotal                                                          Rs.${order.price * order.quantity}`);
        doc.text(`GST(18%)                                                           Rs.${Math.round(order.price * order.quantity * 0.18,0)}`);
        doc.text('\n');
        doc.text('----------------------------------------------------------------------');
        doc.text(`Grand Total                                                     Rs.${Math.round(order.price * order.quantity * 0.18,0) + order.price * order.quantity}`);
        doc.end();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition','inline;filename=invoice-' + invoiceName + '.pdf');
        
    })
}