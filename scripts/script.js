//easy object to hold json pointer
class JSONHolder {
    _products;
    _currencies;

    get products(){
        return this._products;
    }

    get currencies(){
        return this._currencies;
    }

    set products(pointer){
        this._products = pointer;
    }

    set currencies(pointer){
        this._currencies = pointer;
    }
}

//Waits for API calls, then loads tiles into view
async function loadTiles(){
    //get api calls
    apis.products = await loadAPI("https://fakestoreapi.com/products");
    apis.currencies = await loadAPI("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies.json");

    console.log(apis.products);
    console.log(apis.currencies);

    for (item in apis.products){
        $("#wall").append(` \
        <div class=\"card col w\" style=\"width: 18rem;\"> \
            <img src=\"${apis.products[item].image}\" class=\"card-img-top\" alt=\"...\"> \
            <div class=\"card-body\"> \
                <h5 class=\"card-title\">${apis.products[item].title}</h5> \
                <p class=\"card-text\">${apis.products[item].description}</p> \
                <a href=\"#\" class=\"btn btn-primary\">Add to Cart</a> \
            </div> \
        </div>`);
    }
    
}

//, returns that jsondata
// function loadAPI(){
//     let xhttpProducts = new XMLHttpRequest();
//     xhttpProducts.onreadystatechange = function (){
//         if(this.readyState == 4 && this.status == 200){
//             apis.products = JSON.parse(this.responseText);
//         }
        
//     };
//     xhttpProducts.open("GET", "https://fakestoreapi.com/products", true);
//     xhttpProducts.send();

//     let xhttpCurrencies = new XMLHttpRequest();
//     xhttpCurrencies.onreadystatechange = function (){
//         if(this.readyState == 4 && this.status == 200){
//             apis.currencies = JSON.parse(this.responseText);
//         }
        
//     };
//     xhttpCurrencies.open("GET", "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies.json", true);
//     xhttpCurrencies.send();

//     console.log(apis.products);
//     console.log(apis.currencies);
// }

async function loadAPI(url){
    let response = await fetch(url);
    return await response.json();
}

/*****  LINEAR CODE STARTS HERE *****/

//Create objects needed for API calls
let apis = new JSONHolder();

//Create shopping cart items
let cart = [];

//When document is finished loading, do these things:
$(document).ready(function (){
    loadTiles();
});