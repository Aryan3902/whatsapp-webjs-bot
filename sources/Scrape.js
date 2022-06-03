const puppeteer = require('puppeteer');

async function scrapeProduct(item){
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    // scrapeProcess(await getAmazon(page, item));
    // scrapeProcess(await getFlipkart(page,item));
    let dataArr = [];
    let response = await getFlipkart(page,item);
    for (let i = 0; i < response[0].length; i++) {
        let Nametext = await response[0][i].getProperty('textContent');
        let Pricetext = await response[1][i].getProperty('textContent');
        let Linktext = await response[2][i].getProperty('href');
        let Name = await Nametext.jsonValue();
        let Price = await Pricetext.jsonValue();
        let Link = await Linktext.jsonValue();
        Link = Link.split("?pid")[0];
        dataArr.push({Name, Price, Link});
        
    }
    // console.log(dataArr);
    
    // const [result2] = await page.$x(`//*[@id="search"]/div[1]/div[1]/div/span[3]/div[2]/div[${i-1}]/div/div/div/div/div/div[2]/div/div/div[3]/div[1]/div/div[1]/div/a/span[1]/span[2]/span[2]`)
    await browser.close();
    return dataArr;
}

async function scrapeProcess(result){
    
    const text = await result[0].getProperty('textContent');
    const src = await text.jsonValue();
    console.log(src);
}

async function getFlipkart(page,item){
    const url = "https://www.flipkart.com/search?q=" + item;
    await page.goto(url);
    const nameClass = 'div._4rR01T';
    const priceClass = 'div._30jeq3._1_WHN1';               
    const linkClass = '._1fQZEK';
    const nameResult = await page.$$(nameClass);
    const priceResult = await page.$$(priceClass);
    const linkResult = await page.$$(linkClass);
    const result = [nameResult, priceResult,linkResult];
    return result;
}

async function getAmazon(page, item){
    const url = "https://www.amazon.in/s?k=" + item;
    await page.goto(url);
    let i = 4;
    let result = [];
    while (result.length === 0) {  
        let XPath = `//*[@id="search"]/div[1]/div[1]/div/span[3]/div[2]/div[${i}]/div/div/div/div/div/div[2]/div/div/div[1]/h2/a/span`;
        result = await page.$x(XPath);
        i++;
        
        if(i === 10){
            break;
        } 
    }
    return result;
}


// const item = "Asus+laptop";

// const data = await scrapeProduct(item);

// console.log(data);

module.exports = scrapeProduct;