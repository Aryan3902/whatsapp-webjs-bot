const axios = require('axios');
const qrcode = require('qrcode-terminal');
const cricket = require('./sources/cricket');
const trendingAnime = require('./sources/animeList');
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
	}).catch(err => console.log(err));
	
});

client.on('message', async (message) => {
	let chat = await message.getChat();
    
	if(message.body === '!ping') {	
		message.reply('pong');
	}
	else if(message.body.toLowerCase().startsWith("anime ") && (!chat.isGroup || allowedGrps.includes(chat.id.user))) {
		console.log(message.body);
		let anime = message.body;
		
		anime=anime.split("anime ")[1];
		let animeDetails = await getAnime(anime);
		sendAnime(anime, client, message);
		console.log(animeDetails);
	}
	else if(message.body === '!score' && (!chat.isGroup || allowedGrps.includes(chat.id.user))){
		
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
	else if (message.body === ".everyone" && chat.isGroup) {
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
})



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

var http = require('http'); //importing http

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