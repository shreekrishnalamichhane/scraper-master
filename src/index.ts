/* Standard Libraries Start */
const server = require('http').createServer();
import dotenv from "dotenv"
dotenv.config()
/* Standard Libraries End */

/* Custom Libraries Start */
import Log from "./helpers/log";
import PingPongController from "./controllers/PingPongController";
import JobService from "./services/JobService";
import JobController from "./controllers/JobController";
import { randomInt, randomUUID } from "crypto";
/* Custom Libraries End */

/* Custom Configurations Start */
const PORT = process.env.PORT || 6000;
const io = require('socket.io')(server, {
    path: '/'
});
/* Custom Configurations End */

// Release all abandoned jobs at system restart
(async () => {
    Log.log("Job Release", "All abondoned jobs released at startup")
    await JobService.releaseAllReservedJob();
})()



io.on('connection', (client: any) => {
    Log.log('Connect', 'Client Connected : ' + client.id);

    setTimeout(async () => {
        await JobService.createJobIfNotExists({
            url: "https://p2.gov.np?id=" + randomInt(10),
            status: "free",
            contentHashId: randomUUID(),
        })
        client.emit('dispatch_ready')
    }, 15000)

    // PingPongController.pingClient(client);
    client.on('ping', () => PingPongController.pongClient(client));
    client.on('pong', () => PingPongController.gotPongBack(client));
    client.on("job", () => JobController.onJobRequest(client))
    client.on("submit", (payload: any) => JobController.onJobSubmit(client, payload))
    client.on('disconnect', () => PingPongController.whenDisconnected(client));
});

(async () => {
    try {
        let startFinished = false;
        await new Promise((resolve, reject) => {
            server.listen(PORT, () => {
                if (!startFinished) {
                    startFinished = true;
                    Log.log('Info', "Server running at port : " + PORT)
                    resolve(PORT);
                }
            });
            server.once('error', (err: any) => {
                if (!startFinished) {
                    startFinished = true;
                    reject(err);
                }
            });
        });
    } catch (e) {
        Log.log('Error', 'There was an error starting the server:' + e);
    }
})()