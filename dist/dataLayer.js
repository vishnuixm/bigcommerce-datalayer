/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/* 
  Datalayer Utils 
*/
window.clShopifyTrack = function() {

    var dataLayer = [];
    if (window.dataLayer) {
        dataLayer = window.dataLayer;
    }

    addDataLayerListener(); // Listener for Push events

    var pageType = '{{page_type}}';
    var categoryName = '{{category.name}}';
    var BCcurrency = '{{currency_selector.active_currency_code}}';
    var analyticsData = window.analyticsData || [];
    var cartItems = htmlDecode("{{json cart.items}}");
    var validateDatalayerJson = () => ({});


    function htmlDecode(input) {
        if (!input) return '';
        var parsedInput = input.replace(/(\r\n|\n|\r)/gm, '');
        var doc = new DOMParser().parseFromString(parsedInput, 'text/html');
        return JSON.parse(doc.documentElement.textContent);
    }

    function getShopper() {
        let name = '{{customer.name}}';
            name = name.split(" ");
        return {
            customer_id: analyticsData.userId || '{{customer.id}}',
            email: analyticsData.userEmail || '{{customer.email}}',
            first_name: name[0],
            last_name: name[1],
        };
    }

    /*
    Product Event listener
    */

    function addProductEventListeners() {
        var mainPageAddButton =    document.querySelectorAll("[data-button-type='add-cart']") || []; //Add to cart button selector
        var productPageAddButton = document.getElementById('form-action-addToCart'); //Add to cart form selector
        var cartPageRemoveButton = document.getElementsByClassName('cart-remove') || []; //Remove from cart button selector
        var cartButton =           document.getElementsByClassName('navUser-item--cart') || []; //Show Cart selector


        // Main Page - Add to Cart click
        if (mainPageAddButton.length > 0) {
            mainPageAddButton.forEach((el) =>
                el.addEventListener('click', (event) => {
                    var index = event.target.href.indexOf('product_id');
                    var productId = event.target.href.slice(index).split('=')[1];
                    onAddToCart(productId);
                })
            );
        }

        // Product Page - Add to Cart click
        if (productPageAddButton) {
            productPageAddButton.addEventListener('click', () => {
                onAddToCart('{{product.id}}');
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
        // Cart button click
        if (cartButton.length > 0) {
            cartButton[0].addEventListener('click', () => {
                onViewCart();
            })
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
                "currency": BCcurrency
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
        var products = analyticsData.products || cartItems || []
        var propertiesToSend = {
            'customProperties': {
                "product_category": "product_group",
                "currency": BCcurrency
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
    function onAddToCart(productId) {
        propertiesToSend = {
            'customProperties': {
                "product_category": "product_group",
                "currency": BCcurrency
            },
            'productProperties': [{
                "product_name": '{{product.title}}', // Name or ID is required.
                "product_id": '{{product.id}}',
                "product_price": '{{product.price.without_tax.value}}',
                "product_category": '{{product.category}}',
                "product_variant": '{{product.sku}}',
                "product_sku": '{{product.sku}}'
            }]
        };
        _cl.trackClick("Add to Cart", propertiesToSend)
    }

    function onRemoveFromCart(cartItemId) {
        var products = analyticsData.products || cartItems || []
        for(var id in products){
            var product = products[id];
            if(product.id == cartItemId){
                var propertiesToSend = {
                    'customProperties': {
                        "product_category": "product_group",
                        "currency": BCcurrency
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
                       userAttributes[k] = billingInfo[k];
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



    function addDataLayerListener() {
        dataLayer.push = function (e) {
            Array.prototype.push.call(dataLayer, e);
            if (dataLayer && dataLayer.length && dataLayer.length > 0) {
                const dataLayerLength = dataLayer.length;
                const lastAddedItem = dataLayer[dataLayerLength - 1];
                console.log(lastAddedItem);
                validateDatalayerJson(lastAddedItem, 'event');
                validateDatalayerJson(lastAddedItem, 'ecommerce');
                validateDatalayerJson(lastAddedItem, 'shopper');
            }
        };
    }

    /*
    View cart, Checkout & Purchased events helper
    */

    const mailSelector = document.getElementsByClassName('customerView-body');
    const checkoutId = '{{checkout.id}}' || 0;
    const orderId = '{{checkout.order.id}}' || 0;
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
       if(orderId){
           getData(`/api/storefront/order/${orderId}`).then((data) => {
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
                    analyticsData = {
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
        if(checkoutId){
            getData(`/api/storefront/checkouts/${checkoutId}`).then((data) => {
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
                    analyticsData = {
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
                // analyticsData.userId = userId;
            }
        }
    }

    /*
    BigCommerce Events Manager
    */

    addProductEventListeners();

    if (pageType === 'category') {
        onCategoryView(categoryName);
    } else if (pageType === 'product') {
        onProductDetailsView();
    } else if (pageType === 'checkout') {
        getCheckoutData(onCheckoutStarted);
    } else if (pageType === 'orderconfirmation') {
        getPurchaseData(onPurchase);
    } else if (pageType === 'cart') {
        onViewCart();
    }
}
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QkFBdUIsbUJBQW1CLEtBQUssQ0FBUztBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCxXQUFXO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsQyIsInNvdXJjZXMiOlsid2VicGFjazovL2JpZ2NvbW1lcmNlLWRhdGFsYXllci8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcclxuICBEYXRhbGF5ZXIgVXRpbHMgXHJcbiovXHJcbndpbmRvdy5jbFNob3BpZnlUcmFjayA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHZhciBkYXRhTGF5ZXIgPSBbXTtcclxuICAgIGlmICh3aW5kb3cuZGF0YUxheWVyKSB7XHJcbiAgICAgICAgZGF0YUxheWVyID0gd2luZG93LmRhdGFMYXllcjtcclxuICAgIH1cclxuXHJcbiAgICBhZGREYXRhTGF5ZXJMaXN0ZW5lcigpOyAvLyBMaXN0ZW5lciBmb3IgUHVzaCBldmVudHNcclxuXHJcbiAgICB2YXIgcGFnZVR5cGUgPSAne3twYWdlX3R5cGV9fSc7XHJcbiAgICB2YXIgY2F0ZWdvcnlOYW1lID0gJ3t7Y2F0ZWdvcnkubmFtZX19JztcclxuICAgIHZhciBCQ2N1cnJlbmN5ID0gJ3t7Y3VycmVuY3lfc2VsZWN0b3IuYWN0aXZlX2N1cnJlbmN5X2NvZGV9fSc7XHJcbiAgICB2YXIgYW5hbHl0aWNzRGF0YSA9IHdpbmRvdy5hbmFseXRpY3NEYXRhIHx8IFtdO1xyXG4gICAgdmFyIGNhcnRJdGVtcyA9IGh0bWxEZWNvZGUoXCJ7e2pzb24gY2FydC5pdGVtc319XCIpO1xyXG4gICAgdmFyIHZhbGlkYXRlRGF0YWxheWVySnNvbiA9ICgpID0+ICh7fSk7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGh0bWxEZWNvZGUoaW5wdXQpIHtcclxuICAgICAgICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XHJcbiAgICAgICAgdmFyIHBhcnNlZElucHV0ID0gaW5wdXQucmVwbGFjZSgvKFxcclxcbnxcXG58XFxyKS9nbSwgJycpO1xyXG4gICAgICAgIHZhciBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHBhcnNlZElucHV0LCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZG9jLmRvY3VtZW50RWxlbWVudC50ZXh0Q29udGVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hvcHBlcigpIHtcclxuICAgICAgICBsZXQgbmFtZSA9ICd7e2N1c3RvbWVyLm5hbWV9fSc7XHJcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLnNwbGl0KFwiIFwiKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjdXN0b21lcl9pZDogYW5hbHl0aWNzRGF0YS51c2VySWQgfHwgJ3t7Y3VzdG9tZXIuaWR9fScsXHJcbiAgICAgICAgICAgIGVtYWlsOiBhbmFseXRpY3NEYXRhLnVzZXJFbWFpbCB8fCAne3tjdXN0b21lci5lbWFpbH19JyxcclxuICAgICAgICAgICAgZmlyc3RfbmFtZTogbmFtZVswXSxcclxuICAgICAgICAgICAgbGFzdF9uYW1lOiBuYW1lWzFdLFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgIFByb2R1Y3QgRXZlbnQgbGlzdGVuZXJcclxuICAgICovXHJcblxyXG4gICAgZnVuY3Rpb24gYWRkUHJvZHVjdEV2ZW50TGlzdGVuZXJzKCkge1xyXG4gICAgICAgIHZhciBtYWluUGFnZUFkZEJ1dHRvbiA9ICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbZGF0YS1idXR0b24tdHlwZT0nYWRkLWNhcnQnXVwiKSB8fCBbXTsgLy9BZGQgdG8gY2FydCBidXR0b24gc2VsZWN0b3JcclxuICAgICAgICB2YXIgcHJvZHVjdFBhZ2VBZGRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZm9ybS1hY3Rpb24tYWRkVG9DYXJ0Jyk7IC8vQWRkIHRvIGNhcnQgZm9ybSBzZWxlY3RvclxyXG4gICAgICAgIHZhciBjYXJ0UGFnZVJlbW92ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2NhcnQtcmVtb3ZlJykgfHwgW107IC8vUmVtb3ZlIGZyb20gY2FydCBidXR0b24gc2VsZWN0b3JcclxuICAgICAgICB2YXIgY2FydEJ1dHRvbiA9ICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCduYXZVc2VyLWl0ZW0tLWNhcnQnKSB8fCBbXTsgLy9TaG93IENhcnQgc2VsZWN0b3JcclxuXHJcblxyXG4gICAgICAgIC8vIE1haW4gUGFnZSAtIEFkZCB0byBDYXJ0IGNsaWNrXHJcbiAgICAgICAgaWYgKG1haW5QYWdlQWRkQnV0dG9uLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbWFpblBhZ2VBZGRCdXR0b24uZm9yRWFjaCgoZWwpID0+XHJcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGV2ZW50LnRhcmdldC5ocmVmLmluZGV4T2YoJ3Byb2R1Y3RfaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZHVjdElkID0gZXZlbnQudGFyZ2V0LmhyZWYuc2xpY2UoaW5kZXgpLnNwbGl0KCc9JylbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgb25BZGRUb0NhcnQocHJvZHVjdElkKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9kdWN0IFBhZ2UgLSBBZGQgdG8gQ2FydCBjbGlja1xyXG4gICAgICAgIGlmIChwcm9kdWN0UGFnZUFkZEJ1dHRvbikge1xyXG4gICAgICAgICAgICBwcm9kdWN0UGFnZUFkZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIG9uQWRkVG9DYXJ0KCd7e3Byb2R1Y3QuaWR9fScpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBmcm9tIENhcnQgY2xpY2tcclxuICAgICAgICBpZiAoY2FydFBhZ2VSZW1vdmVCdXR0b24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjYXJ0UGFnZVJlbW92ZUJ1dHRvbi5mb3JFYWNoKChlbCkgPT5cclxuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uUmVtb3ZlRnJvbUNhcnQoZWwuYXR0cmlidXRlc1sxXS5ub2RlVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ2FydCBidXR0b24gY2xpY2tcclxuICAgICAgICBpZiAoY2FydEJ1dHRvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNhcnRCdXR0b25bMF0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvblZpZXdDYXJ0KCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICBEYXRhbGF5ZXIgZXZlbnRzXHJcbiAgICAqL1xyXG5cclxuICAgIC8vIE1lYXN1cmUgcHJvZHVjdC9pdGVtIGxpc3Qgdmlld3MvaW1wcmVzc2lvbnNcclxuICAgIGZ1bmN0aW9uIG9uQ2F0ZWdvcnlWaWV3KGNhdGVnb3J5TmFtZSkge1xyXG4gICAgICAgIF9jbC5wYWdldmlldyhcIkNhdGVnb3J5IHZpZXdlZFwiLCB7XCJjdXN0b21Qcm9wZXJ0aWVzXCI6IHtcImNhdGVnb3J5X25hbWVcIjogY2F0ZWdvcnlOYW1lfX0pXHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWVhc3VyZSBhIHZpZXcgb2YgcHJvZHVjdCBkZXRhaWxzLiBUaGlzIGV4YW1wbGUgYXNzdW1lcyB0aGUgZGV0YWlsIHZpZXcgb2NjdXJzIG9uIHBhZ2Vsb2FkLFxyXG4gICAgZnVuY3Rpb24gb25Qcm9kdWN0RGV0YWlsc1ZpZXcoKSB7XHJcbiAgICAgICAgX2NsLnBhZ2V2aWV3KFwiUHJvZHVjdCB2aWV3ZWRcIiwge1xyXG4gICAgICAgICAgICBcImN1c3RvbVByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50X3R5cGVcIjogXCJwcm9kdWN0X2dyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnRfY2F0ZWdvcnlcIjogXCJ7e3Byb2R1Y3QuY2F0ZWdvcnl9fVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjdXJyZW5jeVwiOiBCQ2N1cnJlbmN5XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwicHJvZHVjdFByb3BlcnRpZXNcIjogW3tcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9uYW1lXCI6ICd7e3Byb2R1Y3QudGl0bGV9fScsIC8vIE5hbWUgb3IgSUQgaXMgcmVxdWlyZWQuXHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfaWRcIjogJ3t7cHJvZHVjdC5pZH19JyxcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9wcmljZVwiOiAne3twcm9kdWN0LnByaWNlLndpdGhvdXRfdGF4LnZhbHVlfX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6ICd7e3Byb2R1Y3QuY2F0ZWdvcnl9fScsXHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfdmFyaWFudFwiOiAne3twcm9kdWN0LnNrdX19JyxcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9za3VcIjogJ3t7cHJvZHVjdC5za3V9fSdcclxuICAgICAgICAgICAgfV1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoaXMgZXZlbnQgc2lnbmlmaWVzIHRoYXQgYSB1c2VyIHZpZXdlZCB0aGVpciBjYXJ0LlxyXG4gICAgZnVuY3Rpb24gb25WaWV3Q2FydCgpIHtcclxuICAgICAgICB2YXIgcHJvZHVjdHMgPSBhbmFseXRpY3NEYXRhLnByb2R1Y3RzIHx8IGNhcnRJdGVtcyB8fCBbXVxyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICAnY3VzdG9tUHJvcGVydGllcyc6IHtcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBcInByb2R1Y3RfZ3JvdXBcIixcclxuICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogQkNjdXJyZW5jeVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAncHJvZHVjdFByb3BlcnRpZXMnOiBwcm9kdWN0cy5tYXAoZnVuY3Rpb24gKHByb2R1Y3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogcHJvZHVjdC5uYW1lLCAvLyBOYW1lIG9yIElEIGlzIHJlcXVpcmVkLlxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiBwcm9kdWN0LnByb2R1Y3RfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3F1YW50aXR5XCI6IHByb2R1Y3QucXVhbnRpdHksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6IHByb2R1Y3QucHJpY2UudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6IHByb2R1Y3QuY2F0ZWdvcnkgfHwgXCJcIixcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfdmFyaWFudFwiOiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3Rfc2t1XCI6IHByb2R1Y3Quc2t1XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfTtcclxuICAgICAgICBfY2wucGFnZXZpZXcoXCJDYXJ0IHZpZXdlZFwiLCBwcm9wZXJ0aWVzVG9TZW5kKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE1lYXN1cmUgd2hlbiBhIHByb2R1Y3QgaXMgYWRkZWQgdG8gYSBzaG9wcGluZyBjYXJ0XHJcbiAgICBmdW5jdGlvbiBvbkFkZFRvQ2FydChwcm9kdWN0SWQpIHtcclxuICAgICAgICBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICAnY3VzdG9tUHJvcGVydGllcyc6IHtcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBcInByb2R1Y3RfZ3JvdXBcIixcclxuICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogQkNjdXJyZW5jeVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAncHJvZHVjdFByb3BlcnRpZXMnOiBbe1xyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogJ3t7cHJvZHVjdC50aXRsZX19JywgLy8gTmFtZSBvciBJRCBpcyByZXF1aXJlZC5cclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiAne3twcm9kdWN0LmlkfX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6ICd7e3Byb2R1Y3QucHJpY2Uud2l0aG91dF90YXgudmFsdWV9fScsXHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogJ3t7cHJvZHVjdC5jYXRlZ29yeX19JyxcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF92YXJpYW50XCI6ICd7e3Byb2R1Y3Quc2t1fX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiAne3twcm9kdWN0LnNrdX19J1xyXG4gICAgICAgICAgICB9XVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgX2NsLnRyYWNrQ2xpY2soXCJBZGQgdG8gQ2FydFwiLCBwcm9wZXJ0aWVzVG9TZW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uUmVtb3ZlRnJvbUNhcnQoY2FydEl0ZW1JZCkge1xyXG4gICAgICAgIHZhciBwcm9kdWN0cyA9IGFuYWx5dGljc0RhdGEucHJvZHVjdHMgfHwgY2FydEl0ZW1zIHx8IFtdXHJcbiAgICAgICAgZm9yKHZhciBpZCBpbiBwcm9kdWN0cyl7XHJcbiAgICAgICAgICAgIHZhciBwcm9kdWN0ID0gcHJvZHVjdHNbaWRdO1xyXG4gICAgICAgICAgICBpZihwcm9kdWN0LmlkID09IGNhcnRJdGVtSWQpe1xyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnRpZXNUb1NlbmQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2N1c3RvbVByb3BlcnRpZXMnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBcInByb2R1Y3RfZ3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJjdXJyZW5jeVwiOiBCQ2N1cnJlbmN5XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAncHJvZHVjdFByb3BlcnRpZXMnIDogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2lkXCI6IHByb2R1Y3QucHJvZHVjdF9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcXVhbnRpdHlcIjogcHJvZHVjdC5xdWFudGl0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3NrdVwiOiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3ByaWNlXCI6IHByb2R1Y3QucHJpY2UudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBfY2wudHJhY2tDbGljaygnUmVtb3ZlZCBmcm9tIGNhcnQnLCBwcm9wZXJ0aWVzVG9TZW5kKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvbkNoZWNrb3V0U3RhcnRlZCgpIHtcclxuICAgICAgICB2YXIgcHJvcHMgPSB7fTtcclxuICAgICAgICBmb3IodmFyIGsgaW4gYW5hbHl0aWNzRGF0YSl7XHJcbiAgICAgICAgICAgIGlmKGsgIT0gXCJwcm9kdWN0c1wiICYmIGFuYWx5dGljc0RhdGFba10pe1xyXG4gICAgICAgICAgICAgICAgcHJvcHNba10gPSBhbmFseXRpY3NEYXRhW2tdO1xyXG4gICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICBcImN1c3RvbVByb3BlcnRpZXNcIjogcHJvcHMsXHJcbiAgICAgICAgICAgIFwicHJvZHVjdFByb3BlcnRpZXNcIjogYW5hbHl0aWNzRGF0YS5wcm9kdWN0c1xyXG4gICAgICAgIH1cclxuICAgICAgIF9jbC5wYWdldmlldyhcIkNoZWNrb3V0IG1hZGVcIiwgcHJvcGVydGllc1RvU2VuZClcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblB1cmNoYXNlKCkge1xyXG4gICAgICAgIHZhciBjdXN0b21Qcm9wcyA9IHt9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcih2YXIgayBpbiBhbmFseXRpY3NEYXRhKXtcclxuICAgICAgICAgICAgaWYoayAhPSBcInByb2R1Y3RzXCIgICYmIGsgIT0gXCJiaWxsaW5nSW5mb1wiICYmIGFuYWx5dGljc0RhdGFba10pe1xyXG4gICAgICAgICAgICAgICAgY3VzdG9tUHJvcHNba10gPSBhbmFseXRpY3NEYXRhW2tdO1xyXG4gICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICBcImN1c3RvbVByb3BlcnRpZXNcIjogY3VzdG9tUHJvcHMsXHJcbiAgICAgICAgICAgIFwicHJvZHVjdFByb3BlcnRpZXNcIjogYW5hbHl0aWNzRGF0YS5wcm9kdWN0c1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBfY2wucGFnZXZpZXcoXCJQdXJjaGFzZWRcIiwgcHJvcGVydGllc1RvU2VuZClcclxuXHJcbiAgICAgICAgaWYoYW5hbHl0aWNzRGF0YS5iaWxsaW5nSW5mbyl7XHJcbiAgICAgICAgICAgIHZhciB1c2VyQXR0cmlidXRlcyA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgYmlsbGluZ0luZm8gPSBhbmFseXRpY3NEYXRhLmJpbGxpbmdJbmZvO1xyXG4gICAgICAgICAgICBpZihiaWxsaW5nSW5mby5lbWFpbCl7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gYmlsbGluZ0luZm8pe1xyXG4gICAgICAgICAgICAgICAgICAgaWYoayAhPSBcImN1c3RvbUZpZWxkc1wiICYmIGJpbGxpbmdJbmZvW2tdKXtcclxuICAgICAgICAgICAgICAgICAgICAgICB1c2VyQXR0cmlidXRlc1trXSA9IGJpbGxpbmdJbmZvW2tdO1xyXG4gICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY3VzdG9tUHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcl90cmFpdHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0XCI6IFwiT2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZcIjogdXNlckF0dHJpYnV0ZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpZGVudGlmeV9ieV9lbWFpbFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRcIjpcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2XCI6IHVzZXJBdHRyaWJ1dGVzW1wiZW1haWxcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImliXCI6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF9jbC5pZGVudGlmeShwcm9wcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGFkZERhdGFMYXllckxpc3RlbmVyKCkge1xyXG4gICAgICAgIGRhdGFMYXllci5wdXNoID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbChkYXRhTGF5ZXIsIGUpO1xyXG4gICAgICAgICAgICBpZiAoZGF0YUxheWVyICYmIGRhdGFMYXllci5sZW5ndGggJiYgZGF0YUxheWVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFMYXllckxlbmd0aCA9IGRhdGFMYXllci5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsYXN0QWRkZWRJdGVtID0gZGF0YUxheWVyW2RhdGFMYXllckxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobGFzdEFkZGVkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZURhdGFsYXllckpzb24obGFzdEFkZGVkSXRlbSwgJ2V2ZW50Jyk7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZURhdGFsYXllckpzb24obGFzdEFkZGVkSXRlbSwgJ2Vjb21tZXJjZScpO1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGVEYXRhbGF5ZXJKc29uKGxhc3RBZGRlZEl0ZW0sICdzaG9wcGVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICBWaWV3IGNhcnQsIENoZWNrb3V0ICYgUHVyY2hhc2VkIGV2ZW50cyBoZWxwZXJcclxuICAgICovXHJcblxyXG4gICAgY29uc3QgbWFpbFNlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY3VzdG9tZXJWaWV3LWJvZHknKTtcclxuICAgIGNvbnN0IGNoZWNrb3V0SWQgPSAne3tjaGVja291dC5pZH19JyB8fCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBvcmRlcklkID0gJ3t7Y2hlY2tvdXQub3JkZXIuaWR9fScgfHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3QgcHJvZHVjdHMgPSBbXTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBnZXREYXRhKHVybCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZ2V0UHVyY2hhc2VEYXRhKGNhbGxiYWNrKSB7XHJcbiAgICAgICBpZihvcmRlcklkKXtcclxuICAgICAgICAgICBnZXREYXRhKGAvYXBpL3N0b3JlZnJvbnQvb3JkZXIvJHtvcmRlcklkfWApLnRoZW4oKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIGRhdGEubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X2lkOiBwcm9kdWN0LnByb2R1Y3RJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3Rfc2t1OiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfbmFtZTogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9icmFuZDogcHJvZHVjdC5icmFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfcHJpY2U6IHByb2R1Y3Quc2FsZVByaWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9xdWFudGl0eTogcHJvZHVjdC5xdWFudGl0eVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYW5hbHl0aWNzRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JkZXJfaWQ6IGRhdGEub3JkZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGEub3JkZXJBbW91bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldmVudWU6IGRhdGEub3JkZXJBbW91bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaXBwaW5nOiBkYXRhLnNoaXBwaW5nQ29zdFRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXg6IGRhdGEudGF4VG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdW50OiBkYXRhLmRpc2NvdW50QW1vdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW5jeTogZGF0YS5jdXJyZW5jeS5jb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGRhdGEuc3RhdHVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0czogcHJvZHVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJpbGxpbmdJbmZvOiBkYXRhLmJpbGxpbmdBZGRyZXNzXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjayl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0pXHJcbiAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Q2hlY2tvdXREYXRhKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYoY2hlY2tvdXRJZCl7XHJcbiAgICAgICAgICAgIGdldERhdGEoYC9hcGkvc3RvcmVmcm9udC9jaGVja291dHMvJHtjaGVja291dElkfWApLnRoZW4oKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhcnQgJiYgZGF0YS5jYXJ0LmxpbmVJdGVtcy5waHlzaWNhbEl0ZW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvZHVjdCBvZiBkYXRhLmNhcnQubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X2lkOiBwcm9kdWN0LnByb2R1Y3RJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3Rfc2t1OiBwcm9kdWN0LnNrdSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfbmFtZTogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9icmFuZDogcHJvZHVjdC5icmFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfcHJpY2U6IHByb2R1Y3Quc2FsZVByaWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9xdWFudGl0eTogcHJvZHVjdC5xdWFudGl0eVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYW5hbHl0aWNzRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tvdXRfaWQ6IGRhdGEuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yZGVyX2lkOiBkYXRhLm9yZGVySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkYXRhLmdyYW5kVG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldmVudWU6IGRhdGEuc3VidG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaXBwaW5nOiBkYXRhLnNoaXBwaW5nQ29zdFRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXg6IGRhdGEudGF4VG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdW50OiBkYXRhLmNhcnQuZGlzY291bnRBbW91bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBkYXRhLmNhcnQuY3VycmVuY3kuY29kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHM6IHByb2R1Y3RzLFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2spe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICAgICAgaWYgKG1haWxTZWxlY3RvciAmJiBtYWlsU2VsZWN0b3JbMF0pIHtcclxuICAgICAgICAgICAgICAgIHVzZXJFbWFpbCA9IG1haWxTZWxlY3RvclswXS5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgICAgICAvLyBhbmFseXRpY3NEYXRhLnVzZXJJZCA9IHVzZXJJZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgQmlnQ29tbWVyY2UgRXZlbnRzIE1hbmFnZXJcclxuICAgICovXHJcblxyXG4gICAgYWRkUHJvZHVjdEV2ZW50TGlzdGVuZXJzKCk7XHJcblxyXG4gICAgaWYgKHBhZ2VUeXBlID09PSAnY2F0ZWdvcnknKSB7XHJcbiAgICAgICAgb25DYXRlZ29yeVZpZXcoY2F0ZWdvcnlOYW1lKTtcclxuICAgIH0gZWxzZSBpZiAocGFnZVR5cGUgPT09ICdwcm9kdWN0Jykge1xyXG4gICAgICAgIG9uUHJvZHVjdERldGFpbHNWaWV3KCk7XHJcbiAgICB9IGVsc2UgaWYgKHBhZ2VUeXBlID09PSAnY2hlY2tvdXQnKSB7XHJcbiAgICAgICAgZ2V0Q2hlY2tvdXREYXRhKG9uQ2hlY2tvdXRTdGFydGVkKTtcclxuICAgIH0gZWxzZSBpZiAocGFnZVR5cGUgPT09ICdvcmRlcmNvbmZpcm1hdGlvbicpIHtcclxuICAgICAgICBnZXRQdXJjaGFzZURhdGEob25QdXJjaGFzZSk7XHJcbiAgICB9IGVsc2UgaWYgKHBhZ2VUeXBlID09PSAnY2FydCcpIHtcclxuICAgICAgICBvblZpZXdDYXJ0KCk7XHJcbiAgICB9XHJcbn0iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=