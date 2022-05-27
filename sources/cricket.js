const axios = require('axios');
// const { List } = require('whatsapp-web.js');

let apiKey = "6faaf9cf-7ac4-4bcd-b877-26a55cc2cabd"

async function getResponse(){
    const promise = axios.get(`https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`)

    const newPromise = promise.then((response) => response.data);
    return newPromise;
}

async function start(){
    let matches = await getResponse();
    matches = matches.data;
       
    let matchNames = []
    for(let i =0;i<matches.length;i++){
        matchNames.push({ title : matches[i].name});
    }
    const finalData = {matches, matchNames};
    // console.log(finalData);
    
    return finalData;
}


// console.log(start())


module.exports = start;