const axios = require('axios');

async function getResponse(item){
    const url = "https://flipkart.dvishal485.workers.dev/search/" + item;
    const promise = axios.get(url)
    const newPromise = promise.then((response) => response.data);
    return newPromise;
}

async function start(item){
    let products = await getResponse(item);
    products = products.result;
       
    // console.log(finalData);
    return products;
}

// const response =start("samsung");
// console.log(response);
module.exports = start;