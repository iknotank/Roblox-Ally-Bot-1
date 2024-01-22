//-----------------------MODULES-----------------------//
import axios from "axios";
import chalk from "chalk";
import readline from "node:readline/promises";
import fs from "node:fs";

//-----------------------DEFINE-----------------------//
const log = console.log
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

//-----------------------CONFIGURATIONS-----------------------//

//Load data from data.json
const data = fs.readFileSync("data.json")
const json = JSON.parse(data)

var cookie = json.cookie //cookie format : [.ROBLOSECURITY, .RBXIDCHECK, RBXEventTrackerV2"]
var group = json.group
var range = json.range
var useProxy = json.proxy
var sendMsg = json.msg


//-----------------------FUNCTIONS-----------------------//


/*
    readProxy() : read proxy.txt and return array of proxies
    ask() : user input and store to data.json
    request() : send request to roblox api
    getCSRF() : get csrf token for request
    sendMessage() : send message to group owner

    Fix the Proxy, it is mess as of now[not recommend to use proxy]

    wanna host 24/7 on a hosting server for free [run even while your pc is off or you are offline without using any of your pc resources]? contact me in discord for more info
*/

const readProxy = async () => {
    const data = fs.readFileSync("proxy.txt")
    const proxies = data.toString().split("\n")
    if (proxies.length == 0) log(chalk.red.bold("[ERROR] : Proxy.txt is empty")) && process.exit()
    return proxies
}

const ask = async () => {
    console.log(chalk.magentaBright.bold("[LOGGER] : Right Click inside this window to paste"))
    //remove previous cookie
    cookie = []
    cookie.push(await rl.question(chalk.redBright.bold("[INPUT] .ROBLOSECURITY : ")))
    cookie.push(await rl.question(chalk.redBright.bold("[INPUT] .RBXIDCHECK[Press enter if doesn't exits] : ")))
    cookie.push(await rl.question(chalk.redBright.bold("[INPUT] RBXEventTrackerV2 : ")))
    group = await rl.question(chalk.redBright.bold("[INPUT] Group ID : "))
    log(chalk.blue.bold("[LOGGER] : A random group id will be picked within range [default: 8802477, 8802487]"))
    const random = await rl.question(chalk.redBright.bold("[INPUT] Use Deafult range ? [y/n] : "))
    if (random == "N" || random == "n") {
        log(chalk.blue.bold("[LOGGER] : Enter range"))
        range.min = parseInt(await rl.question(chalk.redBright.bold("[INPUT] Min[ex : 8802477, must be lower than max] : ")))
        range.max = parseInt(await rl.question(chalk.redBright.bold("[INPUT] Max[ex : 8802487 must be higher than min] : ")))
    }
    chalk.blue.bold("[LOGGER] : Make sure proxy supports HTTPS protocol")
    useProxy = await rl.question(chalk.redBright.bold("[INPUT] Use Proxy ? [y/n] : ")) == "y" ? true : false
    sendMsg = await rl.question(chalk.redBright.bold("[INPUT] Send Message ? [y/n] : ")) == "y" ? true : false

    //write to data.json
    fs.writeFileSync("data.json", JSON.stringify({
        cookie: cookie,
        group: group,
        range: range,
        proxy: useProxy,
        msg: sendMsg
    }))
    log(chalk.blue.bold("[LOGGER] : CONFIGURATION SAVED"))
}

// anyone cares about impure fn 🥱 ?
const request = async (api, csrf = "", data = {}) => {
    var proxy = {
        host: "",
        port: "",
        protocol: "http"
    }
    if (useProxy) {
        const proxies = await readProxy()
        const ranProxy = proxies[Math.floor(Math.random() * proxies.length)]
        const proxySplit = ranProxy.split(":")
        proxy.host = proxySplit[0], proxy.port = proxySplit[1]
    }
    return axios.post("https://" + api, "", {
        headers: {
            Cookie: ".ROBLOSECURITY=" + cookie[0] + "; .RBXIDCHECK=" + cookie[1] + "; RBXEventTrackerV2=" + cookie[2] + ";",
            'X-Csrf-Token': csrf,
            "Content-Type": "application/json"
        },
        data: JSON.stringify(data),

        proxy: useProxy && {
            host: proxy.host,
            port: proxy.port,
            protocol: "http"
        }
    })
}


