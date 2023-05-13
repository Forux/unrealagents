import express from 'express'
import path from 'path'
import http from 'http'
import bodyParser from 'body-parser'
import fs from "fs";
import pathUtil from "path";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: "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",
});

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
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
            console.log(pathUtil.resolve(fileName));
            fs.writeFileSync(fileName, "");
            req.on('readable', async () => {
                console.log('readable');
                let data = req.read();
                if (data) {
                    fs.appendFileSync(fileName, data);
                } else {
                    console.log('finish');
                    let question = await this.speechToText(fileName);
                    let answear = await this.getTheAnswear(question);
                    console.log("answear", answear);
                }
            });
        });

        this.server = new http.Server(app)
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }

    private async getTheAnswear (question) {
        try {
            const openai = new OpenAIApi(configuration);

            const resp = await openai.createChatCompletion(
                {
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user", 
                        content: question,
                    }],
                    temperature: 0.5,
                    max_tokens: 256,
                    n: 1
                }
            );
            //fs.writeFileSync("answear.json", JSON.stringify(resp.data));

            return resp.data.choices[0].message.content;
        } catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
            return "";
        }
    }

    private async speechToText (speechFileName) {

        try {
            const openai = new OpenAIApi(configuration);

            const resp = await openai.createTranscription(
                fs.createReadStream(speechFileName),
                "whisper-1",
                "",
                "json",
                void 0,
                void 0,
                {
                    maxBodyLength: 25000000
                }
            );

            return resp.data.text;
        } catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
            return "";
        }
    }
}

new App(port).Start()
