//-----------------------MODULES-----------------------//

//-----EXTERNAL MODULES------//
import axios from "axios";
import chalk from "chalk";

//------BUILD-IN MODULES------//
import readline from "node:readline/promises";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

//-----------------------DEFINE-----------------------//


const log = console.log
const __filename = fileURLToPath(import.meta.url); //__filename and __dirname are not available in es6 modules
const __dirname = path.dirname(__filename);
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
var webhook = json.webhook
var range = json.range
var sendMsg = json.msg
//var useProxy = json.useProxy
var proxyType = 0 // 0 for no-proxy 1 for roproxy 2 for proxies from proxy.txt
const proxies = fs.readFileSync("proxy.txt").toString().split("\n")
var proxyLength = 0
///not really usefull but did it anyway
var cookies = []
var cookieLength = 0
var useMultiCookie = "N"
//-----------------------FUNCTIONS-----------------------//


/*
    ask() : user input and store to data.json
    request() : send request to roblox
    getCSRF() : get csrf token for request
    sendMessage() : send message to group owner
    getGroup() : get a random group id within range
    sendAlly() : send ally request to group
    main() : main function
    update() : update the bot to the latest version from github
    sleep() : sleep for a given time
    getProxy() : get proxy from proxy.txt
    weblog() : send message to webhook
*/

const getProxy = async () => {
    if (proxyLength > proxies.length) {
        weblog("PROXY", " No more proxies available, Reading proxies from start")
        log(chalk.blue.bold("[LOGGER] : It is expected to be 5 requests per 5-10 minutes"))
        log(chalk.blue.bold("[LOGGER] : Waiting 3 minutes"))
        await sleep(300000)
        proxyLength = 0
    }
    return proxies[proxyLength];
}

const weblog = (title, description) => {
    // removed await
    if (webhook != "") axios.post(webhook, {
        avatar_url: "https://cdn.discordapp.com/avatars/715220624154558554/711c4bd66b0c300e6e31837c77879e8b.png?size=1024",
        embeds: [
            {
                title: title,
                description: description,
                author: {
                    name: "Roblox Ally Bot",
                    url: "https://github.com/CodeCarbon/Roblox-Ally-Bot" //base group
                },
                footer: {
                    text: "Join our group, https://www.roblox.com/groups/6290210",
                    iconUrl: "https://tr.rbxcdn.com/4776872309e68ede849031a22777cf2a/150/150/Image/Png"
                },
            }
        ],
    });
}


