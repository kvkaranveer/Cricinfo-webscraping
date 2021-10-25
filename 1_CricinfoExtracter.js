// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib
// node 1_CricinfoExtracter.js --excel=Worldcup.csv --dataDir=worldcup --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel4node = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");


// convert matches to teams
// save teams to excel using excel4node
// create folders and save pdf using pdf-lib

let args = minimist(process.argv);

// browser => url to html (url se http request -> server ne html in http response)
let responseKaPromise = axios.get(args.source);
responseKaPromise.then(function(response){
    let html = response.data;
    
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;
    let matchScoreDivs = document.querySelectorAll("div.match-score-block");
    let matches = [];

    for(let i = 0; i < matchScoreDivs.length; i++){
        let match = {
            t1: "",
            t2: "",
            t1s: "",
            t2s: "",
            result: ""
        };

        let teamParas = matchScoreDivs[i].querySelectorAll("div.name-detail > p.name");
        match.t1 = teamParas[0].textContent;
        match.t2 = teamParas[1].textContent;

        let scoreSpans = matchScoreDivs[i].querySelectorAll("div.score-detail > span.score");
        if(scoreSpans.length == 2){
            match.t1s = scoreSpans[0].textContent;
            match.t2s = scoreSpans[1].textContent;
        } else if(scoreSpans.length == 1){
            match.t1s = scoreSpans[0].textContent;
            match.t2s = "";
        } else {
            match.t1s = "";
            match.t2s = "";
        }

        let resultSpan = matchScoreDivs[i].querySelector("div.status-text > span");
        match.result = resultSpan.textContent;

        matches.push(match);
    }

    let matchesKaJSON = JSON.stringify(matches);
    fs.writeFileSync("matches.json", matchesKaJSON, "utf-8");

    let teams = []
    for(let i = 0; i < matches.length; i++){
        addTeamToTeamsArrayIfNotAlreadyThere(teams, matches[i].t1);
        addTeamToTeamsArrayIfNotAlreadyThere(teams, matches[i].t2);
    }

    for(let i = 0; i < matches.length; i++){
        addMatchToSpecificTeam(teams, matches[i].t1, matches[i].t2, matches[i].t1s, matches[i].t2s, matches[i].result);
        addMatchToSpecificTeam(teams, matches[i].t2, matches[i].t1, matches[i].t2s, matches[i].t1s, matches[i].result);
    }

    let teamsKaJSON = JSON.stringify(teams);
    fs.writeFileSync("teams.json", teamsKaJSON, "utf-8");
})

function addMatchToSpecificTeam(teams, homeTeam, oppTeam, selfScore, oppScore, result){
    let tidx = -1;
    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == homeTeam){
            tidx = i;
            break;
        }
    }

    let team = teams[tidx];
    team.matches.push({
        vs: oppTeam,
        selfScore: selfScore,
        oppScore: oppScore,
        result: result
    })
}

function addTeamToTeamsArrayIfNotAlreadyThere(teams, teamName){
    let tidx = -1;
    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == teamName){
            tidx = i;
            break;
        }
    }

    if(tidx == -1){
        teams.push({
            name: teamName,
            matches: []
        })
    }
}
