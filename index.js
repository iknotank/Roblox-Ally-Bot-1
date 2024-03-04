//-----------------------MODULES-----------------------//

//-----EXTERNAL MODULES------//
import axios from "axios";
import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from 'nanospinner';

//------BUILD-IN MODULES------//
import fs from "node:fs";

//------CUSTOM MODULES------//
//import {ln, event} from "./dash.js";
//in next update

//-----------------------DEFINE-----------------------//


const log = console.log

//-----------------------CONFIGURATIONS-----------------------//

//Load data from data.json
const data = fs.readFileSync("data.json")
const json = JSON.parse(data)
var cookie = json.cookie //cookie format : [.ROBLOSECURITY, .RBXIDCHECK]
var group = json.group
var webhook = json.webhook
var range = json.range
var sendMsg = json.msg

//Proxy
var proxyType = 0 // 0 for no-proxy 1 for roproxy 2 for proxies from proxy.txt
const proxies = fs.readFileSync("proxy.txt").toString().split("\n")
var proxyLength = 0

//Multi cookie
const cookies = JSON.parse(fs.readFileSync("cookies.json"));
var cookieLength = 0
var useMultiCookie = false


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
        // weblog("PROXY", " No more proxies available, Reading proxies from start")
        log(chalk.blue.bold("[LOGGER] : waiting 5 minutes"))
        await sleep(1000 * 5 * 60)
        proxyLength = 0
    }
    return proxies[proxyLength];
}

