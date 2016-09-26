var http = require('http');
var fs = require('fs'); // Using the filesystem module
var httpServer = http.createServer(requestHandler);
var url = require('url');
httpServer.listen(8080);
console.log('Server listening on port 8080');       

function serve(path, res){
    fs.readFile(path, 
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading: ' + path);
            }
            res.writeHead(200);
            res.end(data);
        }
    );
}

function serveBodyPart(part, res){
    var pathToDocument = __dirname+"/head/index.html";
    console.log("serving body part: ", pathToDocument);     
    serve(pathToDocument, res);      
}

function serveOther(theRequest, res){
    var pathToDocument = __dirname+theRequest;
    console.log("serving other: ", pathToDocument);
    serve(pathToDocument, res);
}

function requestHandler(req, res) {
    var theRequest = url.parse(req.url).pathname;  
    if(theRequest == "/"){
        serveOther(theRequest+"drawing/index.html", res);
    }else{
        serveOther(theRequest, res);
    }  
}




// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
var all_data = {
    "head":{},
    "body":{},
    "leg":{}
};
var active_users = {};
var imageData = {};
var awaitingImages = [];

io.sockets.on('connection', 
    // We are given a websocket object in our function
    function (socket) {
    
        console.log("We have a new client: " + socket.id);
        active_users[socket.id] = {};
        active_users[socket.id]["mode"] = "head";



        socket.on('imageDone', function(data) {
            userID = socket.id;
            bodyPart = data["part"];
            imageData = data["image"];
            // console.log("got image data for: [", bodyPart, "] from", userID);

            if(!all_data[bodyPart][userID]){
                all_data[bodyPart][userID] = {};
            }

            // all_data[bodyPart][userID]["img"] = bodyPart+"_imageDataof_"+userID;
            // imageData[bodyPart+"_imageDataof_"+userID] = imageData
            all_data[bodyPart][userID]["img"] = imageData; 
            all_data[bodyPart][userID]["used"] = 0;

            
            var changeTo = "";

            if(bodyPart == "head") changeTo = "body";    
            else if(bodyPart == "body") changeTo = "leg"; 
            else if(bodyPart == "leg") changeTo = "output";       

            active_users[userID]["mode"] = changeTo;
            io.to(userID).emit('changeMode', changeTo); 

            if(active_users[userID]["mode"] == "output"){
                awaitingImages.push(userID);
                tryToSendImages();
            }

            console.log("data:", all_data);
            console.log("active:", active_users);
            // console.log("awaitingImages", awaitingImages);
        });

        // console.log("active:", active_users);

        function deleteUser(ID){
            console.log("user", ID, "diconnected. Bye!");
            delete active_users[ID];
            delete all_data["head"][ID];
            delete all_data["body"][ID];
            delete all_data["leg"][ID];
        }

        function num(object){
            return Object.keys(object).length
        }

        function shuffle(a) {
            var j, x, i;
            for (i = a.length; i; i--) {
                j = Math.floor(Math.random() * i);
                x = a[i - 1];
                a[i - 1] = a[j];
                a[j] = x;
            }
        }

        function tryToSendImages(){
            
            var satisfiedUsers = [];
            for(i in awaitingImages){
                waiting_user = awaitingImages[i];
                console.log("user waits:", waiting_user);
                var heads_found = {};
                var bodies_found = {};
                var legs_found = {};

                var peoplesubmitted = Object.keys(all_data["head"]);
                shuffle(peoplesubmitted);
                for(j in peoplesubmitted){
                    if(peoplesubmitted[j] != waiting_user){
                        if(all_data["head"][peoplesubmitted[j]]["used"] < 2){
                            heads_found[peoplesubmitted[j]] = all_data["head"][peoplesubmitted[j]]["img"];
                            // all_data["head"][j]["used"] += 1;
                        }
                    } 
                    if(num(heads_found) >= 2) break;
                }

                peoplesubmitted = Object.keys(all_data["body"]);
                shuffle(peoplesubmitted);
                for(j in peoplesubmitted){
                    if(peoplesubmitted[j] != waiting_user){
                        if(all_data["body"][peoplesubmitted[j]]["used"] < 2){
                            bodies_found[peoplesubmitted[j]] = all_data["body"][peoplesubmitted[j]]["img"];
                            // all_data["body"][j]["used"] += 1;
                        }
                    }
                    if(num(bodies_found) >= 2) break; 
                }

                peoplesubmitted = Object.keys(all_data["leg"]);
                shuffle(peoplesubmitted);
                for(j in peoplesubmitted){
                    if(peoplesubmitted[j] != waiting_user){
                        if(all_data["leg"][peoplesubmitted[j]]["used"] < 2){
                            legs_found[peoplesubmitted[j]] = all_data["leg"][peoplesubmitted[j]]["img"];
                            // all_data["leg"][j]["used"] += 1;
                        }
                    } 
                    if(num(legs_found) >= 2) break; 
                }

                // console.log("heads_found:", heads_found);

                if(num(heads_found) == 2 && num(bodies_found) == 2 && num(legs_found) == 2){
                    console.log("sending images to ", waiting_user);
                    
                    var own_head = all_data["head"][waiting_user]["img"];
                    // all_data["head"][waiting_user]["used"] += 1;
                    var own_body = all_data["body"][waiting_user]["img"];
                    // all_data["body"][waiting_user]["used"] += 1;
                    var own_leg = all_data["leg"][waiting_user]["img"];
                    // all_data["leg"][waiting_user]["used"] += 1;

                    var dataToSend = {
                        "elses":{   "heads": heads_found,
                                    "bodies": bodies_found,
                                    "legs": legs_found
                                },
                        "own":  {   "heads": {waiting_user: own_head},
                                    "bodies": {waiting_user: own_body},
                                    "legs": {waiting_user: own_leg},
                                }
                    }
                    // console.log(dataToSend);
                    io.to(waiting_user).emit('output_images', dataToSend);

                    for(user in heads_found){
                        all_data["head"][user]["used"] += 1;
                    }
                    for(user in bodies_found){
                        all_data["body"][user]["used"] += 1;
                    }
                    for(user in legs_found){
                        all_data["leg"][user]["used"] += 1;
                    }

                    satisfiedUsers.push(waiting_user);
                } 
            }


            var awaitingImages_new = [];
            console.log("waiting:", awaitingImages);
            for(i in awaitingImages){
                console.log("checking", awaitingImages[i]);
                var deleteIt = false;
                for(j in satisfiedUsers){
                    if(awaitingImages[i] == satisfiedUsers[j]){    
                        deleteIt = true;
                    }
                }
                if(deleteIt){
                    console.log("deleting", awaitingImages[i]); 
                }else{
                    awaitingImages_new.push(awaitingImages[i]);
                }
            }
            awaitingImages = awaitingImages_new;
            console.log("still waiting:", awaitingImages);

        }

        socket.on('disconnect', function() {
            deleteUser(socket.id);

        });
    }
);

