const Product = require('../models/product');
const fs = require('fs');
const Items_Per_Page = 2;

exports.getAddProduct = (req, res) =>{

    var errorMessage = req.flash('error')[0];
    res.render('editProduct',{
        pageTitle:'Add Product',
        edit: false,
        errorMessage: errorMessage
    })
}

exports.getEditProduct = (req, res) =>{
    
    Product.findById(req.params.productId).then((product)=>{
        if(!product){
            res.redirect('/admin/products');
        }
        else{
            var errorMessage = req.flash('error')[0];
            res.render('editProduct',{
                pageTitle:'Edit Product',
                edit: true,
                product: product,
                errorMessage : errorMessage
            })
        }
    }).catch(err=>{
        res.render('500');
    })
}

exports.getAdminProducts = (req, res) =>{

    const page = req.query.page;
    let total;
    Product.find().countDocuments().then(totalItems =>{
        total = totalItems;
        return Product.find({userId: req.user._id}).skip((page-1)* Items_Per_Page).limit(Items_Per_Page);
    })
    .then((products)=>{
        res.render('adminProducts',{
            pageTitle:'Admin Products',
            products:products,
            totalItems:total,
            hasNext : Items_Per_Page * page < total,
            hasPrevious : page > 1,
            page : page,
            totalPages : Math.ceil(total / Items_Per_Page)
        })
    }).catch((err)=>{
        res.render('500');
    })
}

exports.postAddProduct = (req, res) =>{
    const name = req.body.name.trim();
    const description = req.body.description.trim();
    const price = req.body.price;
    const image = req.file;
    if(!image){
        req.flash('error','Invalid File');
        return res.redirect('/admin/add-product');
    }
    const imageUrl = '/' + image.filename;
    const product = new Product({
        name:name,
        description:description,
        price:price,
        imageUrl:imageUrl,
        userId:req.user
    });

    product.save()
    .then(() =>{
        console.log('Product Saved');
        res.redirect('/admin/products');
    }).catch(err =>{
        res.redirect('/admin/products');
    });

}

exports.postEditProduct = (req,res,next) =>{
    
    const name = req.body.name.trim();
    const description = req.body.description.trim();
    const price = req.body.price;
    const image = req.file;

    const id = req.body.id;

    Product.findById(id).then((product) =>{
        product.name = name;
        product.description = description;
        product.price = price;
        if(image){

            fs.unlink( 'images' + product.imageUrl,(err)=>{
                if(err){
                    return res.render('500');
                }
            });

            product.imageUrl = '/' + image.filename;
        }
        return product.save();
    }).then((result) =>{
        res.redirect('/admin/products');
    }).catch((err) =>{
        res.redirect('/admin/products');
    })

}

exports.postDeleteProduct = (req, res,next) =>{

   const id = req.body.id;
   
   Product.findById(id).then((product)=>{
       fs.unlink( 'images' + product.imageUrl,(err)=>{
           if(err){
               return res.render('500');
           }
       });
   })

   Product.findByIdAndRemove(id).then(() =>{
     console.log("Product deleted");
    
     req.user.cart.items = req.user.cart.items.filter(item => item.productId != id);

     return req.user.save();
     
   }).then(() => {
        res.redirect('/admin/products');
   }).catch(err => {
    res.render('500');
   })


}