const sleep = async ms => {
    log(chalk.blue.bold("[LOGGER] : Waiting " + Math.floor(ms / 1000) + " seconds"));
    // weblog("Delay", `Waiting ${Math.floor(ms / 1000)} seconds`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

const askStart = async () => {
    const ans = await inquirer.prompt([
        /*{
            type: "confirm",
            name: "dash",
            message: `Do you want to use the dash ? ${chalk.magentaBright("<Recommended>")}`,
            default: true
        },
        */
        {
            type: "list",
            name: "proxyType",
            message: "Select Proxy Type",
            choices: ["No-Proxy", "roproxy", `Custom Proxy ${chalk.magentaBright("<Recommend>")}`],
            deafult: "No-Proxy"
        },
        {
            type: "list",
            name: "cookie",
            message: "Select Cookie Mode",
            choices: ["Single Cookie", `Multi Cookie ${chalk.magentaBright("<Recommended>")}`],
            /*
            {
            key: "single",
            name: "Single Cookie"
        },
        {
            key: "multi",
            name: `Multi Cookie ${chalk.magentaBright("<Recommended>")}`,
        }
        ],
        */
            default: "Single Cookie"
        }
    ])
    if (ans.proxyType == "1") {
        proxyType = 1
        log(chalk.blue.bold("[LOGGER] : Using roproxy"))
    } else if (ans.proxyType == "2") {
        proxyType = 2
        log(chalk.blue.bold("[LOGGER] : Using proxy from proxy.txt<IP:PORT>"))
    } else {
        log(chalk.blue.bold("[LOGGER] : No-Proxy"))
    }

    if (ans.cookie == "Single Cookie") {
        useMultiCookie = false
        log(chalk.blue.bold("[LOGGER] : Using Single Cookie"))
    } else {
        useMultiCookie = true
        log(chalk.blue.bold("[LOGGER] : Using Multi Cookie"))
         //log(chalk.blue.bold("[LOGGER] : Look at dash for more info"));
         log(chalk.blue.magentaBright("Look at readme.md file on github for more info"));
            if (cookies.length == 0) {
                log(chalk.red.bold("[ERROR] : cookies.json is empty"))
                process.exit()
            }
            log(chalk.blue.bold("[LOGGER] : " + cookies.length + " accounts detected"))
            cookie = cookies[cookieLength]
    }
    if (cookie.length < 0 && !useMultiCookie) {
        await ask()
    } else {
        const usePreConfig = await inquirer.prompt([
            {
                type: "confirm",
                name: "usePreConfig",
                message: "Use pre-configured settings ?",
                default: true
            }
        ])
        if (!usePreConfig.usePreConfig) {
            await ask()
        }
    }
}


const ask = async () => {
    log(chalk.magentaBright.bold("\n[LOGGER] : Right Click inside this window to paste"))
    log(chalk.magentaBright.bold("[LOGGER] : Press Enter to submit\n"))

    const answer = await inquirer.prompt([
        {
            type: "input",
            name: "roboxsecurity",
            message: "Enter .ROBLOSECURITY : "
        },
        {
            type: "input",
            name: "rbxidcheck",
            message: "Enter .RBXIDCHECK[Press Enter if doesn't exits] : "
        },
        {
            type: "input",
            name: "group",
            message: "Enter Group ID : "
        },
        {
            type: "input",
            name: "webhook",
            message: "Enter Webhook [Press enter to leave empty] : ",
        },
        {
            type: "list",
            name: "range",
            message: "Custom Range ?: ",
            choices: [{
                key: "Default",
                name: "Default [8802477, 8802487]",
            }, "Custom"],
            default: "Default",
        },
    ])
    if (answer.range == "Custom") {
        const rangeQ = await inquirer.prompt([
            {
                type: "number",
                name: "min",
                message: "Enter Min[ex : 8802477, must be lower than max] : "
            },
            {
                type: "number",
                name: "max",
                message: "Enter Max[ex : 8802487 must be higher than min] : "
            }
        ])
        range = {
            min: rangeQ.min,
            max: rangeQ.max
        }
    } else {
        range = {
            min: 8802477,
            max: 8802487
        }
    }

    cookie = [answer.roboxsecurity, answer.rbxidcheck]
    group = answer.group
    webhook = answer.webhook

    fs.writeFileSync("data.json", JSON.stringify({
        cookie: cookie,
        group: group,
        webhook: webhook,
        range: range
    }));
    log(chalk.green.bold("\n[LOGGER] : CONFIGURATION SAVED\n"))
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
            Cookie: useCookie ? ".ROBLOSECURITY=" + cookie[0] + "; .RBXIDCHECK=" + cookie[1] : "",
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
    const spinner = createSpinner("Getting CSRF Token")
    spinner.start() 
    // weblog("CSRF", "Getting CSRF Token")
    return new Promise(resolve => {
        request("auth." + (proxyType == 1 ? "roproxy" : "roblox") + ".com/v2/logout")
            .catch(async res => {
                var csrf = res.response?.headers?.['x-csrf-token']
                if (!csrf) {
                    spinner.error({ text: chalk.redBright("Invalid cookie") })
                    if (cookies.length > 0) {
                        log(chalk.magentaBright.bold("[LOGGER] : Trying next cookie"));
                        cookie = cookies[cookieLength++]
                        csrf = await getCSRF();
                    }
                    process.exit()
                }
                spinner.success({ text: chalk.greenBright("CSRF Token : " + csrf), mark:' '})
                resolve(csrf)
            })
    })
}

const getGroup = async () => {
    const spinner = createSpinner("Getting Group").start()
    const id = () => Math.floor(Math.random() * (range.max - range.min) + range.min)
    return new Promise(resolve => {
        //GET REQUEST
        request("groups.roblox.com/v1/groups/" + id(), undefined, undefined, "GET", false) //roproxy returns cloudflare html page
            .then(res => {
                spinner.success({ text : "Group ID : " + res.data.id, mark:" " })
                resolve(res.data.id)
            })
            .catch(async () => {
                spinner.warn({ text: chalk.yellowBright("Invalid id Retrying..."),mark:"" })
                await new Promise(resolve => setTimeout(resolve, 1000))
                resolve(getGroup(id()));
            })
    })
}

const sendAlly = async (id, csrf) => {
    const spinner = createSpinner("Sending Ally Request ", id).start()
    return new Promise(async (resolve, reject) => {
        try {
            await request("groups." + (proxyType == 1 ? "roproxy" : "roblox") + ".com/v1/groups/" + group + "/relationships/allies/" + id, csrf)
            spinner.success({ text: chalk.greenBright("Sent to " + id), mark:"" })
            resolve()
        } catch (err) {
            if (err?.response?.status == 429) {
                spinner.warn({ text: chalk.yellowBright("Rate Limited(429)")})
                if (proxyType == 2) {
                    log(chalk.magentaBright.bold("[LOGGER] : Trying next proxy"));
                    proxyLength++
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    resolve()
                }
                if (useMultiCookie) {
                    log(chalk.magentaBright.bold("[LOGGER] : Trying next cookie"));
                    cookie = cookies[cookieLength++]
                    reject();
                }
                await sleep(1000 * 60 * 10)
                resolve()

            } else if (err?.response?.status == 403) {
                if (useMultiCookie) {
                    spinner.warn({ text: chalk.yellowBright("Invalid cookie or insufficient permission")})
                    log(chalk.magentaBright.bold("[LOGGER] : Trying next cookie"));
                    cookie = cookies[cookieLength++]
                    reject();
                }
                log(chalk.magentaBright.bold("[LOGGER] : check if the bot is in the group and has permission to ally as well as the the cookie is valid"))
                log(chalk.magentaBright.bold("[LOGGER] : Retrying in 20 seconds"))
                await new Promise(resolve => setTimeout(resolve, 1000 * 20))
                resolve()
            } else if (err?.response?.status == 404) {
                resolve() //group not found which is too rare, only occur when the group is deleted after we get the group
            } else if (err?.response?.status == 400) {
                spinner.warn({ text: chalk.yellowBright("Already sent ally request"), mark : chalk.yellowBright("[!]")})
                resolve();
            } else {
                spinner.error({ text: chalk.redBright("Error Occured")})
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
            resolve(); // there is no more page, stop the recursion
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

    const spinner = createSpinner(" Checking For Updates").start()

    const version = (await axios.get("http://raw.githubusercontent.com/CodeCarbon/Roblox-Ally-Bot/main/version")).data
    if (fs.readFileSync("version").toString() !== version.toString()) {
        spinner.warn({ text: chalk.yellowBright(" New version available...\n") })
        process.exit();
    } else {
        spinner.success({ text: chalk.greenBright(" UP-TO-DATE\n") })
    }

    await askStart();

    log(chalk.blue.bold("[LOGGER] : Starting..."))

    // weblog("START", "Bot Started")
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