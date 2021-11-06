# BigCommerce GA4 Ecommerce dataLayer

A dataLayer implementation for BigCommerce, based upon the [Google Analytics 4 Ecommerce specification](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce).

Brought to you by [Fueled Inc](https://fueled.io).

## Overview

dataLayers provide a uniformed way for tracking and attribution scripts, such as Segment's Analatics.js library, to interact with your BigCommerce site. Implementing a dataLayer will ensure that all scripts use consistent attribution values and calculations. They can also cut down on custom code. Finally, they are exposed to Google Tag Manager, if you choose to implement tracking via GTM.

This dataLayer project implements Google's _"Google Analytics v4 Ecommerce Event Specification"_, as described in the following docs:

* https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
* https://developers.google.com/tag-manager/ecommerce-ga4

## Installation

This project is installed via [BigCommerce's Script Manager](https://support.bigcommerce.com/s/article/Using-Script-Manager). The script should be loaded on all pages. _(More detailed installation instructions coming soon.)_

## Build

To build and bundle the dataLayer from source, run:

`npm install`

and then

`npm run build`

## Ecommerce Events Tracked via the dataLayer

* [Product/Item List Views/Impressions](https://developers.google.com/tag-manager/ecommerce-ga4#measure_productitem_list_viewsimpressions)
* [Product/Item List Clicks](https://developers.google.com/tag-manager/ecommerce-ga4#measure_productitem_list_clicks)
* [Product/Item Detail Views](https://developers.google.com/tag-manager/ecommerce-ga4#measure_viewsimpressions_of_productitem_details)
* [Adds/Removes from Cart](https://developers.google.com/tag-manager/ecommerce-ga4#measure_additions_or_removals_from_a_shopping_cart)
* [View Cart](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#view_cart)
* Checkout Events exposed to the dataLayer
  * The [begin_checkout](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#begin_checkout) event fires when the /checkout page loads
  * The [add_payment_info](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#add_payment_info) fires when billing info is added during checkout
* [Purchases](https://developers.google.com/tag-manager/ecommerce-ga4#measure_purchases)

_Additional script variable definitions coming soon._

## Customization

This script has been designed to work with HTML elements generated by BigCommerce's default theme, Cornerstone. It can be extended to work with custom themes, as well as legacy Blueprint themes, to track additional client interactions. _(More on this soon.)_

## Need Support?

As an open source project, this solution is provided _as is_, without warranty or a commitment to customer support. That said, we are committed to the BigCommerce community and will do our best to answer questions and help you leverage this dataLayer. If you have questions, please feel free to email hello@fueled.io.

## Licensing

This is an open source project, licensed under the [GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html).
