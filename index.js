import axios from "axios"
import chalk from "chalk"

const cookie = " YOUR COOKIE  HERE"
const group = "6290210" // group id

// who cares about impure fn 🥱 ?
const request = async (api, csrf = "") => {
    return axios.post("https://" + api, "", {
        headers: {
            Cookie: ".ROBLOSECURITY=" + cookie,
            'X-Csrf-Token': csrf,
        },
    })
}

const getCSRF = async () => {
    console.log(chalk.blue.bold("[LOGGER] : Getting CSRF Token"))
    return new Promise(resolve => {
        request("auth.roblox.com/v2/logout")
            .catch(res => {
                const csrf = res.response.headers['x-csrf-token']
                console.log(chalk.blue.bold("[LOGGER] : CSRF Token : " + csrf))
                resolve(csrf)
            })
    })
}
(async () => {
    console.log(chalk.blue.bold("By :"))
    console.log(chalk.blue.bold("Discord :  _mrunknown_"))
    console.log(chalk.underline.blue.bold("Github :  @CodeCarbon"))

    var csrf = await getCSRF()
    while (true) {
        const sentGroup = Math.floor(Math.random() * 1150000)
        console.log(chalk.blue.bold("[LOGGER] : Sending request to : " + sentGroup))
        //using "await" to make sure the request is sent in order
        //removing .then() and .catch() and using try/catch instead
        try {
            await request("groups.roblox.com/v1/groups/" + group + "/relationships/allies/" + sentGroup, csrf)
            console.log(chalk.green("[Success] :" + sentGroup))
        } catch (err) {
            console.log(chalk.red("[Error] : " + err))
            if (err.response.status == 429) {
                console.log(chalk.red("[Error] : Rate Limited"))
                console.log(chalk.blue.bold("[LOGGER] : It is expected to be 5 requests per 5 to 10 minutes"))
                console.log(chalk.blue.bold("[LOGGER] : Waiting 5 minutes"))
                await new Promise(resolve => setTimeout(resolve, 500000))
            }
            csrf = await getCSRF()
        }
    }
})();
