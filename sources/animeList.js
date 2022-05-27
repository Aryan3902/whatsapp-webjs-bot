const axios = require('axios');
// const { List } = require('whatsapp-web.js');

let TOKEN = "8a68c5398bf0ea96f938a649840ad705"

async function getResponse(){
    // const promise = axios.get(`https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`)
    const promise = axios.get('https://api.myanimelist.net/v2/anime/ranking', {
        params: {
            'ranking_type': 'airing',
            'limit': '5'
        },
        headers: {
            'X-MAL-CLIENT-ID': TOKEN
        }
    });
    const newPromise = promise.then((response) => response.data);
    return newPromise;
}

async function start(){
    let trendingAnime = await getResponse();
    // console.log(trendingAnime);
    
    trendingAnime = trendingAnime.data;
    let animeNames = []
    for(let i =0;i<trendingAnime.length;i++){
       animeNames.push({ title : trendingAnime[i].node.title});
    }
    // console.log(trendingAnime);
    return animeNames;
}


module.exports = start;


