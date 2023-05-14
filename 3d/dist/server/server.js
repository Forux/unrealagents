"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_2 = __importDefault(require("path"));
const openai_1 = require("openai");
const aws_cli_js_1 = require("aws-cli-js");
var awsOptions = new aws_cli_js_1.Options('AKIA4BCD53MJYEZF7T75', '6YrQsOfTu9r8JXQsMrDrlfeYwmDwb6L7RZaNRlK1', '', path_2.default.resolve("./"), 'aws');
const configuration = new openai_1.Configuration({
    apiKey: "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",
});
const port = 80;
class App {
    constructor(port) {
        this.port = port;
        const app = (0, express_1.default)();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        //app.use(bodyParser.raw({type: 'application/octet-stream', limit : '100mb'}))
        // In the webpack version of the boilerplate, it is not necessary
        // to add static references to the libs in node_modules if
        // you are using module specifiers in your client.ts imports.
        //
        // Visit https://sbcode.net/threejs/module-specifiers/ for info about module specifiers
        //
        // This server.ts is only useful if you are running this on a production server or you
        // want to see how the production version of bundle.js works
        //
        // to use this server.ts
        // # npm run build        (this creates the production version of bundle.js and places it in ./dist/client/)
        // # tsc -p ./src/server  (this compiles ./src/server/server.ts into ./dist/server/server.js)
        // # npm start            (this starts nodejs with express and serves the ./dist/client folder)
        //
        // visit http://127.0.0.1:3000
        app.post("/question", (req, res) => {
            let fileName = 'audio/aud' + Date.now() + '.wav';
            //console.log(pathUtil.resolve(fileName));
            fs_1.default.writeFileSync(fileName, "");
            req.on('readable', async () => {
                //console.log('readable');
                let data = req.read();
                if (data) {
                    fs_1.default.appendFileSync(fileName, data);
                }
                else {
                    //console.log('finish');
                    let question = await this.speechToText(fileName);
                    try {
                        let answear = JSON.parse(await this.getTheAnswear(question));
                        console.log("answear", answear);
                        let voiceName = await this.generateVoice(answear.text);
                        res.send(JSON.stringify({
                            audioFile: voiceName,
                            placeNumber: answear.pointNumber
                        }));
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            });
        });
        this.server = new http_1.default.Server(app);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
    async generateVoice(text) {
        const aws = new aws_cli_js_1.Aws(awsOptions);
        let returnFileName = "audio/answer" + Date.now() + ".mp3";
        let fileName = "dist/client/" + returnFileName;
        let command = `polly synthesize-speech --output-format mp3 --voice-id Joanna --text "${text}" ${fileName}`;
        //fs.writeFileSync("test.txt", command);
        console.log("voice start");
        let data = await aws.command(command);
        //console.log('voice data = ', data);
        console.log('voice done');
        return returnFileName;
    }
    async getTheAnswear(question) {
        try {
            const openai = new openai_1.OpenAIApi(configuration);
            const resp = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{
                        role: "user",
                        content: `${question}`,
                    }, {
                        role: "system",
                        content: `Answers must always be in English no mater what.
                        Also answear must be in JSON format describe below
                        {"pointNumber": "number [position in places list]", "text": "yourAnswer"}
                        You control a character in a game. Your character are in a room,
                        where there are multiple places, you can walk to any of them while answearing
                        So if user will ask you to go to specific place you can specify in json format place name
                        You can use only places from the array below, you must specify position in array of places starting from 0.
                        You can walk around specifying that places from list below.
                        Be sure to check that there are such a place in list below, there are no other places in the room only this ones:
                        ["Start Position", "Red Cube", "Green Cube", "Yellow Sphere", "Blue Sphere"]
                        If there are no such places user asked about in the list below please specify as place position -1,
                        and answear that you do not see such a place here.
                        You start at the "Start Position" її номер 0, if you do not need to go anywhere specify -1 position number
                        `,
                    }],
                temperature: 0,
                max_tokens: 256,
                n: 1
            });
            //fs.writeFileSync("answear.json", JSON.stringify(resp.data));
            return resp.data.choices[0].message.content;
        }
        catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            }
            else {
                console.log(error.message);
            }
            return "";
        }
    }
    async speechToText(speechFileName) {
        try {
            const openai = new openai_1.OpenAIApi(configuration);
            const resp = await openai.createTranscription(fs_1.default.createReadStream(speechFileName), "whisper-1", "", "json", void 0, "", {
                maxBodyLength: 25000000
            });
            console.log("question text:", resp.data.text);
            return resp.data.text;
        }
        catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            }
            else {
                console.log(error.message);
            }
            return "";
        }
    }
}
new App(port).Start();