const sleep = async ms => {
    log(chalk.blue.bold("[LOGGER] : Waiting " + Math.floor(ms / 1000) + " seconds"));
    weblog("Delay", `Waiting ${Math.floor(ms / 1000)} seconds`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

const update = async () => {
    return new Promise(async resolve => {
        log(chalk.blue.bold("[LOGGER] : New version available, updating to the latest version"))
        weblog("UPDATE", "New version available, updating to the latest version");
        log(chalk.redBright.bold("[LOGGER] : Updating"))
        weblog("UPDATE", "Updating")

        const indexjs = (await axios('http://raw.githubusercontent.com/CodeCarbon/Roblox-Ally-Bot/main/index.js')).data
        fs.writeFileSync(__dirname + '/index.js', indexjs.toString(), 'utf8');

        const datajson = JSON.stringify((await axios('http://raw.githubusercontent.com/CodeCarbon/Roblox-Ally-Bot/main/data.json')).data)
        fs.writeFileSync(__dirname + '/data.json', datajson, 'utf8');

        const packagejson = JSON.stringify((await axios('http://raw.githubusercontent.com/CodeCarbon/Roblox-Ally-Bot/main/package.json')).data)
        fs.writeFileSync(__dirname + '/package.json', packagejson.toString(), 'utf8');

        const version = (await axios('http://raw.githubusercontent.com/CodeCarbon/Roblox-Ally-Bot/main/version')).data
        fs.writeFileSync(__dirname + '/version', version.toString(), 'utf8');
        log(chalk.green.bold("[LOGGER] : Updated"))
        weblog("UPDATE", "Updated")
        resolve(process.exit())
    })
}

const ask = async () => {
    log(chalk.magentaBright.bold("[LOGGER] : Right Click inside this window to paste"))
    //remove previous cookie
    cookie = []
    cookie.push(await rl.question(chalk.redBright.bold("[INPUT] .ROBLOSECURITY : ")))
    cookie.push(await rl.question(chalk.redBright.bold("[INPUT] RBXEventTrackerV2 : ")))
    cookie.push(await rl.question(chalk.redBright.bold("[INPUT] .RBXIDCHECK[Press enter if doesn't exits] : ")))
    group = await rl.question(chalk.redBright.bold("[INPUT] Group ID : "))
    log(chalk.magenta.bold("[LOGGER] : Recommend only when host this bot"))
    webhook = await rl.question(chalk.redBright.bold("[INPUT] Webhook [Press enter to leave empty] : "))
    if (webhook != "") {
        log(chalk.blue.bold("[LOGGER] : Webhook is set to " + webhook))
        log(chalk.magenta.bold("[LOGGER] : Message will be sent to webhook after each ally request from base group"))
    }
    log(chalk.blue.bold("[LOGGER] : A random group id will be picked within range [default: 8802477, 8802487]"))
    const random = await rl.question(chalk.redBright.bold("[INPUT] Use Deafult range ? [y/n] : "))
    if (random == "N" || random == "n") {
        log(chalk.blue.bold("[LOGGER] : Enter range"))
        range.min = parseInt(await rl.question(chalk.redBright.bold("[INPUT] Min[ex : 8802477, must be lower than max] : ")))
        range.max = parseInt(await rl.question(chalk.redBright.bold("[INPUT] Max[ex : 8802487 must be higher than min] : ")))
    }
    log(chalk.blue.bold("[LOGGER] : Message will be sent to group owner [not recommend to use this, most likely the message is turned off]"))
    sendMsg = await rl.question(chalk.redBright.bold("[INPUT] Send Message ? [y/n] : ")) == "y" ? true : false
    log(chalk.blue.bold("[LOGGER] : Using proxy will be slower but more stable"))
    //write to data.json
    fs.writeFileSync("data.json", JSON.stringify({
        cookie: cookie,
        group: group,
        webhook: webhook,
        range: range,
        msg: sendMsg
    }))
    log(chalk.blue.bold("[LOGGER] : CONFIGURATION SAVED"))
}

// anyone cares about impure fn 🥱 ?
const request = async (api, csrf = "", data = {}, method = "POST", useCookie = true) => {
    var proxy = {
        host: "",
        port: "",
        protocol: "https"
    }
    if (proxyType == 2) {
        const proxySplit = (await getProxy()).split(":")
        proxy.host = proxySplit[0], proxy.port = proxySplit[1]
    }
    return axios("https://" + api, {
        method: method,
        headers: {
            //to prevent auto log out while using with cloud
            Cookie: useCookie ? ".ROBLOSECURITY=" + cookie[0] + "; RBXEventTrackerV2=" + cookie[1] + "; .RBXIDCHECK=" + cookie[2] : "",
            'X-Csrf-Token': csrf,
            "Content-Type": "application/json"
        },
        data: data,
        proxy: proxyType == 2 ? {
            host: proxy.host,
            port: proxy.port,
            protocol: "https"
        } : undefined
    })
}

const getCSRF = async () => {
    log(chalk.blue.bold("[LOGGER] : Getting CSRF Token"))
    weblog("CSRF", "Getting CSRF Token")
    return new Promise(resolve => {
        request("auth." + (proxyType == 1 ? "roproxy" : "roblox") + ".com/v2/logout")
            .catch(async res => {
                var csrf = res.response?.headers?.['x-csrf-token']
                if (!csrf) {
                    log(chalk.red.bold("[ERROR] : Invalid cookie"))
                    if (cookies.length > 0) {
                        log(chalk.magentaBright.bold("[LOGGER] : Trying next cookie"));
                        cookie = cookies[cookieLength++]
                        csrf = await getCSRF();
                    }
                    process.exit()
                }
                log(chalk.greenBright.bold("[LOGGER] : CSRF Token : " + csrf))
                resolve(csrf)
            })
    })
}

const getGroup = async () => {
    log(chalk.blue.bold("[LOGGER] : Getting Group Info"))
    const id = () => Math.floor(Math.random() * (range.max - range.min) + range.min)
    return new Promise(resolve => {
        //GET REQUEST 
        request("groups.roblox.com/v1/groups/" + id(), undefined, undefined, "GET", false) //roproxy returns cloudflare html page
            .then(res => {
                resolve(res.data.id)
            })
            .catch(async () => {
                log(chalk.red.bold("[ERROR] : Group is invalid"))
                log(chalk.blue.bold("[LOGGER] : Recommended to use a deafult range [8802477, 8802487]"))
                await new Promise(resolve => setTimeout(resolve, 1000))
                resolve(getGroup(id()));
            })
    })
}

const sendMessage = async (id, csrf) => {
    log(chalk.blue.bold("[LOGGER] : Sending Message"))
    const raw = (await request("groups.roblox.com/v1/groups/" + id)).catch(() => {
        log(chalk.red.bold("[ERROR] : Group is invalid"))
        process.exit()
    }).data
    const canSend = await request("privatemessages.roproxy.com/v1/messages/" + raw.owner.userId + "/can-message", csrf)
    if (!canSend.data.canMessage) {
        log(chalk.red.bold("[ERROR] : Cannot send message to this user"))
        return
    }
    const format = {
        "subject": "Group Ally Request",
        "body": "yo i want to ally your group, please accept it :D \n also please join my group : http://www.roproxy.com/groups/" + group + "/", //don't fix the grammar caz it will be humanable and legit like
        "recipientId": raw.owner.userId,
    }
    request("privatemessages.roproxy.com/v1/messages/send", csrf, format)
        .then(() => {
            log(chalk.green.bold("[SUCCESS] : Message sent"))
            resolve(csrf)
        })
        .catch(() => {
            log(chalk.blue.bold("[LOGGER] : Message could not be sent, skipping..."))
            reject(csrf)
        })
}



const sendAlly = async (id, csrf) => {
    log(chalk.blue.bold("[LOGGER] : Sending ally request to " + id))
    return new Promise(async (resolve, reject) => {
        try {
            await request("groups." + (proxyType == 1 ? "roproxy" : "roblox") + ".com/v1/groups/" + group + "/relationships/allies/" + id, csrf)
            log(chalk.green("[Success] : Sent to" + id))
            if (webhook != "") await axios.post(webhook, {
                avatar_url: "https://cdn.discordapp.com/avatars/715220624154558554/711c4bd66b0c300e6e31837c77879e8b.png?size=1024",
                embeds: [
                    {
                        author: {
                            name: "Ally Sent",
                            url: "https://roblox.com/groups/" + id
                        }
                    }]
            }).catch(() => { })
            sendMsg && await sendMessage(id, csrf)
            resolve()
        } catch (err) {
            if (err?.response?.status == 429) {
                log(chalk.red("[Error] : Rate Limited (429)"))
                if (proxyType == 2) {
                    log(chalk.magentaBright.bold("[LOGGER] : Trying next proxy"));
                    proxyLength++
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    resolve()
                }
                if (useMultiCookie == "Y" || useMultiCookie == "y") {
                    log(chalk.magentaBright.bold("[LOGGER] : Using next cookie"));
                    cookie = cookies[cookieLength++]
                    reject();
                }
                await sleep(20000)
                resolve()
            } else if (err?.response?.status == 403) {
                log(chalk.red("[Error] : Forbidden (403)"))
                if (useMultiCookie == "Y" || useMultiCookie == "y") {
                    log(chalk.magentaBright.bold("[LOGGER] : Invalid cookie"));
                    log(chalk.magentaBright.bold("[LOGGER] : Trying next cookie"));
                    cookie = cookies[cookieLength++]
                    reject();
                }
                log(chalk.magentaBright.bold("[LOGGER] : check if the bot is in the group and has permission to ally as well as the the cookie is valid"))
                log(chalk.magentaBright.bold("[LOGGER] : Retrying in 20 seconds"))
                await new Promise(resolve => setTimeout(resolve, 20))
                resolve()
            } else if (err?.response?.status == 404) {
                resolve() //group not found which is too rare, only occur when the group is deleted after we get the group
            } else if (err?.response?.status == 400) {
                log(chalk.red("[ERROR] : Already sent ally request"))
                resolve();
            } else {
                log(chalk.yellowBright("[DEBUGGER] : " + err))
                reject();
            }
            resolve()
        }
    })
}

const main = async (id, index = 0, csrf) => {
    return new Promise(async (resolve,) => {
        log(chalk.blue.bold("[LOGGER] : Getting getting group allies id : " + id + `\n${index !== 0 ? "index : " + index : ""}`));
        try {
            const res = await request("groups." + (proxyType == 1 ? "roproxy" : "roblox") + ".com/v1/groups/" + id + "/relationships/allies?StartRowIndex=" + index + "&MaxRows=100", undefined, undefined, "GET", false); //most likey it will fetch all
            if (res.data.relatedGroups.length < 1) return resolve();
            for (id of res.data.relatedGroups.map(e => e.id.toString())) {
                await sendAlly(id, csrf);
            }
            if (res.data.totalGroupCount >= 100) return resolve(await main(id, res.data.nextRowIndex)); // Fetch the next page recursively
            resolve(); // there is no more page stop the recursion
        } catch (error) {
            console.log(error.response.data)
            //Incase some error occurs, we will skip the group
            log(chalk.red.bold("[ERROR] : unable to get group allies"));
            csrf = await getCSRF();
            resolve(main(id, index, csrf));
        }
    })
};

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
    log(chalk.blue.bold("\t\t\t\t\tBy:"))
    log(chalk.blue.bold("\t\t\t\t\tDiscord :  _mrunknown_"))
    log(chalk.blue.bold("\t\t\t\t\tGithub :  @CodeCarbon"))
    log(chalk.blue.bold("\t\t\t\t\tDiscord ~ Server : https://discord.gg/QT4MUZKjjp\n\n"))
    const version = (await axios.get("http://raw.githubusercontent.com/CodeCarbon/Roblox-Ally-Bot/main/version")).data
    fs.readFileSync("version").toString() !== version.toString() && await update()
    var useMultiCookie = "N";
    log(chalk.magentaBright.bold("[OPTIONS] \n\t 0. no-proxy \n\t 1. roproxy \n\t 2. Custom proxy[from proxy.txt] <Recommend>\n "))
    const ans = await rl.question(chalk.redBright.bold("[INPUT] ~ (0 - 2) : "))
    if (ans == "1") {
        proxyType = 1
        log(chalk.blue.bold("[LOGGER] : Using roproxy"))
    } else if (ans == "2") {
        proxyType = 2
        log(chalk.blue.bold("[LOGGER] : Using proxy from proxy.txt[Format : IP:PORT]"))
    } else {
        log(chalk.blue.bold("[LOGGER] : No-Proxy"))
    }
    if (cookie.length < 1) {
        log(chalk.blue.bold("[LOGGER] : Cookie is empty"))
        await ask()
    } else {
        const answer = await rl.question(chalk.redBright.bold("[INPUT] Use Previous configuration ? [Y/N] : "))
        answer == "N" || answer == "n" ? await ask() : log(chalk.blue.bold("[LOGGER] : Using previous configuration"))
    }
    if (fs.readdirSync("./").includes("cookies.json")) {
        log(chalk.magentaBright.bold("[LOGGER] : cookies.json is detected[Contact me on discord _mrunknown_ if you wanna use this]"));
        useMultiCookie = await rl.question(chalk.redBright.bold("[INPUT] Use cookies.json ? [Y/N] : "))
    }
    log(chalk.blue.bold("[LOGGER] : Starting..."))
    if (useMultiCookie == "Y" || useMultiCookie == "y") {
        cookies = JSON.parse(fs.readFileSync("cookies.json"))
        if (cookies.length == 0) {
            log(chalk.red.bold("[ERROR] : cookies.json is empty"))
            process.exit()
        }
        log(chalk.blue.bold("[LOGGER] : " + cookies.length + " accounts detected"))
        cookie = cookies[cookieLength]
    }
    weblog("START", "Bot Started")
    var csrf = await getCSRF()
    while (true) {
        try {
            const sentGroup = await getGroup();
            await sendAlly(sentGroup, csrf);
            await main(sentGroup, 0, csrf);
        } catch {
            csrf = await getCSRF()
        }
    }
})();