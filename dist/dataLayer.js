/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/* 
  Datalayer Utils 
*/
window.clShopifyTrack = function() {
    
    function htmlDecode(input) {
        if (!input) return '';
        var parsedInput = input.replace(/(\r\n|\n|\r)/gm, '');
        var doc = new DOMParser().parseFromString(parsedInput, 'text/html');
        return JSON.parse(doc.documentElement.textContent);
    }

    function getURLParams(name, url){
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    function set_cookie(name, value) {
        document.cookie = name +'='+ value +'; Path=/;';
    };

    function get_cookie(name) {
        return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
    };

    function get_cookie_startwith(key) {
        var regex = new RegExp('(^|;)\\s*' + key + '\\w*\\s*=\\s*([^;]+)', 'g');
        var matches = document.cookie.matchAll(regex);
        var match = matches.next();
        var values = []
        while(!match.done){
            values.push(match.value[2]);
            match = matches.next();
        }
        return values;
    }

    function delete_cookie(name) {
        document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    };

    __BC__ = {
        pageType: '{{page_type}}',
        categoryName: '{{category.name}}',
        currency: '{{currency_selector.active_currency_code}}',
        analyticsData: window.analyticsData || {},
        cartItems: htmlDecode("{{json cart.items}}"),
        checkoutId: '{{checkout.id}}' || 0,
        orderId: '{{checkout.order.id}}' || 0,
    }

    /**
     * Custom configuration should be edit here
     */
    var customBindings = {
        mainPageAddButton: [],
        productPageAddButton: [],
        cartPageRemoveButton: [],
        searchTermQuery: [],
        searchPage: []
    };

    var defaultBindings = {
        mainPageAddButton: ["[data-button-type='add-cart']"],
        productPageAddButton: ["form-action-addToCart"],
        cartPageRemoveButton: ["cart-remove"],
        searchTermQuery: [getURLParams('search_query')],
        searchPage: ['search']
    }

    // stitch bindings
    objectArray = customBindings;
    outputObject = __BC__;
    applyBindings = function(objectArray, outputObject){
        for (var x in objectArray) {  
            var key = x;
            var objs = objectArray[x]; 
            values = [];    
            if(objs.length > 0){    
                values.push(objs);
                if(key in outputObject){              
                    values.push(outputObject[key]); 
                    outputObject[key] = values.join(", "); 
                }else{        
                    outputObject[key] = values.join(", ");
                }   
            }  
        }
    };
    applyBindings(customBindings, __BC__);
    applyBindings(defaultBindings, __BC__);



    /*
    Product Event listener
    */

    function addProductEventListeners() {
        var mainPageAddButton =    document.querySelectorAll(__BC__.mainPageAddButton) || []; //Add to cart button selector
        var productPageAddButton = document.getElementById(__BC__.productPageAddButton); //Add to cart form selector
        var cartPageRemoveButton = document.getElementsByClassName(__BC__.cartPageRemoveButton) || []; //Remove from cart button selector


        // Main Page - Add to Cart click
        if (mainPageAddButton.length > 0) {
            mainPageAddButton.forEach((el) =>
                el.addEventListener('click', (event) => {
                    var index = event.target.href.indexOf('product_id');
                    var productId = event.target.href.slice(index).split('=')[1];
                    onAddToCart(productId, undefined);
                })
            );
        }

        // Product Page - Add to Cart click
        if (productPageAddButton) {
            productPageAddButton.addEventListener('click', () => {
                onAddToCart('{{product.id}}', {
                    "product_name": '{{product.title}}', // Name or ID is required.
                    "product_id": '{{product.id}}',
                    "product_price": '{{product.price.without_tax.value}}',
                    "product_category": '{{product.category}}',
                    "product_variant": '{{product.sku}}',
                    "product_sku": '{{product.sku}}'
                });
            });
        }

        // Remove from Cart click
        if (cartPageRemoveButton.length > 0) {
            cartPageRemoveButton.forEach((el) =>
                el.addEventListener('click', () => {
                    onRemoveFromCart(el.attributes[1].nodeValue);
                })
            );
        }
    }

    /*
    Datalayer events
    */

    // Measure product/item list views/impressions
    function onCategoryView(categoryName) {
        _cl.pageview("Category viewed", {"customProperties": {"category_name": categoryName}})
    }

    // Measure a view of product details. This example assumes the detail view occurs on pageload,
    function onProductDetailsView() {
        _cl.pageview("Product viewed", {
            "customProperties": {
                "content_type": "product_group",
                "content_category": "{{product.category}}",
                "currency": __BC__.currency
            },
            "productProperties": [{
                "product_name": '{{product.title}}', // Name or ID is required.
                "product_id": '{{product.id}}',
                "product_price": '{{product.price.without_tax.value}}',
                "product_category": '{{product.category}}',
                "product_variant": '{{product.sku}}',
                "product_sku": '{{product.sku}}'
            }]
        })
    }

    // This event signifies that a user viewed their cart.
    function onViewCart() {
        var products = __BC__.analyticsData.products || __BC__.cartItems || []
        var propertiesToSend = {
            'customProperties': {
                "product_category": "product_group",
                "currency": __BC__.currency
            },
            'productProperties': products.map(function (product) {
                return {
                    "product_name": product.name, // Name or ID is required.
                    "product_id": product.product_id,
                    "product_quantity": product.quantity,
                    "product_price": product.price.value,
                    "product_category": product.category || "",
                    "product_variant": product.sku,
                    "product_sku": product.sku
                }
            })
        };
        _cl.pageview("Cart viewed", propertiesToSend)
    }

    // Measure when a product is added to a shopping cart
    function onAddToCart(productId, product) {
        if(product){
            console.log(product)
            propertiesToSend = {
                'customProperties': {
                    "product_category": "product_group",
                    "currency": __BC__.currency
                },
                'productProperties': [product]
            };
            _cl.trackClick("Add to Cart", propertiesToSend)
        }else{
            set_cookie("cl_bc_ajax_atc_" + productId, productId);
        }
    }

    function onRemoveFromCart(cartItemId) {
        var products = __BC__.analyticsData.products || __BC__.cartItems || []
        for(var id in products){
            var product = products[id];
            if(product.id == cartItemId){
                var propertiesToSend = {
                    'customProperties': {
                        "product_category": "product_group",
                        "currency": __BC__.currency
                    },
                    'productProperties' : [{
                        "product_id": product.product_id,
                        "product_name": product.name,
                        "product_quantity": product.quantity,
                        "product_sku": product.sku,
                        "product_price": product.price.value,
                    }]
                };
                _cl.trackClick('Removed from cart', propertiesToSend);
            }
        }
    }

    function onCheckoutStarted() {
        var props = {};
        var analyticsData = __BC__.analyticsData;
        for(var k in analyticsData){
            if(k != "products" && analyticsData[k]){
                props[k] = analyticsData[k];
            }   
        }
        var propertiesToSend = {
            "customProperties": props,
            "productProperties": analyticsData.products
        }
       _cl.pageview("Checkout made", propertiesToSend)
    }

    function onPurchase() {
        var customProps = {};
        var analyticsData = __BC__.analyticsData;
        for(var k in analyticsData){
            if(k != "products"  && k != "billingInfo" && analyticsData[k]){
                customProps[k] = analyticsData[k];
            }   
        }
        
        var propertiesToSend = {
            "customProperties": customProps,
            "productProperties": analyticsData.products
        }
        
        _cl.pageview("Purchased", propertiesToSend)

        if(analyticsData.billingInfo){
            var userAttributes = {};
            var billingInfo = analyticsData.billingInfo;
            if(billingInfo.email){
                for(var k in billingInfo){
                   if(k != "customFields" && billingInfo[k]){
                        userAttributes[k] = {
                           "t": "string",
                           "v": billingInfo[k]
                        };
                   }
                }
                var props = {
                    "customProperties": {
                        "user_traits": {
                            "t": "Object",
                            "v": userAttributes
                        },
                        "identify_by_email": {
                            "t":"string",
                            "v": userAttributes["email"],
                            "ib": true
                        }
                    }
                }
                _cl.identify(props)
            }
        }
    }

    function onSearchPage() {
        var customProperties = {
            'search_string': {
                't': 'string',
                'v': __BC__.searchTermQuery
            }
        };
        _cl.pageview("Search made", {"customProperties": customProperties});
    }

    /*
    View cart, Checkout & Purchased events helper
    */

    const mailSelector = document.getElementsByClassName('customerView-body');
    const products = [];

    async function getData(url) {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    }

    async function getPurchaseData(callback) {
       if(__BC__.orderId){
           getData(`/api/storefront/order/${__BC__.orderId}`).then((data) => {
                if(data.lineItems.physicalItems.length) {
                    for (const product of data.lineItems.physicalItems) {
                        products.push({
                            product_id: product.productId,
                            product_sku: product.sku,
                            product_name: product.name,
                            product_brand: product.brand,
                            product_price: product.salePrice,
                            product_quantity: product.quantity
                        });
                    }
                    __BC__.analyticsData = {
                        order_id: data.orderId,
                        value: data.orderAmount,
                        revenue: data.orderAmount,
                        shipping: data.shippingCostTotal,
                        tax: data.taxTotal,
                        discount: data.discountAmount,
                        currency: data.currency.code,
                        status: data.status,
                        products: products,
                        billingInfo: data.billingAddress
                    };
                    if(callback){
                        callback();
                    }
                }
           })
       }
    }

    function getCheckoutData(callback) {
        if(__BC__.checkoutId){
            getData(`/api/storefront/checkouts/${__BC__.checkoutId}`).then((data) => {
                if (data.cart && data.cart.lineItems.physicalItems.length) {
                    for (const product of data.cart.lineItems.physicalItems) {
                        products.push({
                            product_id: product.productId,
                            product_sku: product.sku,
                            product_name: product.name,
                            product_brand: product.brand,
                            product_price: product.salePrice,
                            product_quantity: product.quantity
                        });
                    }
                    __BC__.analyticsData = {
                        checkout_id: data.id,
                        order_id: data.orderId,
                        value: data.grandTotal,
                        revenue: data.subtotal,
                        shipping: data.shippingCostTotal,
                        tax: data.taxTotal,
                        discount: data.cart.discountAmount,
                        currency: data.cart.currency.code,
                        products: products,
                    };
                    if(callback){
                        callback();
                    }
                }
            });
    
            if (mailSelector && mailSelector[0]) {
                userEmail = mailSelector[0].innerHTML;
            }
        }
    }

    function findATCAndSend(){
        var pendingList = get_cookie_startwith("cl_bc_ajax_atc_");
        if(pendingList.length > 0){
            getProductAndSend(pendingList);
        }
    }

    function getProductAndSend(productIds) {
        getData(`/api/storefront/carts`).then((data) => {
            var cart = data[0];
            if (cart && cart.lineItems.physicalItems.length) {
                for (const product of cart.lineItems.physicalItems) {
                    if(productIds.includes(""+product.productId)){
                        onAddToCart(product.productId, {
                            "product_name": product.name,
                            "product_id": product.productId,
                            "product_quantity": product.quantity,
                            "product_price": product.salePrice,
                            "product_category": product.category | "",
                            "product_sku": product.sku
                        });
                    }
                }
            }
        });
    }
    
    
    /*
    BigCommerce Events Manager
    */
   
    addProductEventListeners();
   
    var searchPage = new RegExp(__BC__.searchPage, "g");
    
    findATCAndSend();

    switch (__BC__.pageType) {
        case 'category':
            onCategoryView(__BC__.categoryName);
            break;    
        case 'product':
            onProductDetailsView();
            break;    
        case 'checkout':
            getCheckoutData(onCheckoutStarted);
            break;    
        case 'orderconfirmation':
            getPurchaseData(onPurchase);
            break;    
        case 'cart':
            onViewCart();
            break;    
        default:
            if (__BC__.pageType === 'search' || document.location.pathname.match(searchPage)){
                onSearchPage();
            }
            break;
    }
    
    
}
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQyIsInNvdXJjZXMiOlsid2VicGFjazovL2JpZ2NvbW1lcmNlLWRhdGFsYXllci8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcclxuICBEYXRhbGF5ZXIgVXRpbHMgXHJcbiovXHJcbndpbmRvdy5jbFNob3BpZnlUcmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBodG1sRGVjb2RlKGlucHV0KSB7XHJcbiAgICAgICAgaWYgKCFpbnB1dCkgcmV0dXJuICcnO1xyXG4gICAgICAgIHZhciBwYXJzZWRJbnB1dCA9IGlucHV0LnJlcGxhY2UoLyhcXHJcXG58XFxufFxccikvZ20sICcnKTtcclxuICAgICAgICB2YXIgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhwYXJzZWRJbnB1dCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRvYy5kb2N1bWVudEVsZW1lbnQudGV4dENvbnRlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFVSTFBhcmFtcyhuYW1lLCB1cmwpe1xyXG4gICAgICAgIGlmICghdXJsKSB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCBcIlxcXFwkJlwiKTtcclxuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiWz8mXVwiICsgbmFtZSArIFwiKD0oW14mI10qKXwmfCN8JClcIiksXHJcbiAgICAgICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcclxuICAgICAgICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xyXG4gICAgICAgIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xyXG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpKTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0X2Nvb2tpZShuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IG5hbWUgKyc9JysgdmFsdWUgKyc7IFBhdGg9LzsnO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRfY29va2llKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llLm1hdGNoKCcoXnw7KVxcXFxzKicgKyBuYW1lICsgJ1xcXFxzKj1cXFxccyooW147XSspJyk/LnBvcCgpIHx8ICcnO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRfY29va2llX3N0YXJ0d2l0aChrZXkpIHtcclxuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnw7KVxcXFxzKicgKyBrZXkgKyAnXFxcXHcqXFxcXHMqPVxcXFxzKihbXjtdKyknLCAnZycpO1xyXG4gICAgICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQuY29va2llLm1hdGNoQWxsKHJlZ2V4KTtcclxuICAgICAgICB2YXIgbWF0Y2ggPSBtYXRjaGVzLm5leHQoKTtcclxuICAgICAgICB2YXIgdmFsdWVzID0gW11cclxuICAgICAgICB3aGlsZSghbWF0Y2guZG9uZSl7XHJcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hdGNoLnZhbHVlWzJdKTtcclxuICAgICAgICAgICAgbWF0Y2ggPSBtYXRjaGVzLm5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWxldGVfY29va2llKG5hbWUpIHtcclxuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsnPTsgUGF0aD0vOyBFeHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDEgR01UOyc7XHJcbiAgICB9O1xyXG5cclxuICAgIF9fQkNfXyA9IHtcclxuICAgICAgICBwYWdlVHlwZTogJ3t7cGFnZV90eXBlfX0nLFxyXG4gICAgICAgIGNhdGVnb3J5TmFtZTogJ3t7Y2F0ZWdvcnkubmFtZX19JyxcclxuICAgICAgICBjdXJyZW5jeTogJ3t7Y3VycmVuY3lfc2VsZWN0b3IuYWN0aXZlX2N1cnJlbmN5X2NvZGV9fScsXHJcbiAgICAgICAgYW5hbHl0aWNzRGF0YTogd2luZG93LmFuYWx5dGljc0RhdGEgfHwge30sXHJcbiAgICAgICAgY2FydEl0ZW1zOiBodG1sRGVjb2RlKFwie3tqc29uIGNhcnQuaXRlbXN9fVwiKSxcclxuICAgICAgICBjaGVja291dElkOiAne3tjaGVja291dC5pZH19JyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgb3JkZXJJZDogJ3t7Y2hlY2tvdXQub3JkZXIuaWR9fScgfHwgdW5kZWZpbmVkLFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VzdG9tIGNvbmZpZ3VyYXRpb24gc2hvdWxkIGJlIGVkaXQgaGVyZVxyXG4gICAgICovXHJcbiAgICB2YXIgY3VzdG9tQmluZGluZ3MgPSB7XHJcbiAgICAgICAgbWFpblBhZ2VBZGRCdXR0b246IFtdLFxyXG4gICAgICAgIHByb2R1Y3RQYWdlQWRkQnV0dG9uOiBbXSxcclxuICAgICAgICBjYXJ0UGFnZVJlbW92ZUJ1dHRvbjogW10sXHJcbiAgICAgICAgc2VhcmNoVGVybVF1ZXJ5OiBbXSxcclxuICAgICAgICBzZWFyY2hQYWdlOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZGVmYXVsdEJpbmRpbmdzID0ge1xyXG4gICAgICAgIG1haW5QYWdlQWRkQnV0dG9uOiBbXCJbZGF0YS1idXR0b24tdHlwZT0nYWRkLWNhcnQnXVwiXSxcclxuICAgICAgICBwcm9kdWN0UGFnZUFkZEJ1dHRvbjogW1wiZm9ybS1hY3Rpb24tYWRkVG9DYXJ0XCJdLFxyXG4gICAgICAgIGNhcnRQYWdlUmVtb3ZlQnV0dG9uOiBbXCJjYXJ0LXJlbW92ZVwiXSxcclxuICAgICAgICBzZWFyY2hUZXJtUXVlcnk6IFtnZXRVUkxQYXJhbXMoJ3NlYXJjaF9xdWVyeScpXSxcclxuICAgICAgICBzZWFyY2hQYWdlOiBbJ3NlYXJjaCddXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RpdGNoIGJpbmRpbmdzXHJcbiAgICBvYmplY3RBcnJheSA9IGN1c3RvbUJpbmRpbmdzO1xyXG4gICAgb3V0cHV0T2JqZWN0ID0gX19CQ19fO1xyXG4gICAgYXBwbHlCaW5kaW5ncyA9IGZ1bmN0aW9uKG9iamVjdEFycmF5LCBvdXRwdXRPYmplY3Qpe1xyXG4gICAgICAgIGZvciAodmFyIHggaW4gb2JqZWN0QXJyYXkpIHsgIFxyXG4gICAgICAgICAgICB2YXIga2V5ID0geDtcclxuICAgICAgICAgICAgdmFyIG9ianMgPSBvYmplY3RBcnJheVt4XTsgXHJcbiAgICAgICAgICAgIHZhbHVlcyA9IFtdOyAgICBcclxuICAgICAgICAgICAgaWYob2Jqcy5sZW5ndGggPiAwKXsgICAgXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaChvYmpzKTtcclxuICAgICAgICAgICAgICAgIGlmKGtleSBpbiBvdXRwdXRPYmplY3QpeyAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2gob3V0cHV0T2JqZWN0W2tleV0pOyBcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRPYmplY3Rba2V5XSA9IHZhbHVlcy5qb2luKFwiLCBcIik7IFxyXG4gICAgICAgICAgICAgICAgfWVsc2V7ICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRPYmplY3Rba2V5XSA9IHZhbHVlcy5qb2luKFwiLCBcIik7XHJcbiAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgIH0gIFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBhcHBseUJpbmRpbmdzKGN1c3RvbUJpbmRpbmdzLCBfX0JDX18pO1xyXG4gICAgYXBwbHlCaW5kaW5ncyhkZWZhdWx0QmluZGluZ3MsIF9fQkNfXyk7XHJcblxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgUHJvZHVjdCBFdmVudCBsaXN0ZW5lclxyXG4gICAgKi9cclxuXHJcbiAgICBmdW5jdGlvbiBhZGRQcm9kdWN0RXZlbnRMaXN0ZW5lcnMoKSB7XHJcbiAgICAgICAgdmFyIG1haW5QYWdlQWRkQnV0dG9uID0gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChfX0JDX18ubWFpblBhZ2VBZGRCdXR0b24pIHx8IFtdOyAvL0FkZCB0byBjYXJ0IGJ1dHRvbiBzZWxlY3RvclxyXG4gICAgICAgIHZhciBwcm9kdWN0UGFnZUFkZEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKF9fQkNfXy5wcm9kdWN0UGFnZUFkZEJ1dHRvbik7IC8vQWRkIHRvIGNhcnQgZm9ybSBzZWxlY3RvclxyXG4gICAgICAgIHZhciBjYXJ0UGFnZVJlbW92ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoX19CQ19fLmNhcnRQYWdlUmVtb3ZlQnV0dG9uKSB8fCBbXTsgLy9SZW1vdmUgZnJvbSBjYXJ0IGJ1dHRvbiBzZWxlY3RvclxyXG5cclxuXHJcbiAgICAgICAgLy8gTWFpbiBQYWdlIC0gQWRkIHRvIENhcnQgY2xpY2tcclxuICAgICAgICBpZiAobWFpblBhZ2VBZGRCdXR0b24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBtYWluUGFnZUFkZEJ1dHRvbi5mb3JFYWNoKChlbCkgPT5cclxuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZXZlbnQudGFyZ2V0LmhyZWYuaW5kZXhPZigncHJvZHVjdF9pZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9kdWN0SWQgPSBldmVudC50YXJnZXQuaHJlZi5zbGljZShpbmRleCkuc3BsaXQoJz0nKVsxXTtcclxuICAgICAgICAgICAgICAgICAgICBvbkFkZFRvQ2FydChwcm9kdWN0SWQsIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJvZHVjdCBQYWdlIC0gQWRkIHRvIENhcnQgY2xpY2tcclxuICAgICAgICBpZiAocHJvZHVjdFBhZ2VBZGRCdXR0b24pIHtcclxuICAgICAgICAgICAgcHJvZHVjdFBhZ2VBZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvbkFkZFRvQ2FydCgne3twcm9kdWN0LmlkfX0nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogJ3t7cHJvZHVjdC50aXRsZX19JywgLy8gTmFtZSBvciBJRCBpcyByZXF1aXJlZC5cclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfaWRcIjogJ3t7cHJvZHVjdC5pZH19JyxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcHJpY2VcIjogJ3t7cHJvZHVjdC5wcmljZS53aXRob3V0X3RheC52YWx1ZX19JyxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogJ3t7cHJvZHVjdC5jYXRlZ29yeX19JyxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfdmFyaWFudFwiOiAne3twcm9kdWN0LnNrdX19JyxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3Rfc2t1XCI6ICd7e3Byb2R1Y3Quc2t1fX0nXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZW1vdmUgZnJvbSBDYXJ0IGNsaWNrXHJcbiAgICAgICAgaWYgKGNhcnRQYWdlUmVtb3ZlQnV0dG9uLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY2FydFBhZ2VSZW1vdmVCdXR0b24uZm9yRWFjaCgoZWwpID0+XHJcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBvblJlbW92ZUZyb21DYXJ0KGVsLmF0dHJpYnV0ZXNbMV0ubm9kZVZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICBEYXRhbGF5ZXIgZXZlbnRzXHJcbiAgICAqL1xyXG5cclxuICAgIC8vIE1lYXN1cmUgcHJvZHVjdC9pdGVtIGxpc3Qgdmlld3MvaW1wcmVzc2lvbnNcclxuICAgIGZ1bmN0aW9uIG9uQ2F0ZWdvcnlWaWV3KGNhdGVnb3J5TmFtZSkge1xyXG4gICAgICAgIF9jbC5wYWdldmlldyhcIkNhdGVnb3J5IHZpZXdlZFwiLCB7XCJjdXN0b21Qcm9wZXJ0aWVzXCI6IHtcImNhdGVnb3J5X25hbWVcIjogY2F0ZWdvcnlOYW1lfX0pXHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWVhc3VyZSBhIHZpZXcgb2YgcHJvZHVjdCBkZXRhaWxzLiBUaGlzIGV4YW1wbGUgYXNzdW1lcyB0aGUgZGV0YWlsIHZpZXcgb2NjdXJzIG9uIHBhZ2Vsb2FkLFxyXG4gICAgZnVuY3Rpb24gb25Qcm9kdWN0RGV0YWlsc1ZpZXcoKSB7XHJcbiAgICAgICAgX2NsLnBhZ2V2aWV3KFwiUHJvZHVjdCB2aWV3ZWRcIiwge1xyXG4gICAgICAgICAgICBcImN1c3RvbVByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50X3R5cGVcIjogXCJwcm9kdWN0X2dyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnRfY2F0ZWdvcnlcIjogXCJ7e3Byb2R1Y3QuY2F0ZWdvcnl9fVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjdXJyZW5jeVwiOiBfX0JDX18uY3VycmVuY3lcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJwcm9kdWN0UHJvcGVydGllc1wiOiBbe1xyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogJ3t7cHJvZHVjdC50aXRsZX19JywgLy8gTmFtZSBvciBJRCBpcyByZXF1aXJlZC5cclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiAne3twcm9kdWN0LmlkfX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6ICd7e3Byb2R1Y3QucHJpY2Uud2l0aG91dF90YXgudmFsdWV9fScsXHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogJ3t7cHJvZHVjdC5jYXRlZ29yeX19JyxcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF92YXJpYW50XCI6ICd7e3Byb2R1Y3Quc2t1fX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiAne3twcm9kdWN0LnNrdX19J1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGhpcyBldmVudCBzaWduaWZpZXMgdGhhdCBhIHVzZXIgdmlld2VkIHRoZWlyIGNhcnQuXHJcbiAgICBmdW5jdGlvbiBvblZpZXdDYXJ0KCkge1xyXG4gICAgICAgIHZhciBwcm9kdWN0cyA9IF9fQkNfXy5hbmFseXRpY3NEYXRhLnByb2R1Y3RzIHx8IF9fQkNfXy5jYXJ0SXRlbXMgfHwgW11cclxuICAgICAgICB2YXIgcHJvcGVydGllc1RvU2VuZCA9IHtcclxuICAgICAgICAgICAgJ2N1c3RvbVByb3BlcnRpZXMnOiB7XHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogXCJwcm9kdWN0X2dyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICBcImN1cnJlbmN5XCI6IF9fQkNfXy5jdXJyZW5jeVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAncHJvZHVjdFByb3BlcnRpZXMnOiBwcm9kdWN0cy5tYXAoZnVuY3Rpb24gKHByb2R1Y3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogcHJvZHVjdC5uYW1lLCAvLyBOYW1lIG9yIElEIGlzIHJlcXVpcmVkLlxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiBwcm9kdWN0LnByb2R1Y3RfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3F1YW50aXR5XCI6IHByb2R1Y3QucXVhbnRpdHksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6IHByb2R1Y3QucHJpY2UudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6IHByb2R1Y3QuY2F0ZWdvcnkgfHwgXCJcIixcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfdmFyaWFudFwiOiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3Rfc2t1XCI6IHByb2R1Y3Quc2t1XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfTtcclxuICAgICAgICBfY2wucGFnZXZpZXcoXCJDYXJ0IHZpZXdlZFwiLCBwcm9wZXJ0aWVzVG9TZW5kKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE1lYXN1cmUgd2hlbiBhIHByb2R1Y3QgaXMgYWRkZWQgdG8gYSBzaG9wcGluZyBjYXJ0XHJcbiAgICBmdW5jdGlvbiBvbkFkZFRvQ2FydChwcm9kdWN0SWQsIHByb2R1Y3QpIHtcclxuICAgICAgICBpZihwcm9kdWN0KXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZHVjdClcclxuICAgICAgICAgICAgcHJvcGVydGllc1RvU2VuZCA9IHtcclxuICAgICAgICAgICAgICAgICdjdXN0b21Qcm9wZXJ0aWVzJzoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBcInByb2R1Y3RfZ3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICBcImN1cnJlbmN5XCI6IF9fQkNfXy5jdXJyZW5jeVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICdwcm9kdWN0UHJvcGVydGllcyc6IFtwcm9kdWN0XVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBfY2wudHJhY2tDbGljayhcIkFkZCB0byBDYXJ0XCIsIHByb3BlcnRpZXNUb1NlbmQpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHNldF9jb29raWUoXCJjbF9iY19hamF4X2F0Y19cIiArIHByb2R1Y3RJZCwgcHJvZHVjdElkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25SZW1vdmVGcm9tQ2FydChjYXJ0SXRlbUlkKSB7XHJcbiAgICAgICAgdmFyIHByb2R1Y3RzID0gX19CQ19fLmFuYWx5dGljc0RhdGEucHJvZHVjdHMgfHwgX19CQ19fLmNhcnRJdGVtcyB8fCBbXVxyXG4gICAgICAgIGZvcih2YXIgaWQgaW4gcHJvZHVjdHMpe1xyXG4gICAgICAgICAgICB2YXIgcHJvZHVjdCA9IHByb2R1Y3RzW2lkXTtcclxuICAgICAgICAgICAgaWYocHJvZHVjdC5pZCA9PSBjYXJ0SXRlbUlkKXtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICdjdXN0b21Qcm9wZXJ0aWVzJzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogXCJwcm9kdWN0X2dyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogX19CQ19fLmN1cnJlbmN5XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAncHJvZHVjdFByb3BlcnRpZXMnIDogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2lkXCI6IHByb2R1Y3QucHJvZHVjdF9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcXVhbnRpdHlcIjogcHJvZHVjdC5xdWFudGl0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6IHByb2R1Y3QucHJpY2UudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBfY2wudHJhY2tDbGljaygnUmVtb3ZlZCBmcm9tIGNhcnQnLCBwcm9wZXJ0aWVzVG9TZW5kKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvbkNoZWNrb3V0U3RhcnRlZCgpIHtcclxuICAgICAgICB2YXIgcHJvcHMgPSB7fTtcclxuICAgICAgICB2YXIgYW5hbHl0aWNzRGF0YSA9IF9fQkNfXy5hbmFseXRpY3NEYXRhO1xyXG4gICAgICAgIGZvcih2YXIgayBpbiBhbmFseXRpY3NEYXRhKXtcclxuICAgICAgICAgICAgaWYoayAhPSBcInByb2R1Y3RzXCIgJiYgYW5hbHl0aWNzRGF0YVtrXSl7XHJcbiAgICAgICAgICAgICAgICBwcm9wc1trXSA9IGFuYWx5dGljc0RhdGFba107XHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHByb3BlcnRpZXNUb1NlbmQgPSB7XHJcbiAgICAgICAgICAgIFwiY3VzdG9tUHJvcGVydGllc1wiOiBwcm9wcyxcclxuICAgICAgICAgICAgXCJwcm9kdWN0UHJvcGVydGllc1wiOiBhbmFseXRpY3NEYXRhLnByb2R1Y3RzXHJcbiAgICAgICAgfVxyXG4gICAgICAgX2NsLnBhZ2V2aWV3KFwiQ2hlY2tvdXQgbWFkZVwiLCBwcm9wZXJ0aWVzVG9TZW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uUHVyY2hhc2UoKSB7XHJcbiAgICAgICAgdmFyIGN1c3RvbVByb3BzID0ge307XHJcbiAgICAgICAgdmFyIGFuYWx5dGljc0RhdGEgPSBfX0JDX18uYW5hbHl0aWNzRGF0YTtcclxuICAgICAgICBmb3IodmFyIGsgaW4gYW5hbHl0aWNzRGF0YSl7XHJcbiAgICAgICAgICAgIGlmKGsgIT0gXCJwcm9kdWN0c1wiICAmJiBrICE9IFwiYmlsbGluZ0luZm9cIiAmJiBhbmFseXRpY3NEYXRhW2tdKXtcclxuICAgICAgICAgICAgICAgIGN1c3RvbVByb3BzW2tdID0gYW5hbHl0aWNzRGF0YVtrXTtcclxuICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgcHJvcGVydGllc1RvU2VuZCA9IHtcclxuICAgICAgICAgICAgXCJjdXN0b21Qcm9wZXJ0aWVzXCI6IGN1c3RvbVByb3BzLFxyXG4gICAgICAgICAgICBcInByb2R1Y3RQcm9wZXJ0aWVzXCI6IGFuYWx5dGljc0RhdGEucHJvZHVjdHNcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgX2NsLnBhZ2V2aWV3KFwiUHVyY2hhc2VkXCIsIHByb3BlcnRpZXNUb1NlbmQpXHJcblxyXG4gICAgICAgIGlmKGFuYWx5dGljc0RhdGEuYmlsbGluZ0luZm8pe1xyXG4gICAgICAgICAgICB2YXIgdXNlckF0dHJpYnV0ZXMgPSB7fTtcclxuICAgICAgICAgICAgdmFyIGJpbGxpbmdJbmZvID0gYW5hbHl0aWNzRGF0YS5iaWxsaW5nSW5mbztcclxuICAgICAgICAgICAgaWYoYmlsbGluZ0luZm8uZW1haWwpe1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBrIGluIGJpbGxpbmdJbmZvKXtcclxuICAgICAgICAgICAgICAgICAgIGlmKGsgIT0gXCJjdXN0b21GaWVsZHNcIiAmJiBiaWxsaW5nSW5mb1trXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJBdHRyaWJ1dGVzW2tdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcInRcIjogXCJzdHJpbmdcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2XCI6IGJpbGxpbmdJbmZvW2tdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjdXN0b21Qcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VyX3RyYWl0c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRcIjogXCJPYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidlwiOiB1c2VyQXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImlkZW50aWZ5X2J5X2VtYWlsXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidFwiOlwic3RyaW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZcIjogdXNlckF0dHJpYnV0ZXNbXCJlbWFpbFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWJcIjogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgX2NsLmlkZW50aWZ5KHByb3BzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uU2VhcmNoUGFnZSgpIHtcclxuICAgICAgICB2YXIgY3VzdG9tUHJvcGVydGllcyA9IHtcclxuICAgICAgICAgICAgJ3NlYXJjaF9zdHJpbmcnOiB7XHJcbiAgICAgICAgICAgICAgICAndCc6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgJ3YnOiBfX0JDX18uc2VhcmNoVGVybVF1ZXJ5XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIF9jbC5wYWdldmlldyhcIlNlYXJjaCBtYWRlXCIsIHtcImN1c3RvbVByb3BlcnRpZXNcIjogY3VzdG9tUHJvcGVydGllc30pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICBWaWV3IGNhcnQsIENoZWNrb3V0ICYgUHVyY2hhc2VkIGV2ZW50cyBoZWxwZXJcclxuICAgICovXHJcblxyXG4gICAgY29uc3QgbWFpbFNlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY3VzdG9tZXJWaWV3LWJvZHknKTtcclxuICAgIGNvbnN0IHByb2R1Y3RzID0gW107XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZ2V0RGF0YSh1cmwpIHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgICBjYWNoZTogJ25vLWNhY2hlJyxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGdldFB1cmNoYXNlRGF0YShjYWxsYmFjaykge1xyXG4gICAgICAgaWYoX19CQ19fLm9yZGVySWQpe1xyXG4gICAgICAgICAgIGdldERhdGEoYC9hcGkvc3RvcmVmcm9udC9vcmRlci8ke19fQkNfXy5vcmRlcklkfWApLnRoZW4oKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIGRhdGEubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X2lkOiBwcm9kdWN0LnByb2R1Y3RJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3Rfc2t1OiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfbmFtZTogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9icmFuZDogcHJvZHVjdC5icmFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfcHJpY2U6IHByb2R1Y3Quc2FsZVByaWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9xdWFudGl0eTogcHJvZHVjdC5xdWFudGl0eVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgX19CQ19fLmFuYWx5dGljc0RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yZGVyX2lkOiBkYXRhLm9yZGVySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkYXRhLm9yZGVyQW1vdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXZlbnVlOiBkYXRhLm9yZGVyQW1vdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGlwcGluZzogZGF0YS5zaGlwcGluZ0Nvc3RUb3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGF4OiBkYXRhLnRheFRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3VudDogZGF0YS5kaXNjb3VudEFtb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVuY3k6IGRhdGEuY3VycmVuY3kuY29kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBkYXRhLnN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHM6IHByb2R1Y3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiaWxsaW5nSW5mbzogZGF0YS5iaWxsaW5nQWRkcmVzc1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2spe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9KVxyXG4gICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldENoZWNrb3V0RGF0YShjYWxsYmFjaykge1xyXG4gICAgICAgIGlmKF9fQkNfXy5jaGVja291dElkKXtcclxuICAgICAgICAgICAgZ2V0RGF0YShgL2FwaS9zdG9yZWZyb250L2NoZWNrb3V0cy8ke19fQkNfXy5jaGVja291dElkfWApLnRoZW4oKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhcnQgJiYgZGF0YS5jYXJ0LmxpbmVJdGVtcy5waHlzaWNhbEl0ZW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBkYXRhLmNhcnQubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X2lkOiBwcm9kdWN0LnByb2R1Y3RJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3Rfc2t1OiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfbmFtZTogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9icmFuZDogcHJvZHVjdC5icmFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfcHJpY2U6IHByb2R1Y3Quc2FsZVByaWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9xdWFudGl0eTogcHJvZHVjdC5xdWFudGl0eVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgX19CQ19fLmFuYWx5dGljc0RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrb3V0X2lkOiBkYXRhLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmRlcl9pZDogZGF0YS5vcmRlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YS5ncmFuZFRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXZlbnVlOiBkYXRhLnN1YnRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGlwcGluZzogZGF0YS5zaGlwcGluZ0Nvc3RUb3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGF4OiBkYXRhLnRheFRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3VudDogZGF0YS5jYXJ0LmRpc2NvdW50QW1vdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW5jeTogZGF0YS5jYXJ0LmN1cnJlbmN5LmNvZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RzOiBwcm9kdWN0cyxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGNhbGxiYWNrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgICAgIGlmIChtYWlsU2VsZWN0b3IgJiYgbWFpbFNlbGVjdG9yWzBdKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyRW1haWwgPSBtYWlsU2VsZWN0b3JbMF0uaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGZpbmRBVENBbmRTZW5kKCl7XHJcbiAgICAgICAgdmFyIHBlbmRpbmdMaXN0ID0gZ2V0X2Nvb2tpZV9zdGFydHdpdGgoXCJjbF9iY19hamF4X2F0Y19cIik7XHJcbiAgICAgICAgaWYocGVuZGluZ0xpc3QubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgIGdldFByb2R1Y3RBbmRTZW5kKHBlbmRpbmdMaXN0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0UHJvZHVjdEFuZFNlbmQocHJvZHVjdElkcykge1xyXG4gICAgICAgIGdldERhdGEoYC9hcGkvc3RvcmVmcm9udC9jYXJ0c2ApLnRoZW4oKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgdmFyIGNhcnQgPSBkYXRhWzBdO1xyXG4gICAgICAgICAgICBpZiAoY2FydCAmJiBjYXJ0LmxpbmVJdGVtcy5waHlzaWNhbEl0ZW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIGNhcnQubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihwcm9kdWN0SWRzLmluY2x1ZGVzKFwiXCIrcHJvZHVjdC5wcm9kdWN0SWQpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25BZGRUb0NhcnQocHJvZHVjdC5wcm9kdWN0SWQsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9uYW1lXCI6IHByb2R1Y3QubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiBwcm9kdWN0LnByb2R1Y3RJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9xdWFudGl0eVwiOiBwcm9kdWN0LnF1YW50aXR5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6IHByb2R1Y3Quc2FsZVByaWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6IHByb2R1Y3QuY2F0ZWdvcnkgfCBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiBwcm9kdWN0LnNrdVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICAvKlxyXG4gICAgQmlnQ29tbWVyY2UgRXZlbnRzIE1hbmFnZXJcclxuICAgICovXHJcbiAgIFxyXG4gICAgYWRkUHJvZHVjdEV2ZW50TGlzdGVuZXJzKCk7XHJcbiAgIFxyXG4gICAgdmFyIHNlYXJjaFBhZ2UgPSBuZXcgUmVnRXhwKF9fQkNfXy5zZWFyY2hQYWdlLCBcImdcIik7XHJcbiAgICBcclxuICAgIGZpbmRBVENBbmRTZW5kKCk7XHJcblxyXG4gICAgc3dpdGNoIChfX0JDX18ucGFnZVR5cGUpIHtcclxuICAgICAgICBjYXNlICdjYXRlZ29yeSc6XHJcbiAgICAgICAgICAgIG9uQ2F0ZWdvcnlWaWV3KF9fQkNfXy5jYXRlZ29yeU5hbWUpO1xyXG4gICAgICAgICAgICBicmVhazsgICAgXHJcbiAgICAgICAgY2FzZSAncHJvZHVjdCc6XHJcbiAgICAgICAgICAgIG9uUHJvZHVjdERldGFpbHNWaWV3KCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBjYXNlICdjaGVja291dCc6XHJcbiAgICAgICAgICAgIGdldENoZWNrb3V0RGF0YShvbkNoZWNrb3V0U3RhcnRlZCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBjYXNlICdvcmRlcmNvbmZpcm1hdGlvbic6XHJcbiAgICAgICAgICAgIGdldFB1cmNoYXNlRGF0YShvblB1cmNoYXNlKTtcclxuICAgICAgICAgICAgYnJlYWs7ICAgIFxyXG4gICAgICAgIGNhc2UgJ2NhcnQnOlxyXG4gICAgICAgICAgICBvblZpZXdDYXJ0KCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBpZiAoX19CQ19fLnBhZ2VUeXBlID09PSAnc2VhcmNoJyB8fCBkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaChzZWFyY2hQYWdlKSl7XHJcbiAgICAgICAgICAgICAgICBvblNlYXJjaFBhZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbn0iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=