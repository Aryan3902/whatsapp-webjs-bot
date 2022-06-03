const axios = require('axios');
const qrcode = require('qrcode-terminal');
const cricket = require('./sources/cricket');
const trendingAnime = require('./sources/animeList');
const itemData = require('./sources/flipkart');
const movieList = require('./movie')
const express = require('express');


const { Client, LocalAuth, MessageMedia, List,Chat, Buttons, MessageTypes} = require('whatsapp-web.js');

const allowedGrps = ['919770066812-1627626919', '120363021118812220','919770066812-1604162668','120363024469115035']
const app = express();
app.get('/', (req, res) => {
 
    res.send('Hello World!')
    res.end()
})
 
const PORT = process.env.PORT ||5000;


const client = new Client({
    authStrategy: new LocalAuth(),
	puppeteer: { headless: true,
	args: ['--no-sandbox'] },
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
	
	console.log(message.body + " sent by " + message.from);;
	const promise = message.getQuotedMessage();
	const newPromise = promise.then((response) => {
		if(response.id.fromMe && response.body === "Tap here to get the list of live matches-"){
			matchDetails(message.body, client, message);				
		}
		if(response.id.fromMe && (response.body === "Trending Anime of the week:" || response.body === "Try these trending animes:")){
			sendAnime(message.body, client, message);
		}
        if(response.id.fromMe && (response.body === "Tap here to get the list of products-")){
            let itemMessage = message.body
            itemMessage = itemMessage.split('Link: ')[1];
			getItem(itemMessage, client, message);
		}
	}).catch(err => console.log());
	
});