const getCSRF = async () => {
    log(chalk.blue.bold("[LOGGER] : Getting CSRF Token"))
    return new Promise(resolve => {
        request("auth.roblox.com/v2/logout")
            .catch(res => {
                const csrf = res.response.headers['x-csrf-token']
                log(chalk.blue.bold("[LOGGER] : CSRF Token : " + csrf))
                resolve(csrf)
            })
    })
}

const sendMessage = async (id, csrf) => {
    log(chalk.blue.bold("[LOGGER] : Sending Message"))
    const raw = (await request("https://groups.roblox.com/v1/groups/" + id)).catch(() => {
        log(chalk.red.bold("[ERROR] : Group is invalid"))
        process.exit()
    }).data

    const format = {
        "subject": "Group Ally Request",
        "body": "yo i want to ally your group, please accept it :D \n also please join my group : https://www.roblox.com/groups/" + group + "/", //don't fix the grammar caz it will be humanable and legit like
        "recipientId": raw.owner.userId,
    }
    request("https://privatemessages.roblox.com/v1/messages/send", csrf, format)
        .then(() => {
            log(chalk.green.bold("[SUCCESS] : Message sent"))
            resolve(csrf)
        })
        .catch(() => {
            log(chalk.blue.bold("[LOGGER] : Message could not be sent, skipping..."))
            reject(csrf)
        })
}

//-----------------------MAIN FUNCTION-----------------------//

(async () => {
    console.clear()
    log(chalk.cyan.bold(`
    _____   .__   .__                  __________          __    
   /  _  \\  |  |  |  |  ___.__.        \\______   \\  ____ _/  |_  
  /  /_\\  \\ |  |  |  | <   |  |  ______ |    |  _/ /  _ \\\\   __\\ 
 /    |    \\|  |__|  |__\\___  | /_____/ |    |   \\(  <_> )|  |   
 \\____|__  /|____/|____// ____|         |______  / \\____/ |__|   
         \\/             \\/                     \\/                
`))
    log(chalk.blue.bold("\t\t\t\t\tDiscord :  _mrunknown_"))
    log(chalk.blue.bold("\t\t\t\t\tGithub :  @CodeCarbon\n\n"))

    const version = (await axios.get("https://raw.githubusercontent.com/CodeCarbon/Roblox-Ally-Bot/main/version")).data
    fs.readFileSync("version").toString() != version && log(chalk.yellowBright.bold("[WARNING] : New version available, update to the latest version"))
    if (cookie == "") {
        log(chalk.blue.bold("[LOGGER] : Cookie is empty"))
        await ask()
    } else {
        const answer = await rl.question(chalk.redBright.bold("[INPUT] Use Previous configuration ? [Y/N] : "))
        answer == "N" || answer == "n" ? await ask() : log(chalk.blue.bold("[LOGGER] : Using previous configuration"))
    }

    log(chalk.blue.bold("[LOGGER] : Starting..."))
    var csrf = await getCSRF()

    while (true) {
        const sentGroup = Math.floor(Math.random() * (range.max - range.min) + range.min)
        log(chalk.blue.bold("[LOGGER] : Sending request to : " + sentGroup))
        try {
            await request("groups.roblox.com/v1/groups/" + group + "/relationships/allies/" + sentGroup, csrf)
            log(chalk.green("[Success] :" + sentGroup))
            sendMsg && await sendMessage(sentGroup, csrf)
        } catch (err) {
            log(chalk.yellowBright("[DEBUGGER] : " + err))
            if (err.response.status == 429) {
                log(chalk.red("[Error] : Rate Limited (429)"))
                log(chalk.blue.bold("[LOGGER] : It is expected to be 5 requests per 5-10 minutes"))
                log(chalk.blue.bold("[LOGGER] : Waiting 5 minutes"))
                await new Promise(resolve => setTimeout(resolve, 500000))
            } else if (err.response.status == 403) {
                log(chalk.red("[Error] : Forbidden (403)"))
                log(chalk.magentaBright.bold("[LOGGER] : check if the bot is in the group and has permission to ally as well as the the cookie is valid"))
                log(chalk.magentaBright.bold("[LOGGER] : Exiting in 120 seconds"))
                setTimeout(process.exit, 120)
            }
            csrf = await getCSRF()
        }
    }
})();
