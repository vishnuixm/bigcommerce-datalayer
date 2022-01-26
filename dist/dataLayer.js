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
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCxrQkFBa0I7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iaWdjb21tZXJjZS1kYXRhbGF5ZXIvLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogXHJcbiAgRGF0YWxheWVyIFV0aWxzIFxyXG4qL1xyXG53aW5kb3cuY2xTaG9waWZ5VHJhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgIFxyXG4gICAgZnVuY3Rpb24gaHRtbERlY29kZShpbnB1dCkge1xyXG4gICAgICAgIGlmICghaW5wdXQpIHJldHVybiAnJztcclxuICAgICAgICB2YXIgcGFyc2VkSW5wdXQgPSBpbnB1dC5yZXBsYWNlKC8oXFxyXFxufFxcbnxcXHIpL2dtLCAnJyk7XHJcbiAgICAgICAgdmFyIGRvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcocGFyc2VkSW5wdXQsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkb2MuZG9jdW1lbnRFbGVtZW50LnRleHRDb250ZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRVUkxQYXJhbXMobmFtZSwgdXJsKXtcclxuICAgICAgICBpZiAoIXVybCkgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgXCJcXFxcJCZcIik7XHJcbiAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChcIls/Jl1cIiArIG5hbWUgKyBcIig9KFteJiNdKil8JnwjfCQpXCIpLFxyXG4gICAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XHJcbiAgICAgICAgaWYgKCFyZXN1bHRzKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBpZiAoIXJlc3VsdHNbMl0pIHJldHVybiAnJztcclxuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldF9jb29raWUobmFtZSwgdmFsdWUpIHtcclxuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsnPScrIHZhbHVlICsnOyBQYXRoPS87JztcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0X2Nvb2tpZShuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZS5tYXRjaCgnKF58OylcXFxccyonICsgbmFtZSArICdcXFxccyo9XFxcXHMqKFteO10rKScpPy5wb3AoKSB8fCAnJztcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0X2Nvb2tpZV9zdGFydHdpdGgoa2V5KSB7XHJcbiAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cCgnKF58OylcXFxccyonICsga2V5ICsgJ1xcXFx3KlxcXFxzKj1cXFxccyooW147XSspJywgJ2cnKTtcclxuICAgICAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LmNvb2tpZS5tYXRjaEFsbChyZWdleCk7XHJcbiAgICAgICAgdmFyIG1hdGNoID0gbWF0Y2hlcy5uZXh0KCk7XHJcbiAgICAgICAgdmFyIHZhbHVlcyA9IFtdXHJcbiAgICAgICAgd2hpbGUoIW1hdGNoLmRvbmUpe1xyXG4gICAgICAgICAgICB2YWx1ZXMucHVzaChtYXRjaC52YWx1ZVsyXSk7XHJcbiAgICAgICAgICAgIG1hdGNoID0gbWF0Y2hlcy5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVsZXRlX2Nvb2tpZShuYW1lKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArJz07IFBhdGg9LzsgRXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAxIEdNVDsnO1xyXG4gICAgfTtcclxuXHJcbiAgICBfX0JDX18gPSB7XHJcbiAgICAgICAgcGFnZVR5cGU6ICd7e3BhZ2VfdHlwZX19JyxcclxuICAgICAgICBjYXRlZ29yeU5hbWU6ICd7e2NhdGVnb3J5Lm5hbWV9fScsXHJcbiAgICAgICAgY3VycmVuY3k6ICd7e2N1cnJlbmN5X3NlbGVjdG9yLmFjdGl2ZV9jdXJyZW5jeV9jb2RlfX0nLFxyXG4gICAgICAgIGFuYWx5dGljc0RhdGE6IHdpbmRvdy5hbmFseXRpY3NEYXRhIHx8IHt9LFxyXG4gICAgICAgIGNhcnRJdGVtczogaHRtbERlY29kZShcInt7anNvbiBjYXJ0Lml0ZW1zfX1cIiksXHJcbiAgICAgICAgY2hlY2tvdXRJZDogJ3t7Y2hlY2tvdXQuaWR9fScgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgIG9yZGVySWQ6ICd7e2NoZWNrb3V0Lm9yZGVyLmlkfX0nIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICBtYWluUGFnZUFqYXhBZGRCdXR0b246IGZhbHNlLCAvLyBzZXQgdHJ1ZSBpZiB0aGUgcHJvZHVjdHMgbGlzdCBoYXMgYWpheCBcImFkZCB0byBjYXJ0XCIgYnV0dG9uXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXN0b20gY29uZmlndXJhdGlvbiBzaG91bGQgYmUgZWRpdCBoZXJlXHJcbiAgICAgKi9cclxuICAgIHZhciBjdXN0b21CaW5kaW5ncyA9IHtcclxuICAgICAgICBtYWluUGFnZUFkZEJ1dHRvbjogW10sXHJcbiAgICAgICAgcHJvZHVjdFBhZ2VBZGRCdXR0b246IFtdLFxyXG4gICAgICAgIGNhcnRQYWdlUmVtb3ZlQnV0dG9uOiBbXSxcclxuICAgICAgICBzZWFyY2hUZXJtUXVlcnk6IFtdLFxyXG4gICAgICAgIHNlYXJjaFBhZ2U6IFtdLFxyXG4gICAgICAgIHF1aWNrVmlld01vZGFsOiBbXSxcclxuICAgICAgICBxdWlja1ZpZXdDYXJ0QnV0dG9uSWQ6IFtdLFxyXG4gICAgICAgIG1vZGFsSGlkZGVuUHJvZHVjdElkOiBbXSxcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGRlZmF1bHRCaW5kaW5ncyA9IHtcclxuICAgICAgICBtYWluUGFnZUFkZEJ1dHRvbjogW1wiW2RhdGEtYnV0dG9uLXR5cGU9J2FkZC1jYXJ0J11cIl0sXHJcbiAgICAgICAgcHJvZHVjdFBhZ2VBZGRCdXR0b246IFtcIiNmb3JtLWFjdGlvbi1hZGRUb0NhcnRcIl0sXHJcbiAgICAgICAgY2FydFBhZ2VSZW1vdmVCdXR0b246IFtcIi5jYXJ0LXJlbW92ZVwiXSxcclxuICAgICAgICBzZWFyY2hUZXJtUXVlcnk6IFtnZXRVUkxQYXJhbXMoJ3NlYXJjaF9xdWVyeScpXSxcclxuICAgICAgICBzZWFyY2hQYWdlOiBbJ3NlYXJjaCddLFxyXG4gICAgICAgIHF1aWNrVmlld01vZGFsOiBbXCIjbW9kYWxcIl0sXHJcbiAgICAgICAgcXVpY2tWaWV3Q2FydEJ1dHRvbklkOiBbXCJmb3JtLWFjdGlvbi1hZGRUb0NhcnRcIl0sXHJcbiAgICAgICAgbW9kYWxIaWRkZW5Qcm9kdWN0SWQ6IFtcIiNtb2RhbCAucHJvZHVjdFZpZXctZGV0YWlscy5wcm9kdWN0LW9wdGlvbnMgW25hbWU9J3Byb2R1Y3RfaWQnXVwiXVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0aXRjaCBiaW5kaW5nc1xyXG4gICAgb2JqZWN0QXJyYXkgPSBjdXN0b21CaW5kaW5ncztcclxuICAgIG91dHB1dE9iamVjdCA9IF9fQkNfXztcclxuICAgIGFwcGx5QmluZGluZ3MgPSBmdW5jdGlvbihvYmplY3RBcnJheSwgb3V0cHV0T2JqZWN0KXtcclxuICAgICAgICBmb3IgKHZhciB4IGluIG9iamVjdEFycmF5KSB7ICBcclxuICAgICAgICAgICAgdmFyIGtleSA9IHg7XHJcbiAgICAgICAgICAgIHZhciBvYmpzID0gb2JqZWN0QXJyYXlbeF07IFxyXG4gICAgICAgICAgICB2YWx1ZXMgPSBbXTsgICAgXHJcbiAgICAgICAgICAgIGlmKG9ianMubGVuZ3RoID4gMCl7ICAgIFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzLnB1c2gob2Jqcyk7XHJcbiAgICAgICAgICAgICAgICBpZihrZXkgaW4gb3V0cHV0T2JqZWN0KXsgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG91dHB1dE9iamVjdFtrZXldKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0T2JqZWN0W2tleV0gPSB2YWx1ZXMuam9pbihcIiwgXCIpOyBcclxuICAgICAgICAgICAgICAgIH1lbHNleyAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0T2JqZWN0W2tleV0gPSB2YWx1ZXMuam9pbihcIiwgXCIpO1xyXG4gICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgYXBwbHlCaW5kaW5ncyhjdXN0b21CaW5kaW5ncywgX19CQ19fKTtcclxuICAgIGFwcGx5QmluZGluZ3MoZGVmYXVsdEJpbmRpbmdzLCBfX0JDX18pO1xyXG5cclxuXHJcblxyXG4gICAgLypcclxuICAgIFByb2R1Y3QgRXZlbnQgbGlzdGVuZXJcclxuICAgICovXHJcblxyXG4gICAgZnVuY3Rpb24gYWRkUHJvZHVjdEV2ZW50TGlzdGVuZXJzKCkge1xyXG4gICAgICAgIHZhciBtYWluUGFnZUFkZEJ1dHRvbiAgICA9IEN6emxlKF9fQkNfXy5tYWluUGFnZUFkZEJ1dHRvbikgICAgfHwgW107IFxyXG4gICAgICAgIHZhciBwcm9kdWN0UGFnZUFkZEJ1dHRvbiA9IEN6emxlKF9fQkNfXy5wcm9kdWN0UGFnZUFkZEJ1dHRvbikgfHwgW107XHJcbiAgICAgICAgdmFyIGNhcnRQYWdlUmVtb3ZlQnV0dG9uID0gQ3p6bGUoX19CQ19fLmNhcnRQYWdlUmVtb3ZlQnV0dG9uKSB8fCBbXTtcclxuICAgICAgICB2YXIgcXVpY2tWaWV3TW9kYWwgPSBDenpsZShfX0JDX18ucXVpY2tWaWV3TW9kYWwpIHx8IFtdO1xyXG5cclxuXHJcbiAgICAgICAgLy8gTWFpbiBQYWdlIC0gQWRkIHRvIENhcnQgY2xpY2tcclxuICAgICAgICBpZiAobWFpblBhZ2VBZGRCdXR0b24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbWFpblBhZ2VBZGRCdXR0b24ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gbWFpblBhZ2VBZGRCdXR0b25baV07XHJcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGV2ZW50LnRhcmdldC5ocmVmLmluZGV4T2YoJ3Byb2R1Y3RfaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZHVjdElkID0gZXZlbnQudGFyZ2V0LmhyZWYuc2xpY2UoaW5kZXgpLnNwbGl0KCc9JylbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgb25BZGRUb0NhcnQocHJvZHVjdElkLCB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJvZHVjdCBQYWdlIC0gQWRkIHRvIENhcnQgY2xpY2tcclxuICAgICAgICBpZiAocHJvZHVjdFBhZ2VBZGRCdXR0b24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb3IodmFyIGogPSAwOyBqIDwgcHJvZHVjdFBhZ2VBZGRCdXR0b24ubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gcHJvZHVjdFBhZ2VBZGRCdXR0b25bal07XHJcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBvbkFkZFRvQ2FydCgne3twcm9kdWN0LmlkfX0nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9uYW1lXCI6ICd7e3Byb2R1Y3QudGl0bGV9fScsIC8vIE5hbWUgb3IgSUQgaXMgcmVxdWlyZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiAne3twcm9kdWN0LmlkfX0nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcHJpY2VcIjogJ3t7cHJvZHVjdC5wcmljZS53aXRob3V0X3RheC52YWx1ZX19JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6ICd7e3Byb2R1Y3QuY2F0ZWdvcnl9fScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF92YXJpYW50XCI6ICd7e3Byb2R1Y3Quc2t1fX0nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3Rfc2t1XCI6ICd7e3Byb2R1Y3Quc2t1fX0nXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGZyb20gQ2FydCBjbGlja1xyXG4gICAgICAgIGlmIChjYXJ0UGFnZVJlbW92ZUJ1dHRvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvcih2YXIgayA9IDA7IGsgPCBjYXJ0UGFnZVJlbW92ZUJ1dHRvbi5sZW5ndGg7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBjYXJ0UGFnZVJlbW92ZUJ1dHRvbltrXTtcclxuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uUmVtb3ZlRnJvbUNhcnQoZWwuYXR0cmlidXRlc1sxXS5ub2RlVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChxdWlja1ZpZXdNb2RhbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvcih2YXIgbCA9IDA7IGwgPCBxdWlja1ZpZXdNb2RhbC5sZW5ndGg7IGwrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBxdWlja1ZpZXdNb2RhbFtsXTtcclxuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZihlLnRhcmdldCAmJiBlLnRhcmdldC5pZCA9PSBfX0JDX18ucXVpY2tWaWV3Q2FydEJ1dHRvbklkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2R1Y3RJZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoX19CQ19fLm1vZGFsSGlkZGVuUHJvZHVjdElkKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25BZGRUb0NhcnQocHJvZHVjdElkLCB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKipcclxuICAgICAqIEN1c3RvbWVybGFicyBkZWZhdWx0IEVjb21tZXJjZSB2ZW50c1xyXG4gICAgICovXHJcblxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIFRyYWNrcyBjYXRlZ29yeSB2aWV3c1xyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2F0ZWdvcnlOYW1lIFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBvbkNhdGVnb3J5VmlldyhjYXRlZ29yeU5hbWUpIHtcclxuICAgICAgICBfY2wucGFnZXZpZXcoXCJDYXRlZ29yeSB2aWV3ZWRcIiwge1wiY3VzdG9tUHJvcGVydGllc1wiOiB7XCJjYXRlZ29yeV9uYW1lXCI6IGNhdGVnb3J5TmFtZX19KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhY2tzIFByb2R1Y3Qgdmlld3NcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb25Qcm9kdWN0RGV0YWlsc1ZpZXcoKSB7XHJcbiAgICAgICAgX2NsLnBhZ2V2aWV3KFwiUHJvZHVjdCB2aWV3ZWRcIiwge1xyXG4gICAgICAgICAgICBcImN1c3RvbVByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50X3R5cGVcIjogXCJwcm9kdWN0X2dyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnRfY2F0ZWdvcnlcIjogXCJ7e3Byb2R1Y3QuY2F0ZWdvcnl9fVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjdXJyZW5jeVwiOiBfX0JDX18uY3VycmVuY3lcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJwcm9kdWN0UHJvcGVydGllc1wiOiBbe1xyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogJ3t7cHJvZHVjdC50aXRsZX19JywgLy8gTmFtZSBvciBJRCBpcyByZXF1aXJlZC5cclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiAne3twcm9kdWN0LmlkfX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6ICd7e3Byb2R1Y3QucHJpY2Uud2l0aG91dF90YXgudmFsdWV9fScsXHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogJ3t7cHJvZHVjdC5jYXRlZ29yeX19JyxcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF92YXJpYW50XCI6ICd7e3Byb2R1Y3Quc2t1fX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiAne3twcm9kdWN0LnNrdX19J1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgY2FydCB2aXNpdHMgYW5kIHNlbmQgaXQgdG8gY2xhYnNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb25WaWV3Q2FydCgpIHtcclxuICAgICAgICB2YXIgcHJvZHVjdHMgPSBfX0JDX18uYW5hbHl0aWNzRGF0YS5wcm9kdWN0cyB8fCBfX0JDX18uY2FydEl0ZW1zIHx8IFtdXHJcbiAgICAgICAgdmFyIHByb3BlcnRpZXNUb1NlbmQgPSB7XHJcbiAgICAgICAgICAgICdjdXN0b21Qcm9wZXJ0aWVzJzoge1xyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6IFwicHJvZHVjdF9ncm91cFwiLFxyXG4gICAgICAgICAgICAgICAgXCJjdXJyZW5jeVwiOiBfX0JDX18uY3VycmVuY3lcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgJ3Byb2R1Y3RQcm9wZXJ0aWVzJzogcHJvZHVjdHMubWFwKGZ1bmN0aW9uIChwcm9kdWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9uYW1lXCI6IHByb2R1Y3QubmFtZSwgLy8gTmFtZSBvciBJRCBpcyByZXF1aXJlZC5cclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfaWRcIjogcHJvZHVjdC5wcm9kdWN0X2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9xdWFudGl0eVwiOiBwcm9kdWN0LnF1YW50aXR5LFxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9wcmljZVwiOiBwcm9kdWN0LnByaWNlLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBwcm9kdWN0LmNhdGVnb3J5IHx8IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ZhcmlhbnRcIjogcHJvZHVjdC5za3UsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiBwcm9kdWN0LnNrdVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgX2NsLnBhZ2V2aWV3KFwiQ2FydCB2aWV3ZWRcIiwgcHJvcGVydGllc1RvU2VuZClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgZnVuY3Rpb24gdGFrcyAyIGFyZ3VtZW50cyBwcm9kdWN0SWQgYW5kIHByb2R1Y3Qgb2JqZWN0XHJcbiAgICAgKiBJZiBwcm9kdWN0IG9iamVjdCBwcmVzZW50IHdpbGwgc2VuZCBhZGRlZCB0byBjYXJ0IGV2ZW50XHJcbiAgICAgKiBlbHNlIHRoaXMgZnVuY3Rpb24gY2FsbGVkIGZyb20gcHJvZHVjdCBsaXN0IHdpdGggcHJvZHVjdCBpZFxyXG4gICAgICogICAgICAgICBzbyB3ZSBhZGQgYSBjb29raWUgYW5kIHdhaXRcclxuICAgICAqIHNvbWUgdGltZXMgdGhlIGxpc3QgcHJvZHVjdCBidXR0b24gd2lsbCBiZSBhamF4IGluIHRoYXQgdGltZVxyXG4gICAgICogd2lsbCBpbnZva2UgdGhlIGZ1bmN0aW9uIGZpbmRBVENBbmRTZW5kIHRoYXQgd2lsbCBnZXQgZGF0YSBmcm9tXHJcbiAgICAgKiBjYXJ0IGFuZCBzZW5kIGFkZGVkIHRvIGNhcnQgZXZlbnQgdG8gY2xhYnNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9kdWN0SWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9kdWN0XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG9uQWRkVG9DYXJ0KHByb2R1Y3RJZCwgcHJvZHVjdCkge1xyXG4gICAgICAgIGlmKHByb2R1Y3Qpe1xyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICAgICAgJ2N1c3RvbVByb3BlcnRpZXMnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6IFwicHJvZHVjdF9ncm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogX19CQ19fLmN1cnJlbmN5XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgJ3Byb2R1Y3RQcm9wZXJ0aWVzJzogW3Byb2R1Y3RdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIF9jbC50cmFja0NsaWNrKFwiQWRkZWQgdG8gY2FydFwiLCBwcm9wZXJ0aWVzVG9TZW5kKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzZXRfY29va2llKFwiY2xfYmNfYWpheF9hdGNfXCIgKyBwcm9kdWN0SWQsIHByb2R1Y3RJZCk7XHJcbiAgICAgICAgICAgIGlmKF9fQkNfXy5tYWluUGFnZUFqYXhBZGRCdXR0b24pe1xyXG4gICAgICAgICAgICAgICAgZmluZEFUQ0FuZFNlbmQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgZnVuY3Rpb24gaGFuZGxlcyByZW1vdmUgZnJvbSBjYXJ0IGV2ZW50XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2FydEl0ZW1JZCBcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb25SZW1vdmVGcm9tQ2FydChjYXJ0SXRlbUlkKSB7XHJcbiAgICAgICAgdmFyIHByb2R1Y3RzID0gX19CQ19fLmFuYWx5dGljc0RhdGEucHJvZHVjdHMgfHwgX19CQ19fLmNhcnRJdGVtcyB8fCBbXVxyXG4gICAgICAgIGZvcih2YXIgaWQgaW4gcHJvZHVjdHMpe1xyXG4gICAgICAgICAgICB2YXIgcHJvZHVjdCA9IHByb2R1Y3RzW2lkXTtcclxuICAgICAgICAgICAgaWYocHJvZHVjdC5pZCA9PSBjYXJ0SXRlbUlkKXtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICdjdXN0b21Qcm9wZXJ0aWVzJzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogXCJwcm9kdWN0X2dyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogX19CQ19fLmN1cnJlbmN5XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAncHJvZHVjdFByb3BlcnRpZXMnIDogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2lkXCI6IHByb2R1Y3QucHJvZHVjdF9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcXVhbnRpdHlcIjogcHJvZHVjdC5xdWFudGl0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6IHByb2R1Y3QucHJpY2UudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBfY2wudHJhY2tDbGljaygnUmVtb3ZlZCBmcm9tIGNhcnQnLCBwcm9wZXJ0aWVzVG9TZW5kKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgZnVuY3Rpb24gaW52b2tlIHdoZW4gYSBjaGVja291dCBpbml0YXRlZFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBvbkNoZWNrb3V0U3RhcnRlZCgpIHtcclxuICAgICAgICB2YXIgcHJvcHMgPSB7fTtcclxuICAgICAgICB2YXIgYW5hbHl0aWNzRGF0YSA9IF9fQkNfXy5hbmFseXRpY3NEYXRhO1xyXG4gICAgICAgIGZvcih2YXIgayBpbiBhbmFseXRpY3NEYXRhKXtcclxuICAgICAgICAgICAgaWYoayAhPSBcInByb2R1Y3RzXCIgJiYgYW5hbHl0aWNzRGF0YVtrXSl7XHJcbiAgICAgICAgICAgICAgICBwcm9wc1trXSA9IGFuYWx5dGljc0RhdGFba107XHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHByb3BlcnRpZXNUb1NlbmQgPSB7XHJcbiAgICAgICAgICAgIFwiY3VzdG9tUHJvcGVydGllc1wiOiBwcm9wcyxcclxuICAgICAgICAgICAgXCJwcm9kdWN0UHJvcGVydGllc1wiOiBhbmFseXRpY3NEYXRhLnByb2R1Y3RzXHJcbiAgICAgICAgfVxyXG4gICAgICAgX2NsLnBhZ2V2aWV3KFwiQ2hlY2tvdXQgbWFkZVwiLCBwcm9wZXJ0aWVzVG9TZW5kKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBmdW5jdGlvbiBpcyB0cmlnZ2VyZWQgb24gdGhlIG9yZGVyIGNvbmZpcm1hdGlvbiBwYWdlXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG9uUHVyY2hhc2UoKSB7XHJcbiAgICAgICAgdmFyIGN1c3RvbVByb3BzID0ge307XHJcbiAgICAgICAgdmFyIGFuYWx5dGljc0RhdGEgPSBfX0JDX18uYW5hbHl0aWNzRGF0YTtcclxuICAgICAgICBmb3IodmFyIGsgaW4gYW5hbHl0aWNzRGF0YSl7XHJcbiAgICAgICAgICAgIGlmKGsgIT0gXCJwcm9kdWN0c1wiICAmJiBrICE9IFwiYmlsbGluZ0luZm9cIiAmJiBhbmFseXRpY3NEYXRhW2tdKXtcclxuICAgICAgICAgICAgICAgIGN1c3RvbVByb3BzW2tdID0gYW5hbHl0aWNzRGF0YVtrXTtcclxuICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgcHJvcGVydGllc1RvU2VuZCA9IHtcclxuICAgICAgICAgICAgXCJjdXN0b21Qcm9wZXJ0aWVzXCI6IGN1c3RvbVByb3BzLFxyXG4gICAgICAgICAgICBcInByb2R1Y3RQcm9wZXJ0aWVzXCI6IGFuYWx5dGljc0RhdGEucHJvZHVjdHNcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoYW5hbHl0aWNzRGF0YS5vcmRlcl9pZCAmJiB3aW5kb3cubG9jYWxTdG9yYWdlKXtcclxuICAgICAgICAgICAgdmFyIHB1cmNoYXNlc19zdHIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY2xfcGFzdF9wdXJjaGFzZXMnKSB8fCBcInt9XCI7XHJcbiAgICAgICAgICAgIHZhciBwdXJjaGFzZXMgPSBKU09OLnBhcnNlKHB1cmNoYXNlc19zdHIpO1xyXG4gICAgICAgICAgICBpZighcHVyY2hhc2VzW1wiXCIrYW5hbHl0aWNzRGF0YS5vcmRlcl9pZF0pe1xyXG4gICAgICAgICAgICAgICAgX2NsLnRyYWNrQ2xpY2soJ1B1cmNoYXNlZCcsIHByb3BlcnRpZXNUb1NlbmQpO1xyXG4gICAgICAgICAgICAgICAgcHVyY2hhc2VzW1wiXCIrYW5hbHl0aWNzRGF0YS5vcmRlcl9pZF0gPSBcInRydWVcIjtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImNsX3Bhc3RfcHVyY2hhc2VzXCIsIEpTT04uc3RyaW5naWZ5KHB1cmNoYXNlcykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIF9jbC50cmFja0NsaWNrKCdQdXJjaGFzZWQnLCBwcm9wZXJ0aWVzVG9TZW5kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoYW5hbHl0aWNzRGF0YS5iaWxsaW5nSW5mbyl7XHJcbiAgICAgICAgICAgIHZhciB1c2VyQXR0cmlidXRlcyA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgYmlsbGluZ0luZm8gPSBhbmFseXRpY3NEYXRhLmJpbGxpbmdJbmZvO1xyXG4gICAgICAgICAgICBpZihiaWxsaW5nSW5mby5lbWFpbCl7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gYmlsbGluZ0luZm8pe1xyXG4gICAgICAgICAgICAgICAgICAgaWYoayAhPSBcImN1c3RvbUZpZWxkc1wiICYmIGJpbGxpbmdJbmZvW2tdKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckF0dHJpYnV0ZXNba10gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidFwiOiBcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcInZcIjogYmlsbGluZ0luZm9ba11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBwcm9wcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBcImN1c3RvbVByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJfdHJhaXRzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidFwiOiBcIk9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2XCI6IHVzZXJBdHRyaWJ1dGVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRlbnRpZnlfYnlfZW1haWxcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0XCI6XCJzdHJpbmdcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidlwiOiB1c2VyQXR0cmlidXRlc1tcImVtYWlsXCJdLnYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImliXCI6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF9jbC5pZGVudGlmeShwcm9wcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblNlYXJjaFBhZ2UoKSB7XHJcbiAgICAgICAgdmFyIGN1c3RvbVByb3BlcnRpZXMgPSB7XHJcbiAgICAgICAgICAgICdzZWFyY2hfc3RyaW5nJzoge1xyXG4gICAgICAgICAgICAgICAgJ3QnOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICd2JzogX19CQ19fLnNlYXJjaFRlcm1RdWVyeVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBfY2wucGFnZXZpZXcoXCJTZWFyY2ggbWFkZVwiLCB7XCJjdXN0b21Qcm9wZXJ0aWVzXCI6IGN1c3RvbVByb3BlcnRpZXN9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgVmlldyBjYXJ0LCBDaGVja291dCAmIFB1cmNoYXNlZCBldmVudHMgaGVscGVyXHJcbiAgICAqL1xyXG5cclxuICAgIGNvbnN0IG1haWxTZWxlY3RvciA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2N1c3RvbWVyVmlldy1ib2R5Jyk7XHJcbiAgICBjb25zdCBwcm9kdWN0cyA9IFtdO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGdldERhdGEodXJsKSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgY2FjaGU6ICduby1jYWNoZScsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBnZXRQdXJjaGFzZURhdGEoY2FsbGJhY2spIHtcclxuICAgICAgIGlmKF9fQkNfXy5vcmRlcklkKXtcclxuICAgICAgICAgICBnZXREYXRhKGAvYXBpL3N0b3JlZnJvbnQvb3JkZXIvJHtfX0JDX18ub3JkZXJJZH1gKS50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhLmxpbmVJdGVtcy5waHlzaWNhbEl0ZW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBkYXRhLmxpbmVJdGVtcy5waHlzaWNhbEl0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9pZDogcHJvZHVjdC5wcm9kdWN0SWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X3NrdTogcHJvZHVjdC5za3UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X25hbWU6IHByb2R1Y3QubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfYnJhbmQ6IHByb2R1Y3QuYnJhbmQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X3ByaWNlOiBwcm9kdWN0LnNhbGVQcmljZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfcXVhbnRpdHk6IHByb2R1Y3QucXVhbnRpdHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF9fQkNfXy5hbmFseXRpY3NEYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmRlcl9pZDogZGF0YS5vcmRlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YS5vcmRlckFtb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZW51ZTogZGF0YS5vcmRlckFtb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hpcHBpbmc6IGRhdGEuc2hpcHBpbmdDb3N0VG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRheDogZGF0YS50YXhUb3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY291bnQ6IGRhdGEuZGlzY291bnRBbW91bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBkYXRhLmN1cnJlbmN5LmNvZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogZGF0YS5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RzOiBwcm9kdWN0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmlsbGluZ0luZm86IGRhdGEuYmlsbGluZ0FkZHJlc3NcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGNhbGxiYWNrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfSlcclxuICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRDaGVja291dERhdGEoY2FsbGJhY2spIHtcclxuICAgICAgICBpZihfX0JDX18uY2hlY2tvdXRJZCl7XHJcbiAgICAgICAgICAgIGdldERhdGEoYC9hcGkvc3RvcmVmcm9udC9jaGVja291dHMvJHtfX0JDX18uY2hlY2tvdXRJZH1gKS50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5jYXJ0ICYmIGRhdGEuY2FydC5saW5lSXRlbXMucGh5c2ljYWxJdGVtcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgZGF0YS5jYXJ0LmxpbmVJdGVtcy5waHlzaWNhbEl0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9pZDogcHJvZHVjdC5wcm9kdWN0SWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X3NrdTogcHJvZHVjdC5za3UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X25hbWU6IHByb2R1Y3QubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfYnJhbmQ6IHByb2R1Y3QuYnJhbmQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X3ByaWNlOiBwcm9kdWN0LnNhbGVQcmljZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfcXVhbnRpdHk6IHByb2R1Y3QucXVhbnRpdHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF9fQkNfXy5hbmFseXRpY3NEYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja291dF9pZDogZGF0YS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JkZXJfaWQ6IGRhdGEub3JkZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGEuZ3JhbmRUb3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZW51ZTogZGF0YS5zdWJ0b3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hpcHBpbmc6IGRhdGEuc2hpcHBpbmdDb3N0VG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRheDogZGF0YS50YXhUb3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY291bnQ6IGRhdGEuY2FydC5kaXNjb3VudEFtb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVuY3k6IGRhdGEuY2FydC5jdXJyZW5jeS5jb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0czogcHJvZHVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjayl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIFxyXG4gICAgICAgICAgICBpZiAobWFpbFNlbGVjdG9yICYmIG1haWxTZWxlY3RvclswXSkge1xyXG4gICAgICAgICAgICAgICAgdXNlckVtYWlsID0gbWFpbFNlbGVjdG9yWzBdLmlubmVySFRNTDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmaW5kQVRDQW5kU2VuZCgpe1xyXG4gICAgICAgIHZhciBwZW5kaW5nTGlzdCA9IGdldF9jb29raWVfc3RhcnR3aXRoKFwiY2xfYmNfYWpheF9hdGNfXCIpO1xyXG4gICAgICAgIGlmKHBlbmRpbmdMaXN0Lmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICBnZXRQcm9kdWN0QW5kU2VuZChwZW5kaW5nTGlzdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFByb2R1Y3RBbmRTZW5kKHByb2R1Y3RJZHMpIHtcclxuICAgICAgICBnZXREYXRhKGAvYXBpL3N0b3JlZnJvbnQvY2FydHNgKS50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBjYXJ0ID0gZGF0YVswXTtcclxuICAgICAgICAgICAgaWYgKGNhcnQgJiYgY2FydC5saW5lSXRlbXMucGh5c2ljYWxJdGVtcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBjYXJ0LmxpbmVJdGVtcy5waHlzaWNhbEl0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHJvZHVjdElkcy5pbmNsdWRlcyhcIlwiK3Byb2R1Y3QucHJvZHVjdElkKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQWRkVG9DYXJ0KHByb2R1Y3QucHJvZHVjdElkLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfbmFtZVwiOiBwcm9kdWN0Lm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfaWRcIjogcHJvZHVjdC5wcm9kdWN0SWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcXVhbnRpdHlcIjogcHJvZHVjdC5xdWFudGl0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9wcmljZVwiOiBwcm9kdWN0LnNhbGVQcmljZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBwcm9kdWN0LmNhdGVnb3J5IHwgXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9za3VcIjogcHJvZHVjdC5za3VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9jb29raWUoXCJjbF9iY19hamF4X2F0Y19cIiArIHByb2R1Y3QucHJvZHVjdElkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICAvKlxyXG4gICAgQmlnQ29tbWVyY2UgRXZlbnRzIE1hbmFnZXJcclxuICAgICovXHJcbiAgIFxyXG4gICAgYWRkUHJvZHVjdEV2ZW50TGlzdGVuZXJzKCk7XHJcbiAgIFxyXG4gICAgdmFyIHNlYXJjaFBhZ2UgPSBuZXcgUmVnRXhwKF9fQkNfXy5zZWFyY2hQYWdlLCBcImdcIik7XHJcbiAgICBcclxuICAgIGZpbmRBVENBbmRTZW5kKCk7XHJcblxyXG4gICAgc3dpdGNoIChfX0JDX18ucGFnZVR5cGUpIHtcclxuICAgICAgICBjYXNlICdjYXRlZ29yeSc6XHJcbiAgICAgICAgICAgIG9uQ2F0ZWdvcnlWaWV3KF9fQkNfXy5jYXRlZ29yeU5hbWUpO1xyXG4gICAgICAgICAgICBicmVhazsgICAgXHJcbiAgICAgICAgY2FzZSAncHJvZHVjdCc6XHJcbiAgICAgICAgICAgIG9uUHJvZHVjdERldGFpbHNWaWV3KCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBjYXNlICdjaGVja291dCc6XHJcbiAgICAgICAgICAgIGdldENoZWNrb3V0RGF0YShvbkNoZWNrb3V0U3RhcnRlZCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBjYXNlICdvcmRlcmNvbmZpcm1hdGlvbic6XHJcbiAgICAgICAgICAgIGdldFB1cmNoYXNlRGF0YShvblB1cmNoYXNlKTtcclxuICAgICAgICAgICAgYnJlYWs7ICAgIFxyXG4gICAgICAgIGNhc2UgJ2NhcnQnOlxyXG4gICAgICAgICAgICBvblZpZXdDYXJ0KCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBpZiAoX19CQ19fLnBhZ2VUeXBlID09PSAnc2VhcmNoJyB8fCBkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaChzZWFyY2hQYWdlKSl7XHJcbiAgICAgICAgICAgICAgICBvblNlYXJjaFBhZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbn0iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=