client.on('message', async (message) => {
	let chat = await message.getChat();
    
	if(message.body === '!ping') {	
		message.reply('pong');
	}
	else if(message.body.toLowerCase().startsWith("anime ") && allowedGrps.includes(chat.id)) {
		console.log(message.body);
		let anime = message.body;
		
		anime=anime.split("anime ")[1];
		let animeDetails = await getAnime(anime);
		sendAnime(anime, client, message);
		console.log(animeDetails);
	}
	else if(message.body === '!score' && (!chat.isGroup || allowedGrps.includes(chat.id))){
		
		let liveMatches = await cricket();
		let rows = liveMatches.matchNames;
		let sections = [
			{
			  title: "Current Live Matches: ",
			  rows
			},
		];
		
		let list = new List("Tap here to get the list of live matches-", "Live Matches", sections, "Live Score", "footer");
		console.log(list.sections[0].rows);
		client.sendMessage(message.from, list);
	}
	else if (message.body === ".everyone" ) {
		const chat = await message.getChat();
	
		let text = "";
		let mentions = [];
	
		for (let participant of chat.participants) {
		  const contact = await client.getContactById(participant.id._serialized);
	
		  mentions.push(contact);
		  text += `@${participant.id.user} `;
		}
	
		await chat.sendMessage(text, { mentions });
	}
    else if (message.body.toLowerCase().startsWith("!shop ")  && (!chat.isGroup || allowedGrps.includes(chat.id))) {
        let shop = message.body.split("!shop ")[1];
        let item = shop.split(" ")[0];
        let shopDetails = await itemData(item);
        let rows = [];
        for(let i =0;i<shopDetails.length;i++){
            rows.push({ title : shopDetails[i].name,
            description : '₹' + shopDetails[i].current_price + '\nLink: ' + shopDetails[i].link,});
        }
        let sections = [
			{
			  title: "Current Products: ",
			  rows
			},
		];
		let Listtitle = item.charAt(0).toUpperCase() + item.slice(1);
        if(Listtitle[Listtitle.length-1] !== 's'){
            Listtitle = Listtitle + 's';
        }
		let list = new List("Tap here to get the list of products-", "Products", sections, Listtitle, "footer");
        // sendShop(shopDetails, client, message);
        // console.log(shopDetails);
        client.sendMessage(message.from, list);
    }
    else if(message.body.toLowerCase() === "useless fact"){
        axios.get("https://uselessfacts.jsph.pl/random.json?language=en").then(res => {
            message.reply(res.data.text);
        });

    }
    else if(message.body.toLowerCase().startsWith("!movie") && (!chat.isGroup || allowedGrps.includes(chat.id))){
        let movieDetails = message.body.split("!movie ");
        let messageLength = movieDetails.length;
        // console.log(messageLength);
        if(message.body === "!movie"){
            message.reply("!movie <name> will give the details of the movie\n!movie random will give you a random movie\n!movie random <genre> will give you a random movie of that genre\n!movie random <year> will give you a random movie of that genre from that year to present");
        }
        else if(messageLength >= 1){
            if(movieDetails[1] === "random" && messageLength === 2){
                
                let movie = movieList.results[Math.floor(Math.random() * movieList.results.length)];
                const media =  await MessageMedia.fromUrl(movie.image);
                let res = movie;
                caption = `*${res.title} ${res.description}*\nRuntime: ${res.runtimeStr}\nGenre: ${res.genres}\nIMDB Rating: ${res.imDbRating}`;
                await client.sendMessage(message.from,media,{caption : caption});   
            }
            else{
                axios.get("https://www.omdbapi.com/?apikey=b005110c&t="+ movieDetails[1] +"&type=movie&r=json").then(async (res) => {
                    res = res.data;
                    const caption = `*${res.Title} (${res.Year})*\nRuntime: ${res.Runtime}\nGenre: ${res.Genre}\nIMDB Rating: ${res.imdbRating}`;
                    // console.log(res.Poster);
                    const media = await MessageMedia.fromUrl(res.Poster);
                    await client.sendMessage(message.from,media,{caption : caption});
                })
                .catch(err => console.log(err));
            }
        }
            // else if(movieDetails[2] === "random" && (movieDetails[3] !== undefined && parseInt(movieDetails[3]) !== NaN)){
            //     let year = movieDetails[3];
            //     url = "https://api.themoviedb.org/3/discover/movie?api_key=844b38f039c30a8efee3ed08226875b8&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&primary_release_year=" + year;
            //     axios.get(url).then(res => {
            //         let movie = res.data.results[Math.floor(Math.random() * res.data.results.length)];
            //         let movieName = movie.title;
            //         let movieId = movie.id;
            //         let movieUrl = "https://api.themoviedb.org/3/movie/" + movieId + "?api_key=844b38f039c30a8efee3ed08226875b8&language=en-US";
            //         axios.get(movieUrl).then(res => {
            //             let movieDetails = res.data;
            //             let movieOverview = movieDetails.overview;
            //             let movieGenre = movieDetails.genres[0].name;
            //             let movieReleaseDate = movieDetails.release_date;
            //             let movieRating = movieDetails.vote_average;
            //             let moviePoster = "https://image.tmdb.org/t/p/w500" + movieDetails.poster_path;
            //             let movieMessage = new Message(`${movieName} is a ${movieGenre} movie released in ${movieReleaseDate} with a rating of ${movieRating}/10\n${movieOverview}`);
            //             message.reply(movieMessage);
            //             let movieImage = new Image(moviePoster);
            //             message.reply(movieImage);
            //         });
            //     });
            // }
            // else if(movieDetails[2] !== "random" && (movieDetails[3] !== undefined && parseInt(movieDetails[3]) === NaN) ){
            //     let genre = movieDetails[2];
            //     url = "https://api.themoviedb.org/3/discover/movie?api_key=844b38f039c30a8efee3ed08226875b8&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_genres=" + genre;
            //     axios.get(url).then(res => {
            //         let movie = res.data.results[Math.floor(Math.random() * res.data.results.length)];
            //         let movieName = movie.title;
            //         let movieId = movie.id;
            //         let movieUrl = "https://api.themoviedb.org/3/movie/" + movieId + "?api_key=844b38f039c30a8efee3ed08226875b8&language=en-US";
            //         axios.get(movieUrl).then(res => {
            //             let movieDetails = res.data;
            //             let movieOverview = movieDetails.overview;
            //             let movieGenre = movieDetails.genres[0].name;
            //             let movieReleaseDate = movieDetails.release_date;
            //             let movieRating = movieDetails.vote_average;
            //             let moviePoster = "https://image.tmdb.org/t/p/w500" + movieDetails.poster_path;
            //             let movieMessage = new Message(`${movieName} is a ${movieGenre} movie released in ${movieReleaseDate} with a rating of ${movieRating}/10\n${movieOverview}`);
            //             let movieImage = new Image(moviePoster);
            //             message.reply(movieMessage);
                        
            //             message.reply(movieImage);
            //         });
            //     });
            // }
            
                
        }
        
    }
    
    
)



client.initialize();

function getAnime(anime){
	
    const promise=axios.post(
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
    )
	const newPromise = promise.then((response) => response.data);
	return newPromise;
}

