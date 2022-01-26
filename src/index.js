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
        checkoutId: '{{checkout.id}}' || undefined,
        orderId: '{{checkout.order.id}}' || undefined,
        mainPageAjaxAddButton: false, // set true if the products list has ajax "add to cart" button
    }

    /**
     * Custom configuration should be edit here
     */
    var customBindings = {
        mainPageAddButton: [],
        productPageAddButton: [],
        cartPageRemoveButton: [],
        searchTermQuery: [],
        searchPage: [],
        quickViewModal: [],
        quickViewCartButtonId: [],
        modalHiddenProductId: [],
    };

    var defaultBindings = {
        mainPageAddButton: ["[data-button-type='add-cart']"],
        productPageAddButton: ["#form-action-addToCart"],
        cartPageRemoveButton: [".cart-remove"],
        searchTermQuery: [getURLParams('search_query')],
        searchPage: ['search'],
        quickViewModal: ["#modal"],
        quickViewCartButtonId: ["form-action-addToCart"],
        modalHiddenProductId: ["#modal .productView-details.product-options [name='product_id']"]
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
        var mainPageAddButton    = Czzle(__BC__.mainPageAddButton)    || []; 
        var productPageAddButton = Czzle(__BC__.productPageAddButton) || [];
        var cartPageRemoveButton = Czzle(__BC__.cartPageRemoveButton) || [];
        var quickViewModal = Czzle(__BC__.quickViewModal) || [];


        // Main Page - Add to Cart click
        if (mainPageAddButton.length > 0) {
            for(var i = 0; i < mainPageAddButton.length; i++) {
                const el = mainPageAddButton[i];
                el.addEventListener('click', (event) => {
                    var index = event.target.href.indexOf('product_id');
                    var productId = event.target.href.slice(index).split('=')[1];
                    onAddToCart(productId, undefined);
                })
            }
        }

        // Product Page - Add to Cart click
        if (productPageAddButton.length > 0) {
            for(var j = 0; j < productPageAddButton.length; j++) {
                const el = productPageAddButton[j];
                el.addEventListener('click', () => {
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
        }

        // Remove from Cart click
        if (cartPageRemoveButton.length > 0) {
            for(var k = 0; k < cartPageRemoveButton.length; k++) {
                const el = cartPageRemoveButton[k];
                el.addEventListener('click', () => {
                    onRemoveFromCart(el.attributes[1].nodeValue);
                });
            }
        }

        if (quickViewModal.length > 0) {
            for(var l = 0; l < quickViewModal.length; l++) {
                const el = quickViewModal[l];
                el.addEventListener('click', (e) => {
                    if(e.target && e.target.id == __BC__.quickViewCartButtonId) {
                        const productId = document.querySelector(__BC__.modalHiddenProductId).value;
                        onAddToCart(productId, undefined);
                    }
                });
            }
        }
    }

    /***
     * Customerlabs default Ecommerce vents
     */

    
    /**
     * Tracks category views
     * 
     * @param {string} categoryName 
     */
    function onCategoryView(categoryName) {
        _cl.pageview("Category viewed", {"customProperties": {"category_name": categoryName}})
    }

    /**
     * Tracks Product views
     */
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

    /**
     * This function handles cart visits and send it to clabs
     */
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

    /**
     * This function taks 2 arguments productId and product object
     * If product object present will send added to cart event
     * else this function called from product list with product id
     *         so we add a cookie and wait
     * some times the list product button will be ajax in that time
     * will invoke the function findATCAndSend that will get data from
     * cart and send added to cart event to clabs
     * @param {string} productId
     * @param {object} product
     */
    function onAddToCart(productId, product) {
        if(product){
            propertiesToSend = {
                'customProperties': {
                    "product_category": "product_group",
                    "currency": __BC__.currency
                },
                'productProperties': [product]
            };
            _cl.trackClick("Added to cart", propertiesToSend)
        }else{
            set_cookie("cl_bc_ajax_atc_" + productId, productId);
            if(__BC__.mainPageAjaxAddButton){
                findATCAndSend();
            }
        }
    }

    /**
     * This function handles remove from cart event
     * @param {string} cartItemId 
     */
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

    /**
     * This function invoke when a checkout initated
     */
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

    /**
     * This function is triggered on the order confirmation page
     */
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
        
        if(analyticsData.order_id && window.localStorage){
            var purchases_str = localStorage.getItem('cl_past_purchases') || "{}";
            var purchases = JSON.parse(purchases_str);
            if(!purchases[""+analyticsData.order_id]){
                _cl.trackClick('Purchased', propertiesToSend);
                purchases[""+analyticsData.order_id] = "true";
                window.localStorage.setItem("cl_past_purchases", JSON.stringify(purchases));
            }
        }else{
            _cl.trackClick('Purchased', propertiesToSend);
        }
        
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
                            "v": userAttributes["email"].v,
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
                        delete_cookie("cl_bc_ajax_atc_" + product.productId);
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