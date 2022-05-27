const axios = require('axios');

function getAnime(anime){
    axios.post(
        'https://kitsu.io/api/graphql',
        {
            'query': '# Write your query or mutation here\nquery searchtitle {\n  searchAnimeByTitle(first:20, title: '+'"'+ anime +'"'+') {\n    nodes{\n      titles{\n        preferred,\n      },\n      episodeCount,\n      bannerImage{\n        original{\n          url\n        }\n      },\n      startDate,\n      endDate\n    }\n  }\n}'
        },
        {
            headers: {
                'Accept-Encoding': 'UTF-8',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Connection': 'keep-alive',
                'DNT': '1',
                'Origin': 'https://kitsu.io'
            }
        }
    ).then((response) => {
        dataArray = response.data.data.searchAnimeByTitle.nodes;
        const finalArray = dataArray.filter(episode=> episode.episodeCount > 7);
        console.log(finalArray);
      }, (error) => {
        console.log(error);
      });
}





getAnime("attack on titan");