function animeMessage(data){
	finalArray = data.data.searchAnimeByTitle.nodes.filter(episode=> episode.episodeCount > 7);
	let message = [];
	for(let i = 0; i < finalArray.length; i++){
		let anime = {};
		try {
			anime.BannerImage = finalArray[i].bannerImage.original.url;
		} catch (error) {
			continue;
		}	
		anime.Title =  `*${finalArray[i].titles.preferred}*`;
		anime.Episodes = `Episodes: ${finalArray[i].episodeCount}`;
		anime.StartDate = `Start Date: ${finalArray[i].startDate}`;
		anime.EndDate = `End Date: ${finalArray[i].endDate}`;
		streamTitle = finalArray[i].titles.preferred.replace(/ /g, '+');
		anime.link = 'Watch now: https://zoro.to/search?keyword=' + streamTitle;
		message.push(anime);
	}
	console.log(message);
	return message;
}

async function matchDetails(givenMatch,client,message){
	let liveMatches = await cricket();
	let rows = liveMatches.matches;
	let matchReq = rows.filter(match=> match.name === givenMatch);
	let Score = matchReq[0].score;
	matchStats = `${matchReq[0].name} \n*${matchReq[0].matchType.toUpperCase()} Match* \nVenue: ${matchReq[0].venue}\n${matchReq[0].status}\n*Score:*\n${Score[Score.length - 1].inning}\n${Score[Score.length - 1].r}/${Score[Score.length - 1].w} (${Score[Score.length-1].o})`;
	client.sendMessage(message.from, matchStats )
}

async function sendAnime(anime, client, message){
	let animeDetails = await getAnime(anime);
	if (animeDetails.data.searchAnimeByTitle.nodes.length === 0) {
		client.sendMessage(message.from, "Anime Not Found");
		let rows = await trendingAnime();
		console.log(rows);
		let sections = [
			{
			  title: "Top Airing Anime",
			  rows
			},
		];
		let list = new List("Try these trending animes:", "Trending Anime", sections, "Top Airing", "footer");
		client.sendMessage(message.from, list);
		
	} else {
		let FinalMessage = animeMessage(animeDetails);
		for (let i = 0; i < FinalMessage.length; i++) {
			const element = FinalMessage[i];
			let media =  "Image Not Found" ;
			if (element.BannerImage === "Not Found") {
				media =  "Image Not Found" ;
			} else {
				media = await MessageMedia.fromUrl(element.BannerImage);
			}	
			// await client.sendMessage(message.from, media);
			caption = `${element.Title}\n${element.Episodes}\n${element.StartDate}\n${element.EndDate}\n${element.link}`;	
			await client.sendMessage(message.from,media,{caption : caption});
		}
		let rows = await trendingAnime();
		let sections = [
			{
			  title: "Top Airing Anime",
			  rows
			},
		];
		let list = new List("Trending Anime of the week:", "Trending Anime", sections, "Top Airing", "footer");
		client.sendMessage(message.from, list);
	}
}

async function getItem(item, client, message){
    item = item.split(".com/")[1];
    
    const url = "https://flipkart.dvishal485.workers.dev/product/min/dl/" + item;
    axios
      .get(url)
      .then(async (response) => {
            response = response.data;
           
            let caption = `*${response.name}*\n~${response.original_price}~ ${response.current_price}\n${response.rating} ★\n${response.share_url}`;
            if (response.in_stock) {
                caption+=  "\nIn Stock";
            }
            else {
                caption+= "\nOut of Stock";
            }
            console.log(caption);
            let media;
            if(response.thumbnails.length ===0){
                media = "Image Not Found";
                await client.sendMessage(message.from,caption);
            }
            else{
                try {
                    media = await MessageMedia.fromUrl(response.thumbnails[0].split("?q=")[0]);
                    await client.sendMessage(message.from,media,{caption : caption});
                } catch (error) {
                    await client.sendMessage(message.from,caption);
                }
            }
            
            
      })
      .catch((error) => {
        console.log(error);
      });
    // let itemDetails = await itemData(item);
    // const messageBody = `${itemDetails[0].Name}\n${itemDetails[0].Price}\n${itemDetails[0].Link}`;
    // client.sendMessage(message.from, messageBody);
}

var http = require('http'); //importing http
const res = require('express/lib/response');
const { group } = require('console');

function startKeepAlive() {
    setInterval(function() {
        var options = {
            host: 'whatsapp-webjs-bot.herokuapp.com',
            port: 80,
            path: '/'
        };
        http.get(options, function(res) {
            res.on('data', function(chunk) {
                try {
                    // optional logging... disable after it's working
                    console.log("HEROKU RESPONSE: " + chunk);
                } catch (err) {
                    console.log(err.message);
                }
            });
        }).on('error', function(err) {
            console.log("Error: " + err.message);
        });
    }, 20 * 60 * 1000); // load every 20 minutes
}

startKeepAlive();

app.listen(PORT, console.log(
	`Server started on port ${PORT}`));